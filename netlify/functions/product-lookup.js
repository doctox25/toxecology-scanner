// netlify/functions/product-lookup.js
// Scanner v3.2 - 5-Tier Lookup (UPCitemdb DEV plan)

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const UPCITEMDB_API_KEY = process.env.UPCITEMDB_API_KEY;
const BARCODELOOKUP_API_KEY = process.env.BARCODELOOKUP_API_KEY;

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
};

// ============================================
// TIER 1: AIRTABLE (CACHE)
// ============================================

async function lookupAirtable(barcode) {
  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/products_exposures?filterByFormula=OR({upc_barcode}="${barcode}",{upc_barcode}="${barcode.padStart(13,'0')}",{upc_barcode}="${barcode.padStart(14,'0')}")&maxRecords=1`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
    });
    const data = await response.json();
    
    if (data.records?.length > 0) {
      const r = data.records[0].fields;
      return {
        id: data.records[0].id,
        productId: r.product_id,
        name: r.product_name,
        brand: r.brand,
        category: r.category,
        subCategory: r.sub_category,
        barcode: r.upc_barcode,
        hazardScore: r.hazard_score_0_100 || 0,
        hazardLevel: r.hazard_level || 'Unknown',
        domainScores: {
          vocs: r.voc_hazard_Score || 0,
          phthalates: r.phthalates_hazard_Score || 0,
          parabens: r.parabens_hazard_Score || 0,
          metals: r.metals_hazard_Score || 0,
          pfas: r.PFAS_hazard_Score || 0,
          pesticides: r.pesticides_hazard_Score || 0,
          plastics: r.plastics_hazard_Score || 0,
        },
        ingredients: r.ingredient_list_raw,
        source: 'ToxEcology Database',
        isNew: false,
      };
    }
    return null;
  } catch (error) {
    console.error('Airtable lookup error:', error);
    return null;
  }
}

// ============================================
// TIER 2: OPEN FOOD FACTS (FREE)
// ============================================

async function lookupOpenFoodFacts(barcode) {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      { headers: { 'User-Agent': 'ToxEcology/3.2 (contact@toxecology.com)' } }
    );
    const data = await response.json();
    
    if (data.status === 1 && data.product?.product_name) {
      return {
        name: data.product.product_name,
        brand: data.product.brands || 'Unknown Brand',
        ingredients: data.product.ingredients_text || null,
        category: 'Food',
        imageUrl: data.product.image_url,
        source: 'Open Food Facts',
      };
    }
    return null;
  } catch (error) {
    console.error('Open Food Facts error:', error);
    return null;
  }
}

// ============================================
// TIER 3: OPEN BEAUTY FACTS (FREE)
// ============================================

async function lookupOpenBeautyFacts(barcode) {
  try {
    const response = await fetch(
      `https://world.openbeautyfacts.org/api/v0/product/${barcode}.json`,
      { headers: { 'User-Agent': 'ToxEcology/3.2 (contact@toxecology.com)' } }
    );
    const data = await response.json();
    
    if (data.status === 1 && data.product?.product_name) {
      return {
        name: data.product.product_name,
        brand: data.product.brands || 'Unknown Brand',
        ingredients: data.product.ingredients_text || null,
        category: 'Personal Care',
        imageUrl: data.product.image_url,
        source: 'Open Beauty Facts',
      };
    }
    return null;
  } catch (error) {
    console.error('Open Beauty Facts error:', error);
    return null;
  }
}

// ============================================
// TIER 4: UPCITEMDB (DEV $99/mo - v1 API)
// ============================================

async function lookupUPCitemdb(barcode) {
  if (!UPCITEMDB_API_KEY) return null;
  
  try {
    const response = await fetch(
      `https://api.upcitemdb.com/prod/v1/lookup?upc=${barcode}`,
      {
        headers: {
          'Authorization': `Bearer ${UPCITEMDB_API_KEY}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      }
    );
    const data = await response.json();
    
    if (data.items?.length > 0) {
      const item = data.items[0];
      let category = 'Household';
      const cat = (item.category || '').toLowerCase();
      
      if (cat.includes('food') || cat.includes('beverage') || cat.includes('grocery')) {
        category = 'Food';
      } else if (cat.includes('beauty') || cat.includes('personal') || cat.includes('health')) {
        category = 'Personal Care';
      }
      
      return {
        name: item.title || 'Unknown Product',
        brand: item.brand || 'Unknown Brand',
        ingredients: item.description || null,
        category: category,
        imageUrl: item.images?.[0] || null,
        source: 'UPCitemdb',
      };
    }
    return null;
  } catch (error) {
    console.error('UPCitemdb error:', error);
    return null;
  }
}

// ============================================
// TIER 5: BARCODELOOKUP ($19/mo)
// ============================================

async function lookupBarcodelookup(barcode) {
  if (!BARCODELOOKUP_API_KEY) return null;
  
  try {
    const response = await fetch(
      `https://api.barcodelookup.com/v3/products?barcode=${barcode}&formatted=y&key=${BARCODELOOKUP_API_KEY}`
    );
    const data = await response.json();
    
    if (data.products?.length > 0) {
      const product = data.products[0];
      let category = 'Household';
      const cat = (product.category || '').toLowerCase();
      
      if (cat.includes('food') || cat.includes('beverage') || cat.includes('grocery')) {
        category = 'Food';
      } else if (cat.includes('beauty') || cat.includes('personal') || cat.includes('health')) {
        category = 'Personal Care';
      }
      
      return {
        name: product.title || product.product_name || 'Unknown Product',
        brand: product.brand || 'Unknown Brand',
        ingredients: product.ingredients || null,
        category: category,
        imageUrl: product.images?.[0] || null,
        source: 'Barcodelookup',
      };
    }
    return null;
  } catch (error) {
    console.error('Barcodelookup error:', error);
    return null;
  }
}

// ============================================
// MISS LOGGING
// ============================================

async function logMiss(barcode, categoryHint = 'Unknown') {
  try {
    const checkUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/scan_misses?filterByFormula={barcode}="${barcode}"`;
    const checkResponse = await fetch(checkUrl, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
    });
    const checkData = await checkResponse.json();
    
    if (checkData.records?.length > 0) {
      const rec = checkData.records[0];
      const newCount = (rec.fields.scan_count || 1) + 1;
      
      await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/scan_misses/${rec.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            scan_count: newCount,
            last_scanned: new Date().toISOString().split('T')[0],
          }
        }),
      });
      return { updated: true, count: newCount };
    } else {
      const today = new Date().toISOString().split('T')[0];
      await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/scan_misses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            barcode,
            scan_count: 1,
            first_scanned: today,
            last_scanned: today,
            status: 'pending',
            category_hint: categoryHint,
          }
        }),
      });
      return { created: true };
    }
  } catch (error) {
    console.error('Miss logging error:', error);
    return { error: error.message };
  }
}

// ============================================
// CLAUDE SCORING
// ============================================

async function scoreWithClaude(ingredients, productName, category) {
  if (!ingredients || !ANTHROPIC_API_KEY) return null;
  
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
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Analyze these ingredients for toxin hazards. Return ONLY valid JSON.

Product: ${productName}
Category: ${category}
Ingredients: ${ingredients}

Return:
{
  "hazardScore": 0-100,
  "hazardLevel": "Low|Moderate|High",
  "domainScores": {"vocs":0,"phthalates":0,"parabens":0,"metals":0,"pfas":0,"pesticides":0,"plastics":0},
  "concerns": ["concern1","concern2"]
}`
        }]
      }),
    });
    
    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (error) {
    console.error('Claude scoring error:', error);
    return null;
  }
}

// ============================================
// SAVE TO AIRTABLE
// ============================================

async function saveToAirtable(product) {
  try {
    const prefix = product.category === 'Food' ? 'FD' : product.category === 'Personal Care' ? 'CP' : 'HH';
    const productId = `${prefix}-${Date.now().toString().slice(-6)}`;
      
    const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/products_exposures`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          product_id: productId,
          product_name: product.name,
          brand: product.brand,
          category: product.category,
          upc_barcode: product.barcode,
          ingredient_list_raw: product.ingredients,
          source: product.source,
          date_added: new Date().toISOString().split('T')[0],
        }
      }),
    });
    
    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error('Airtable save error:', error);
    return null;
  }
}

// ============================================
// MAIN HANDLER
// ============================================

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const barcode = event.queryStringParameters?.upc?.replace(/\D/g, '');
  
  if (!barcode || barcode.length < 8 || barcode.length > 14) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: 'Invalid barcode (8-14 digits)' }),
    };
  }

  console.log(`[v3.2] Looking up: ${barcode}`);

  // TIER 1: Airtable (cached)
  let product = await lookupAirtable(barcode);
  if (product) {
    console.log(`✓ Tier 1 (Airtable): ${product.name}`);
    return { statusCode: 200, headers, body: JSON.stringify({ success: true, product, tier: 'Airtable' }) };
  }

  // TIER 2: Open Food Facts
  let external = await lookupOpenFoodFacts(barcode);
  if (external) {
    console.log(`✓ Tier 2 (OFF): ${external.name}`);
  }

  // TIER 3: Open Beauty Facts
  if (!external) {
    external = await lookupOpenBeautyFacts(barcode);
    if (external) console.log(`✓ Tier 3 (OBF): ${external.name}`);
  }

  // TIER 4: UPCitemdb (DEV plan - v1 API)
  if (!external) {
    external = await lookupUPCitemdb(barcode);
    if (external) console.log(`✓ Tier 4 (UPCitemdb): ${external.name}`);
  }

  // TIER 5: Barcodelookup
  if (!external) {
    external = await lookupBarcodelookup(barcode);
    if (external) console.log(`✓ Tier 5 (Barcodelookup): ${external.name}`);
  }

  // NOT FOUND - Log miss
  if (!external) {
    console.log(`✗ Not found in any tier: ${barcode}`);
    await logMiss(barcode, 'Unknown');
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Product not found',
        barcode,
        logged: true,
        message: 'Logged for AI research.',
      }),
    };
  }

  // Score with Claude if ingredients available
  let scoring = null;
  if (external.ingredients) {
    scoring = await scoreWithClaude(external.ingredients, external.name, external.category);
  }

  product = {
    productId: `AUTO-${Date.now()}`,
    name: external.name,
    brand: external.brand,
    category: external.category,
    barcode,
    ingredients: external.ingredients,
    hazardScore: scoring?.hazardScore || 0,
    hazardLevel: scoring?.hazardLevel || 'Unknown',
    domainScores: scoring?.domainScores || {},
    concerns: scoring?.concerns || [],
    source: external.source,
    imageUrl: external.imageUrl,
    isNew: true,
  };

  // Cache to Airtable
  const recordId = await saveToAirtable(product);
  if (recordId) product.id = recordId;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true, product, tier: external.source }),
  };
};
