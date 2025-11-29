// netlify/functions/lookup-ingredients.js
// Matches ingredient list against ingredient_hazards table and calculates hazard score

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

// Cache for ingredients (persists during function warm state)
let ingredientCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

  const { ingredients } = body;
  
  if (!ingredients) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing ingredients parameter' })
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
    // Load ingredient cache if needed
    if (!ingredientCache || Date.now() - cacheTimestamp > CACHE_TTL) {
      ingredientCache = await loadIngredientCache();
      cacheTimestamp = Date.now();
    }

    // Parse ingredients
    const parsed = parseIngredients(ingredients);
    
    // Match against cache
    const matches = [];
    const concerns = [];
    const domainScores = {
      pfas: 0, metals: 0, parabens: 0, phthalates: 0,
      vocs: 0, pesticides: 0, mycotoxins: 0, plastics: 0
    };
    
    for (const ing of parsed) {
      const match = findIngredientMatch(ing, ingredientCache);
      if (match) {
        matches.push(match);
        
        // Track concerning ingredients (toxE_weight >= 5)
        if (match.toxE_weight >= 5) {
          concerns.push(match.name);
        }
        
        // Accumulate domain scores
        if (match.domains) {
          for (const [domain, weight] of Object.entries(match.domains)) {
            if (domainScores[domain] !== undefined) {
              domainScores[domain] = Math.max(domainScores[domain], weight);
            }
          }
        }
      }
    }

    // Calculate overall hazard score
    // Using similar logic to your scraper:
    // - Base score of 20
    // - Add max weights from concerning ingredients
    // - Factor in ingredient count
    let hazardScore = 20;
    
    if (matches.length > 0) {
      const maxWeight = Math.max(...matches.map(m => m.toxE_weight || 0));
      hazardScore += maxWeight * 8;
      hazardScore += Math.min(20, parsed.length * 0.5);
    }
    
    hazardScore = Math.min(100, Math.round(hazardScore));

    // Convert domain scores to status
    const domainStatus = {};
    for (const [domain, score] of Object.entries(domainScores)) {
      domainStatus[domain] = getDomainStatus(score);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        hazardScore,
        matchedCount: matches.length,
        totalCount: parsed.length,
        concerns: concerns.slice(0, 10), // Limit to top 10
        domains: domainStatus,
        matches: matches.slice(0, 20).map(m => ({
          name: m.name,
          weight: m.toxE_weight
        }))
      })
    };
    
  } catch (error) {
    console.error('Ingredient lookup error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Load all ingredients from Airtable into cache
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
    
    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    for (const record of data.records) {
      const fields = record.fields;
      const name = (fields.ingredient_name || '').toLowerCase().trim();
      
      if (name) {
        const ingData = {
          record_id: record.id,
          ingredient_id: fields.ingredient_id,
          name: fields.ingredient_name,
          toxE_weight: fields.toxE_weight_0_10 || 0,
          domains: {
            pfas: fields.pfas_weight || 0,
            metals: fields.metals_weight || 0,
            parabens: fields.parabens_weight || 0,
            phthalates: fields.phthalates_weight || 0,
            vocs: fields.voc_weight || 0,
            pesticides: fields.pesticides_weight || 0,
            mycotoxins: fields.mycotox_weight || 0,
            plastics: fields.plastics_weight || 0
          }
        };
        
        cache.set(name, ingData);
        
        // Also cache alt names
        if (fields.alt_names) {
          for (const alt of fields.alt_names.split(';')) {
            const altClean = alt.toLowerCase().trim();
            if (altClean && !cache.has(altClean)) {
              cache.set(altClean, ingData);
            }
          }
        }
      }
    }
    
    offset = data.offset;
  } while (offset);
  
  console.log(`Loaded ${cache.size} ingredients into cache`);
  return cache;
}

// Parse ingredient string into array
function parseIngredients(raw) {
  if (!raw) return [];
  
  // Clean up
  let cleaned = raw.replace(/\n|\r/g, ' ');
  
  // Split by common delimiters
  const ingredients = [];
  for (const part of cleaned.split(',')) {
    for (const subpart of part.split(';')) {
      const trimmed = subpart.trim();
      if (trimmed && trimmed.length > 1) {
        ingredients.push(trimmed);
      }
    }
  }
  
  return ingredients.slice(0, 50); // Limit like your scraper
}

// Find ingredient match in cache
function findIngredientMatch(name, cache) {
  const lower = name.toLowerCase().trim();
  
  // Exact match
  if (cache.has(lower)) {
    return cache.get(lower);
  }
  
  // Partial match
  for (const [cachedName, data] of cache.entries()) {
    if (cachedName.includes(lower) || lower.includes(cachedName)) {
      return data;
    }
  }
  
  return null;
}

// Convert score to status
function getDomainStatus(score) {
  if (!score || score === 0) return 'normal';
  if (score <= 3) return 'normal';
  if (score <= 6) return 'moderate';
  return 'elevated';
}
