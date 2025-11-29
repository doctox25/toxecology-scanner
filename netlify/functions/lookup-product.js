// netlify/functions/lookup-product.js
// Searches products_exposures table by UPC barcode

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const barcode = event.queryStringParameters?.barcode;
  
  if (!barcode) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing barcode parameter' })
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
    // Search by upc_barcode field
    const formula = encodeURIComponent(`{upc_barcode}='${barcode}'`);
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/products_exposures?filterByFormula=${formula}&maxRecords=1`;
    
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
    
    if (data.records && data.records.length > 0) {
      const record = data.records[0];
      const fields = record.fields;
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          found: true,
          product: {
            record_id: record.id,
            product_id: fields.product_id,
            name: fields.product_name,
            brand: fields.brand,
            category: fields.category,
            sub_category: fields.sub_category,
            ingredients: fields.ingredient_list_raw,
            barcode: fields.upc_barcode,
            
            // Hazard scores from Airtable (calculated by your formulas)
            hazardScore: fields.hazard_score_0_100,
            hazardLevel: fields.hazard_level,
            ingredientCount: fields.ingredient_count,
            
            // Domain scores
            domains: {
              pfas: getDomainStatus(fields.PFAS_hazard_Score),
              metals: getDomainStatus(fields.metals_hazard_Score),
              parabens: getDomainStatus(fields['parabens_hazard_Score copy']),
              phthalates: getDomainStatus(fields.phthalates_hazard_Score),
              vocs: getDomainStatus(fields.voc_hazard_Score),
              pesticides: getDomainStatus(fields.pesticides_hazard_Score),
              mycotoxins: getDomainStatus(fields.mycotox_hazard_Score),
              plastics: getDomainStatus(fields.plastics_hazard_Score)
            },
            
            // Source info
            source: fields.source,
            sourceUrl: fields.source_url,
            imageUrl: null // Airtable products may not have images
          }
        })
      };
    }
    
    // Not found
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ found: false })
    };
    
  } catch (error) {
    console.error('Lookup error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

// Helper to convert numeric score to status
function getDomainStatus(score) {
  if (!score || score === 0) return 'normal';
  if (score <= 3) return 'normal';
  if (score <= 6) return 'moderate';
  return 'elevated';
}
