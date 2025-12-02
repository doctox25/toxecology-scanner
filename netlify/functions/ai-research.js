// netlify/functions/ai-research.js
// AI Agent for researching missed barcodes

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

// Research a single barcode using Claude
async function researchBarcode(barcode) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: `Research this barcode/UPC and find the product details: ${barcode}

Search for this barcode on product databases, Amazon, Walmart, manufacturer sites, etc.

Return ONLY valid JSON with what you find:
{
  "found": true/false,
  "confidence": "high|medium|low",
  "product_name": "Full Product Name",
  "brand": "Brand Name",
  "category": "Food|Personal Care|Household",
  "sub_category": "specific type",
  "ingredients": "full ingredient list if found, or null",
  "description": "brief product description",
  "sources_checked": ["list of sources you checked"],
  "notes": "any relevant notes about the search"
}

If you cannot find the product, set found: false and explain in notes.`
        }]
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { found: false, notes: 'Failed to parse response' };
  } catch (error) {
    console.error('AI research error:', error);
    return { found: false, notes: error.message };
  }
}

// Add researched product to products_exposures
async function addProduct(barcode, research) {
  const prefix = research.category === 'Food' ? 'FD' : research.category === 'Personal Care' ? 'CP' : 'HH';
  const productId = `${prefix}-${Date.now().toString().slice(-6)}`;
  
  try {
    const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/products_exposures`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          product_id: productId,
          product_name: research.product_name,
          brand: research.brand,
          category: research.category,
          upc_barcode: barcode,
          ingredient_list_raw: research.ingredients,
          source: 'AI Research',
          date_added: new Date().toISOString().split('T')[0],
        }
      }),
    });
    
    const data = await response.json();
    return data.id || null;
  } catch (error) {
    console.error('Add product error:', error);
    return null;
  }
}

// Update scan_misses record status
async function updateMissStatus(barcode, status, notes = '') {
  try {
    const findUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/scan_misses?filterByFormula={barcode}="${barcode}"`;
    const findResponse = await fetch(findUrl, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
    });
    const findData = await findResponse.json();
    
    if (findData.records?.length > 0) {
      const recordId = findData.records[0].id;
      
      await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/scan_misses/${recordId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            status: status,
            research_notes: notes,
            researched_by: 'AI Agent',
          }
        }),
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Update miss status error:', error);
    return false;
  }
}

// Get pending misses
async function getPendingMisses(limit = 10, minScans = 1) {
  try {
    const formula = `AND({status}="pending",{scan_count}>=${minScans})`;
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/scan_misses?filterByFormula=${encodeURIComponent(formula)}&sort[0][field]=scan_count&sort[0][direction]=desc&maxRecords=${limit}`;
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
    });
    const data = await response.json();
    
    return (data.records || []).map(r => ({
      barcode: r.fields.barcode,
      scan_count: r.fields.scan_count || 1,
    }));
  } catch (error) {
    console.error('Get pending misses error:', error);
    return [];
  }
}

// ============================================
// MAIN HANDLER
// ============================================

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const params = event.queryStringParameters || {};
  const action = params.action || 'research_one';

  // ACTION: Research a single barcode
  if (action === 'research_one') {
    const barcode = params.barcode?.replace(/\D/g, '');
    
    if (!barcode) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Missing barcode parameter' }),
      };
    }

    console.log(`AI researching: ${barcode}`);
    const research = await researchBarcode(barcode);
    
    if (research.found && research.confidence !== 'low') {
      const productId = await addProduct(barcode, research);
      await updateMissStatus(barcode, 'added', `AI found: ${research.product_name}`);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          action: 'added',
          barcode,
          research,
          productId,
        }),
      };
    } else {
      await updateMissStatus(barcode, 'invalid', research.notes || 'AI could not find product');
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          action: 'not_found',
          barcode,
          research,
        }),
      };
    }
  }

  // ACTION: Process batch of pending misses
  if (action === 'process_batch') {
    const limit = Math.min(parseInt(params.limit) || 5, 20);
    const minScans = parseInt(params.min_scans) || 2;
    
    const pending = await getPendingMisses(limit, minScans);
    
    if (pending.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'No pending misses to process',
          processed: 0,
        }),
      };
    }

    const results = [];
    
    for (const miss of pending) {
      console.log(`Processing: ${miss.barcode} (${miss.scan_count} scans)`);
      
      const research = await researchBarcode(miss.barcode);
      
      if (research.found && research.confidence !== 'low') {
        const productId = await addProduct(miss.barcode, research);
        await updateMissStatus(miss.barcode, 'added', `AI found: ${research.product_name}`);
        results.push({ barcode: miss.barcode, status: 'added', name: research.product_name });
      } else {
        await updateMissStatus(miss.barcode, 'invalid', research.notes || 'Not found');
        results.push({ barcode: miss.barcode, status: 'not_found', notes: research.notes });
      }
      
      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 1000));
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
    };
  }

  // ACTION: Get status/stats
  if (action === 'status') {
    const pending = await getPendingMisses(100, 1);
    const highPriority = pending.filter(p => p.scan_count >= 3);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        total_pending: pending.length,
        high_priority: highPriority.length,
        top_requested: pending.slice(0, 10),
      }),
    };
  }

  return {
    statusCode: 400,
    headers,
    body: JSON.stringify({
      success: false,
      error: 'Invalid action',
      valid_actions: ['research_one', 'process_batch', 'status'],
    }),
  };
};
