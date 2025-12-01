const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_SCORING_BASE_ID;

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

async function getSubstitutions(productId) {
  try {
    const filter = `FIND("${productId}", ARRAYJOIN({original_product}))`;
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/product_substitutions?filterByFormula=${encodeURIComponent(filter)}&sort[0][field]=improvement_percentage&sort[0][direction]=desc&maxRecords=5`;
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
    });
    
    if (!response.ok) return [];
    const data = await response.json();
    
    return data.records.map(r => ({
      id: r.id,
      substitutionId: r.fields.substitution_id,
      alternativeName: r.fields.alternative_product_name || r.fields['Name (from alternative_product)'] || 'Safer Alternative',
      alternativeBrand: r.fields.alternative_brand || r.fields['brand (from alternative_product)'] || '',
      alternativeHazardScore: r.fields.alternative_hazard_score,
      hazardImprovement: r.fields.hazard_improvement,
      improvementPercentage: r.fields.improvement_percentage,
      domainFocus: r.fields.domain_focus,
      reasonForSwap: r.fields.reason_for_swap,
      swapPriority: r.fields.swap_priority,
      categoryMatch: r.fields.category_match,
      isUniversal: r.fields.is_universal,
    }));
  } catch (e) {
    console.error('Substitutions error:', e);
    return [];
  }
}

async function getUniversalSubstitutions(subCategory) {
  try {
    const filter = `AND({is_universal}=TRUE(), {original_sub_category}="${subCategory}")`;
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/product_substitutions?filterByFormula=${encodeURIComponent(filter)}&sort[0][field]=improvement_percentage&sort[0][direction]=desc&maxRecords=3`;
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` },
    });
    
    if (!response.ok) return [];
    const data = await response.json();
    
    return data.records.map(r => ({
      id: r.id,
      substitutionId: r.fields.substitution_id,
      alternativeName: r.fields.alternative_product_name || 'Safer Alternative',
      alternativeBrand: r.fields.alternative_brand || '',
      alternativeHazardScore: r.fields.alternative_hazard_score,
      hazardImprovement: r.fields.hazard_improvement,
      improvementPercentage: r.fields.improvement_percentage,
      domainFocus: r.fields.domain_focus,
      reasonForSwap: r.fields.reason_for_swap,
      swapPriority: r.fields.swap_priority,
      isUniversal: true,
    }));
  } catch (e) {
    console.error('Universal substitutions error:', e);
    return [];
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const { productId, subCategory, domains } = event.queryStringParameters || {};

  try {
    let substitutions = [];

    // Get product-specific substitutions
    if (productId) {
      substitutions = await getSubstitutions(productId);
    }

    // Fall back to universal substitutions by category
    if (substitutions.length === 0 && subCategory) {
      substitutions = await getUniversalSubstitutions(subCategory);
    }

    // Prioritize by patient's elevated domains if provided
    if (domains && substitutions.length > 0) {
      const priorityDomains = domains.split(',').map(d => d.trim());
      substitutions.sort((a, b) => {
        const aMatch = priorityDomains.includes(a.domainFocus) ? 1 : 0;
        const bMatch = priorityDomains.includes(b.domainFocus) ? 1 : 0;
        if (bMatch !== aMatch) return bMatch - aMatch;
        return (b.improvementPercentage || 0) - (a.improvementPercentage || 0);
      });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        substitutions: substitutions.slice(0, 3),
        count: substitutions.length,
      }),
    };

  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: 'Internal server error' }),
    };
  }
};
