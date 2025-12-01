const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_SCORING_BASE_ID;

const INGREDIENT_HAZARDS = {
  'methylparaben': { weight: 6, domain: 'parabens' },
  'propylparaben': { weight: 7, domain: 'parabens' },
  'butylparaben': { weight: 8, domain: 'parabens' },
  'ethylparaben': { weight: 5, domain: 'parabens' },
  'fragrance': { weight: 5, domain: 'phthalates' },
  'parfum': { weight: 5, domain: 'phthalates' },
  'diethyl phthalate': { weight: 8, domain: 'phthalates' },
  'dibutyl phthalate': { weight: 9, domain: 'phthalates' },
  'benzene': { weight: 10, domain: 'vocs' },
  'toluene': { weight: 8, domain: 'vocs' },
  'formaldehyde': { weight: 9, domain: 'vocs' },
  'acetone': { weight: 4, domain: 'vocs' },
  'isopropyl alcohol': { weight: 3, domain: 'vocs' },
  'ptfe': { weight: 8, domain: 'pfas' },
  'perfluoro': { weight: 9, domain: 'pfas' },
  'lead': { weight: 10, domain: 'metals' },
  'mercury': { weight: 10, domain: 'metals' },
  'arsenic': { weight: 10, domain: 'metals' },
  'cadmium': { weight: 9, domain: 'metals' },
  'aluminum': { weight: 4, domain: 'metals' },
  'triclosan': { weight: 7, domain: 'pesticides' },
  'glyphosate': { weight: 8, domain: 'pesticides' },
  'bpa': { weight: 7, domain: 'plastics' },
  'bisphenol': { weight: 7, domain: 'plastics' },
  'oxybenzone': { weight: 6, domain: 'vocs' },
  'sodium lauryl sulfate': { weight: 3, domain: 'vocs' },
  'sodium laureth sulfate': { weight: 3, domain: 'vocs' },
  'mineral oil': { weight: 3, domain: 'vocs' },
  'petrolatum': { weight: 3, domain: 'vocs' },
  'palm oil': { weight: 2, domain: 'pesticides' },
  'sugar': { weight: 1, domain: 'vocs' },
  'lecithin': { weight: 1, domain: 'vocs' },
};

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

async function lookupInAirtable(upc) {
  try {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/products_exposures?filterByFormula=FIND("${upc}",{upc_barcode})&maxRecords=1`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.records || data.records.length === 0) return null;
    
    const r = data.records[0];
    const f = r.fields;
    return {
      id: r.id,
      productId: f.product_id,
      name: f.product_name,
      brand: f.brand,
      category: f.category,
      subCategory: f.sub_category,
      barcode: upc,
      hazardScore: f.hazard_score_0_100 || 0,
      hazardLevel: f.hazard_level || 'Unknown',
      domainScores: {
        pfas: f.PFAS_hazard_Score || 0,
        metals: f.metals_hazard_Score || 0,
        vocs: f.voc_hazard_Score || 0,
        phthalates: f.phthalates_hazard_Score || 0,
        parabens: f['parabens_hazard_Score copy'] || 0,
        pesticides: f.pesticides_hazard_Score || 0,
        plastics: f.plastics_hazard_Score || 0,
      },
      source: 'ToxEcology Database',
      isNew: false,
    };
  } catch (e) {
    console.error('Airtable error:', e);
    return null;
  }
}

async function lookupOpenFoodFacts(upc) {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${upc}?fields=product_name,brands,ingredients_text,categories_tags`,
      { headers: { 'User-Agent': 'ToxEcology/2.1' } }
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
      subCategory: inferSubCategory(data.product.categories_tags, 'Food'),
    };
  } catch (e) { return null; }
}

async function lookupOpenBeautyFacts(upc) {
  try {
    const response = await fetch(
      `https://world.openbeautyfacts.org/api/v2/product/${upc}?fields=product_name,brands,ingredients_text,categories_tags`,
      { headers: { 'User-Agent': 'ToxEcology/2.1' } }
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
      subCategory: inferSubCategory(data.product.categories_tags, 'Personal Care'),
    };
  } catch (e) { return null; }
}

function inferSubCategory(tags, category) {
  if (!tags) return 'Other';
  const t = tags.join(' ').toLowerCase();
  if (category === 'Food') {
    if (t.includes('spread') || t.includes('hazelnut')) return 'Spreads';
    if (t.includes('beverage') || t.includes('drink') || t.includes('soda')) return 'Beverages';
    if (t.includes('snack')) return 'Snacks';
    if (t.includes('cereal')) return 'Cereals';
    if (t.includes('chocolate') || t.includes('candy')) return 'Confectionery';
    return 'Other Food';
  }
  if (category === 'Personal Care') {
    if (t.includes('shampoo')) return 'Shampoo';
    if (t.includes('lotion')) return 'Body Lotion';
    if (t.includes('soap')) return 'Body Wash';
    return 'Other Personal Care';
  }
  return 'Other';
}

function calculateHazard(ingredients) {
  if (!ingredients) return { hazardScore: 0, hazardLevel: 'Unknown', domainScores: {}, matchedIngredients: [], confidence: 'none' };
  
  const text = ingredients.toLowerCase();
  const domains = { parabens: 0, phthalates: 0, vocs: 0, pfas: 0, metals: 0, pesticides: 0, plastics: 0 };
  const matched = [];
  let total = 0, max = 0;

  for (const [ing, data] of Object.entries(INGREDIENT_HAZARDS)) {
    if (text.includes(ing)) {
      matched.push({ name: ing, weight: data.weight, domain: data.domain });
      domains[data.domain] += data.weight;
      total += data.weight;
      max = Math.max(max, data.weight);
    }
  }

  const score = Math.round((max / 10) * 40 + Math.min(total / 20, 1) * 40 + Math.min(matched.length / 5, 1) * 20);
  const level = score >= 50 ? 'High' : score >= 30 ? 'Moderate' : 'Low';
  const domainScores = {};
  for (const [d, v] of Object.entries(domains)) domainScores[d] = Math.min(v * 10, 100);

  return { hazardScore: score, hazardLevel: level, domainScores, matchedIngredients: matched, confidence: matched.length > 2 ? 'high' : matched.length > 0 ? 'medium' : 'low' };
}

async function addToAirtable(product) {
  try {
    const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/products_exposures`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          product_id: `AUTO-${Date.now()}`,
          product_name: product.name,
          brand: product.brand,
          category: product.category,
          sub_category: product.subCategory,
          upc_barcode: product.barcode,
          ingredient_list_raw: product.ingredients,
          hazard_score_0_100: product.hazardScore,
          hazard_level: product.hazardLevel,
          source: product.source,
          date_added: new Date().toISOString().split('T')[0],
          voc_hazard_Score: product.domainScores.vocs || 0,
          phthalates_hazard_Score: product.domainScores.phthalates || 0,
          'parabens_hazard_Score copy': product.domainScores.parabens || 0,
          metals_hazard_Score: product.domainScores.metals || 0,
          PFAS_hazard_Score: product.domainScores.pfas || 0,
          pesticides_hazard_Score: product.domainScores.pesticides || 0,
          plastics_hazard_Score: product.domainScores.plastics || 0,
        },
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.id;
  } catch (e) { return null; }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const upc = event.queryStringParameters?.upc?.replace(/\D/g, '');
  if (!upc || upc.length < 8) {
    return { statusCode: 400, headers, body: JSON.stringify({ success: false, error: 'Invalid UPC' }) };
  }

  // Check Airtable first
  let product = await lookupInAirtable(upc);
  if (product) return { statusCode: 200, headers, body: JSON.stringify({ success: true, product }) };

  // Try Open Food Facts
  let external = await lookupOpenFoodFacts(upc);
  if (!external) external = await lookupOpenBeautyFacts(upc);
  if (!external) return { statusCode: 404, headers, body: JSON.stringify({ success: false, error: 'Product not found', barcode: upc }) };

  // Calculate hazard
  const hazard = calculateHazard(external.ingredients);
  product = {
    productId: `AUTO-${Date.now()}`,
    name: external.name,
    brand: external.brand,
    category: external.category,
    subCategory: external.subCategory,
    barcode: upc,
    ingredients: external.ingredients,
    hazardScore: hazard.hazardScore,
    hazardLevel: hazard.hazardLevel,
    domainScores: hazard.domainScores,
    matchedIngredients: hazard.matchedIngredients,
    confidence: hazard.confidence,
    source: external.source,
    isNew: true,
  };

  // Add to Airtable
  const recordId = await addToAirtable(product);
  if (recordId) product.id = recordId;

  return { statusCode: 200, headers, body: JSON.stringify({ success: true, product }) };
};
