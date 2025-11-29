// netlify/functions/add-product.js
// Adds new product to products_exposures table
// Matches the exact schema used by toxecology_scraper.py v25

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

// Cache for ingredients and knob (for linking)
let ingredientCache = null;
let knobProductHazardId = null;

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid JSON body' })
    };
  }

  const { barcode, name, brand, category, sub_category, ingredients } = body;
  
  // Validation
  if (!name || !brand || !category) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing required fields: name, brand, category' })
    };
  }

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server configuration error' })
    };
  }

  try {
    // Check for duplicate
    if (barcode) {
      const existing = await searchAirtable('products_exposures', `{upc_barcode}='${barcode}'`);
      if (existing.length > 0) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({ 
            error: 'Product with this barcode already exists',
            existing_id: existing[0].fields.product_id
          })
        };
      }
    }

    // Also check by name + brand
    const nameCheck = await searchAirtable(
      'products_exposures', 
      `AND({product_name}='${name.substring(0, 100).replace(/'/g, "\\'")}', {brand}='${brand.substring(0, 50).replace(/'/g, "\\'")}')`
    );
    if (nameCheck.length > 0) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ 
          error: 'Product with this name and brand already exists',
          existing_id: nameCheck[0].fields.product_id
        })
      };
    }

    // Load caches if needed
    if (!ingredientCache) {
      ingredientCache = await loadIngredientCache();
    }
    if (!knobProductHazardId) {
      knobProductHazardId = await loadKnobProductHazardId();
    }

    // Generate product ID (matches scraper format)
    const prefix = category === 'Food' ? 'FD' : 'CP';
    const randomNum = Math.floor(Math.random() * 90000) + 10000;
    const product_id = `${prefix}-SCAN-${randomNum}`;

    // Match ingredients
    const { recordIds, ingredientIds } = matchIngredients(ingredients, ingredientCache);
    
    // Get domain map IDs
    const domainMapIds = await getDomainMapIds(ingredientIds);

    // Build record fields (matches your scraper exactly)
    const fields = {
      product_id: product_id,
      product_name: name.substring(0, 200),
      brand: brand.substring(0, 100),
      category: category,
      sub_category: sub_category || '',
      upc_barcode: barcode || '',
      ingredient_list_raw: (ingredients || '').substring(0, 5000),
      source: 'ToxEcology Scanner',
      source_url: 'https://scanner.toxecology.com',
      date_added: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
    };

    // Add ingredient links if we have matches
    if (recordIds.length > 0) {
      fields.Ingredients_link = recordIds;
    }

    // Add domain map links
    if (domainMapIds.length > 0) {
      fields.ingredient_domain_map = domainMapIds;
    }

    // Add knob_product_hazard link
    if (knobProductHazardId) {
      fields.knob_product_hazard = [knobProductHazardId];
    }

    // Create record
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/products_exposures`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Airtable error: ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        product_id: product_id,
        record_id: result.id,
        ingredients_matched: recordIds.length,
        domain_maps_linked: domainMapIds.length
      })
    };
    
  } catch (error) {
    console.error('Add product error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// =============================================================================
// HELPER FUNCTIONS (matching your scraper)
// =============================================================================

async function searchAirtable(table, formula) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) return [];
  const data = await response.json();
  return data.records || [];
}

async function loadIngredientCache() {
  const cache = new Map();
  let offset = null;
  
  do {
    let url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/ingredient_hazards?pageSize=100`;
    if (offset) url += `&offset=${offset}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) break;
    const data = await response.json();
    
    for (const record of data.records) {
      const fields = record.fields;
      const name = (fields.ingredient_name || '').toLowerCase().trim();
      
      if (name) {
        cache.set(name, {
          record_id: record.id,
          ingredient_id: fields.ingredient_id
        });
        
        // Cache alt names
        if (fields.alt_names) {
          for (const alt of fields.alt_names.split(';')) {
            const altClean = alt.toLowerCase().trim();
            if (altClean && !cache.has(altClean)) {
              cache.set(altClean, {
                record_id: record.id,
                ingredient_id: fields.ingredient_id
              });
            }
          }
        }
      }
    }
    
    offset = data.offset;
  } while (offset);
  
  console.log(`Loaded ${cache.size} ingredients`);
  return cache;
}

async function loadKnobProductHazardId() {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/knob_product_hazard?maxRecords=10`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) return null;
  const data = await response.json();
  
  for (const record of data.records) {
    if (record.fields.knob_id === 'product_hazard_v0') {
      console.log(`Found knob_product_hazard: ${record.id}`);
      return record.id;
    }
  }
  
  return null;
}

function parseIngredients(raw) {
  if (!raw) return [];
  
  let cleaned = raw.replace(/\n|\r/g, ' ');
  const ingredients = [];
  
  for (const part of cleaned.split(',')) {
    for (const subpart of part.split(';')) {
      const trimmed = subpart.trim();
      if (trimmed && trimmed.length > 1) {
        ingredients.push(trimmed);
      }
    }
  }
  
  return ingredients.slice(0, 50);
}

function matchIngredients(raw, cache) {
  const recordIds = [];
  const ingredientIds = [];
  
  const parsed = parseIngredients(raw);
  
  for (const ing of parsed) {
    const lower = ing.toLowerCase().trim();
    
    // Exact match
    if (cache.has(lower)) {
      const match = cache.get(lower);
      if (!recordIds.includes(match.record_id)) {
        recordIds.push(match.record_id);
        ingredientIds.push(match.ingredient_id);
      }
      continue;
    }
    
    // Partial match
    for (const [cachedName, data] of cache.entries()) {
      if (cachedName.includes(lower) || lower.includes(cachedName)) {
        if (!recordIds.includes(data.record_id)) {
          recordIds.push(data.record_id);
          ingredientIds.push(data.ingredient_id);
        }
        break;
      }
    }
  }
  
  return { recordIds, ingredientIds };
}

async function getDomainMapIds(ingredientIds) {
  const domainMapIds = [];
  
  for (const ingId of ingredientIds) {
    if (!ingId) continue;
    
    try {
      const results = await searchAirtable(
        'ingredient_domain_map',
        `{ingredient_id}='${ingId}'`
      );
      
      for (const r of results) {
        if (!domainMapIds.includes(r.id)) {
          domainMapIds.push(r.id);
        }
      }
    } catch (e) {
      console.error(`Domain map lookup failed for ${ingId}:`, e);
    }
  }
  
  return domainMapIds;
}
