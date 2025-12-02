// netlify/functions/product-lookup.js
// Scanner v3.1 - Added miss tracking

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID; // Ontology base
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
};

// ============================================
// MISS TRACKING (NEW in v3.1)
// ============================================

async function logMiss(barcode, categoryHint = 'Unknown') {
  try {
    // Check if barcode already logged
    const checkUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/scan_misses?filterByFormula={barcode}="${barcode}"`;
    const checkResponse = await fetch(checkUrl, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
    });
    
    const checkData = await checkResponse.json();
    
    if (checkData.records?.length > 0) {
      // Barcode exists - increment scan_count
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
      
      console.log(`Updated miss count for ${barcode}: ${newCount}`);
      return { updated: true, count: newCount };
    } else {
      // New barcode - create record
      const today = new Date().toISOString().split('T')[0];
      
      await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/scan_misses`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            barcode: barcode,
            scan_count: 1,
            first_scanned: today,
            last_scanned: today,
            status: 'pending',
            category_hint: categoryHint,
          }
        }),
      });
      
      console.log(`Logged new miss: ${barcode}`);
      return { created: true, count: 1 };
    }
  } catch (error) {
    console.error('Miss logging error:', error);
    return { error: error.message };
  }
}

// ============================================
// LOOKUP FUNCTIONS
// ============================================

async function lookupInAirtable(barcode) {
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

async function lookupOpenFoodFacts(barcode) {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      { headers: { 'User-Agent': 'ToxEcology/3.1 (contact@toxecology.com)' } }
    );
    const data = await response.json();
    
    if (data.status === 1 && data.product) {
      return {
        name: data.product.product_name || 'Unknown Product',
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

async function lookupOpenBeautyFacts(barcode) {
  try {
    const response = await fetch(
      `https://world.openbeautyfacts.org/api/v0/product/${barcode}.json`,
      { headers: { 'User-Agent': 'ToxEcology/3.1 (contact@toxecology.com)' } }
    );
    const data = await response.json();
    
    if (data.status === 1 && data.product) {
      return {
        name: data.product.product_name || 'Unknown Product',
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

Return format:
{
  "hazardScore": 0-100,
  "hazardLevel": "Low|Moderate|High",
  "domainScores": {
    "vocs": 0-100,
    "phthalates": 0-100,
    "parabens": 0-100,
    "metals": 0-100,
    "pfas": 0-100,
    "pesticides": 0-100,
    "plastics": 0-100
  },
  "concerns": ["top concern 1", "top concern 2"]
}`
        }]
      }),
    });
    
    const data = await response.json();
    const text = data.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error('Claude scoring error:', error);
    return null;
  }
}

async function saveToAirtable(product) {
  try {
    const productId = product.category === 'Food' 
      ? `FD-${Date.now().toString().slice(-6)}`
      : `CP-${Date.now().toString().slice(-6)}`;
      
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
      body: JSON.stringify({ 
        success: false, 
        error: 'Invalid barcode format',
        message: 'Barcode must be 8-14 digits'
      }),
    };
  }

  console.log(`Looking up barcode: ${barcode}`);

  // Tier 1: Check Airtable
  let product = await lookupInAirtable(barcode);
  if (product) {
    console.log(`Found in Airtable: ${product.name}`);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, product, tier: 'airtable' }),
    };
  }

  // Tier 2: Check Open Food Facts
  let external = await lookupOpenFoodFacts(barcode);
  let categoryHint = 'Food';
  
  // Tier 3: Check Open Beauty Facts
  if (!external) {
    external = await lookupOpenBeautyFacts(barcode);
    categoryHint = 'Personal Care';
  }

  // ========================================
  // NOT FOUND - Log the miss (NEW in v3.1)
  // ========================================
  if (!external) {
    console.log(`Product not found: ${barcode}`);
    
    const missResult = await logMiss(barcode, 'Unknown');
    
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Product not found',
        barcode: barcode,
        logged: true,
        message: 'This barcode has been logged for manual research.'
      }),
    };
  }

  // Found externally - score and save
  console.log(`Found in ${external.source}: ${external.name}`);
  
  let scoring = null;
  if (external.ingredients) {
    scoring = await scoreWithClaude(external.ingredients, external.name, external.category);
  }

  product = {
    productId: `AUTO-${Date.now()}`,
    name: external.name,
    brand: external.brand,
    category: external.category,
    barcode: barcode,
    ingredients: external.ingredients,
    hazardScore: scoring?.hazardScore || 0,
    hazardLevel: scoring?.hazardLevel || 'Unknown',
    domainScores: scoring?.domainScores || {},
    concerns: scoring?.concerns || [],
    source: external.source,
    imageUrl: external.imageUrl,
    isNew: true,
  };

  // Save to Airtable for future lookups
  const recordId = await saveToAirtable(product);
  if (recordId) {
    product.id = recordId;
    console.log(`Saved to Airtable: ${recordId}`);
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true, product, tier: external.source }),
  };
};
