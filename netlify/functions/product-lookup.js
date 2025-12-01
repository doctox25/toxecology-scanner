const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const PRODUCTS_TABLE = 'products_exposures';

async function searchAirtable(barcode) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${PRODUCTS_TABLE}?filterByFormula={upc_barcode}="${barcode}"`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data.records && data.records.length > 0) {
      const record = data.records[0];
      return {
        source: 'ToxEcology',
        airtableId: record.id,
        productId: record.fields.product_id,
        name: record.fields.product_name,
        brand: record.fields.brand,
        category: record.fields.category,
        subCategory: record.fields.sub_category,
        ingredients: record.fields.ingredient_list_raw,
        imageUrl: record.fields.image_url,
        barcode: barcode,
        hazardScore: record.fields.hazard_score_0_100,
        hazardLevel: record.fields.hazard_level,
        domainScores: {
          parabens: record.fields.parabens_hazard_Score || 0,
          phthalates: record.fields.phthalates_hazard_Score || 0,
          vocs: record.fields.voc_hazard_Score || 0,
          metals: record.fields.metals_hazard_Score || 0,
          pfas: record.fields.PFAS_hazard_Score || 0,
          pesticides: record.fields.pesticides_hazard_Score || 0
        },
        hasHazardScore: record.fields.hazard_score_0_100 !== undefined
      };
    }
    return null;
  } catch (error) {
    console.error('Airtable search error:', error);
    return null;
  }
}

async function saveToAirtable(product, hazardData) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${PRODUCTS_TABLE}`;
  
  const prefix = product.category === 'Food' ? 'FD' : 'CP';
  const productId = `${prefix}-${Date.now().toString().slice(-6)}`;
  
  const fields = {
    product_id: productId,
    product_name: product.name,
    brand: product.brand || 'Unknown',
    category: product.category || 'Unknown',
    upc_barcode: product.barcode,
    ingredient_list_raw: product.ingredients,
    source: product.source,
    date_added: new Date().toISOString().split('T')[0]
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Airtable save failed:', response.status, errorText);
      return null;
    }
    
    const data = await response.json();
    return { airtableId: data.id, productId };
  } catch (error) {
    console.error('Airtable save error:', error);
    return null;
  }
}

async function lookupOpenFoodFacts(barcode) {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      { headers: { 'User-Agent': 'ToxEcology/3.0 (contact@toxecology.com)' } }
    );
    
    if (!response.ok) return null;
    const data = await response.json();
    if (data.status !== 1 || !data.product) return null;
    
    return {
      source: 'Open Food Facts',
      name: data.product.product_name || 'Unknown Product',
      brand: data.product.brands || 'Unknown Brand',
      ingredients: data.product.ingredients_text || null,
      category: 'Food',
      subCategory: data.product.categories ? data.product.categories.split(',')[0] : 'General',
      imageUrl: data.product.image_url || null,
      barcode: barcode
    };
  } catch (error) {
    console.error('OFF lookup failed:', error);
    return null;
  }
}

async function lookupOpenBeautyFacts(barcode) {
  try {
    const response = await fetch(
      `https://world.openbeautyfacts.org/api/v0/product/${barcode}.json`,
      { headers: { 'User-Agent': 'ToxEcology/3.0 (contact@toxecology.com)' } }
    );
    
    if (!response.ok) return null;
    const data = await response.json();
    if (data.status !== 1 || !data.product) return null;
    
    return {
      source: 'Open Beauty Facts',
      name: data.product.product_name || 'Unknown Product',
      brand: data.product.brands || 'Unknown Brand',
      ingredients: data.product.ingredients_text || null,
      category: 'Personal Care',
      subCategory: data.product.categories ? data.product.categories.split(',')[0] : 'General',
      imageUrl: data.product.image_url || null,
      barcode: barcode
    };
  } catch (error) {
    console.error('OBF lookup failed:', error);
    return null;
  }
}

async function scoreWithClaude(ingredientsList, productName, category) {
  const prompt = `Analyze this product for toxin hazards.

Product: ${productName}
Category: ${category}
Ingredients: ${ingredientsList}

Return ONLY valid JSON (no markdown):
{
  "hazard_score": <0-100>,
  "hazard_level": "<Low|Moderate|High|Very High>",
  "domain_scores": {
    "parabens": <0-100>,
    "phthalates": <0-100>,
    "vocs": <0-100>,
    "metals": <0-100>,
    "pfas": <0-100>,
    "pesticides": <0-100>
  },
  "top_concerns": [{"ingredient": "<name>", "domain": "<domain>", "concern": "<reason>"}],
  "confidence": "<high|medium|low>"
}

Scoring: 0-25 Low, 26-50 Moderate, 51-75 High, 76-100 Very High.
"Fragrance" warrants phthalates score of 30-50 due to undisclosed ingredients.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    
    if (!response.ok) {
      console.error('Claude API error:', response.status);
      throw new Error('Claude API failed');
    }
    
    const data = await response.json();
    const text = data.content[0].text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error('Claude scoring error:', error);
    return {
      hazard_score: 50,
      hazard_level: 'Moderate',
      domain_scores: { parabens: 0, phthalates: 0, vocs: 0, metals: 0, pfas: 0, pesticides: 0 },
      top_concerns: [],
      confidence: 'low',
      error: true
    };
  }
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  
  const params = event.queryStringParameters || {};
  const barcode = (params.upc || params.barcode || '').replace(/\D/g, '');
  
  if (!barcode || barcode.length < 8 || barcode.length > 14) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: 'Invalid barcode' })
    };
  }
  
  console.log('[Scanner v3.0] Looking up: ' + barcode);
  
  try {
    const cached = await searchAirtable(barcode);
    if (cached && cached.hasHazardScore) {
      console.log('[Scanner v3.0] Found in Airtable: ' + cached.name);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, source: 'ToxEcology', cached: true, product: cached })
      };
    }
    
    let product = await lookupOpenFoodFacts(barcode);
    
    if (!product) {
      product = await lookupOpenBeautyFacts(barcode);
    }
    
    if (!product) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ success: false, error: 'Product not found', barcode: barcode })
      };
    }
    
    console.log('[Scanner v3.0] Found: ' + product.name + ' (' + product.source + ')');
    
    let hazardData;
    if (product.ingredients) {
      console.log('[Scanner v3.0] Scoring with Claude...');
      hazardData = await scoreWithClaude(product.ingredients, product.name, product.category);
    } else {
      hazardData = {
        hazard_score: 40,
        hazard_level: 'Moderate',
        domain_scores: { parabens: 0, phthalates: 0, vocs: 0, metals: 0, pfas: 0, pesticides: 0 },
        top_concerns: [],
        confidence: 'low',
        noIngredients: true
      };
    }
    
    const saved = await saveToAirtable(product, hazardData);
    if (saved) {
      console.log('[Scanner v3.0] Saved as ' + saved.productId);
    }
    
    const result = {
      source: product.source,
      productId: saved ? saved.productId : null,
      name: product.name,
      brand: product.brand,
      category: product.category,
      subCategory: product.subCategory,
      ingredients: product.ingredients,
      imageUrl: product.imageUrl,
      barcode: barcode,
      hazardScore: hazardData.hazard_score,
      hazardLevel: hazardData.hazard_level,
      domainScores: hazardData.domain_scores,
      topConcerns: hazardData.top_concerns,
      confidence: hazardData.confidence,
      hasHazardScore: true,
      scoredRealTime: true
    };
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, source: product.source, cached: false, scoredBy: 'Claude', product: result })
    };
    
  } catch (error) {
    console.error('[Scanner v3.0] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: 'Server error', details: error.message })
    };
  }
};
