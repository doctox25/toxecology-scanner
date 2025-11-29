/**
 * ToxEcology Scanner - Add Product Function
 * 
 * Endpoint: /.netlify/functions/add-product (POST)
 * Purpose: Creates new record in products_exposures with proper sub_category mapping
 * 
 * Updated: November 2025
 * Version: 2.1 - Fixed for Netlify (uses https module instead of fetch)
 */

const https = require('https');

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

// ============================================================================
// HELPER: Make HTTPS requests (since fetch may not be available)
// ============================================================================

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ ok: false, status: res.statusCode, data: { error: data } });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

// ============================================================================
// SUB-CATEGORY MAPPING - Maps external source categories to Airtable options
// ============================================================================

const VALID_SUB_CATEGORIES = {
  'Shampoo': 'Shampoo',
  'Body Wash': 'Body Wash',
  'Body Lotion': 'Body Lotion',
  'Lotion': 'Lotion',
  'Face Makeup': 'Face Makeup',
  'Eye Makeup': 'Eye Makeup',
  'Lip Makeup': 'Lip Makeup',
  'Nail Products': 'Nail Products',
  'Hair Care': 'Hair Care',
  'Skin Care': 'Skin Care',
  'Face Care': 'Face Care',
  'Face Wash': 'Face Wash',
  'Sunscreen': 'Sunscreen',
  'Deodorant': 'Deodorant',
  'Oral Care': 'Oral Care',
  'Baby Care': 'Baby Care',
  'Personal Care - Other': 'Personal Care - Other',
  'Food': 'Food',
  'Food - Other': 'Food - Other',
  'Beverages': 'Beverages',
  'Snacks': 'Snacks',
  'Breakfast Cereal': 'Breakfast Cereal',
  'Candy & Sweets': 'Candy & Sweets',
  'Dairy': 'Dairy',
  'Condiments': 'Condiments',
  'Spreads': 'Spreads',
  'Bread': 'Bread',
  'Nuts & Seeds': 'Nuts & Seeds',
  'Beans & Legumes': 'Beans & Legumes',
  'Spices & Seasonings': 'Spices & Seasonings',
  'Rice': 'Rice',
  'Pasta': 'Pasta',
  'Canned Vegetables': 'Canned Vegetables',
  'Canned Soup': 'Canned Soup',
  'Frozen Vegetables': 'Frozen Vegetables',
  'Surface Cleaner': 'Surface Cleaner',
  'All-purpose cleaner': 'All-purpose cleaner',
  'Laundry Detergent': 'Laundry Detergent',
  'Dish Soap': 'Dish Soap',
  'Disinfectant': 'Disinfectant',
  'Other': 'Other'
};

const OFF_FOOD_MAPPINGS = {
  'beverages': 'Beverages', 'drinks': 'Beverages', 'sodas': 'Beverages',
  'juices': 'Beverages', 'waters': 'Beverages', 'teas': 'Beverages',
  'coffees': 'Beverages', 'energy-drinks': 'Beverages', 'milk': 'Dairy',
  'breakfasts': 'Breakfast Cereal', 'cereals': 'Breakfast Cereal',
  'breakfast-cereals': 'Breakfast Cereal',
  'snacks': 'Snacks', 'chips': 'Snacks', 'crackers': 'Snacks',
  'popcorn': 'Snacks', 'pretzels': 'Snacks',
  'nuts': 'Nuts & Seeds', 'seeds': 'Nuts & Seeds',
  'sugary-snacks': 'Candy & Sweets', 'chocolates': 'Candy & Sweets',
  'candies': 'Candy & Sweets', 'confectioneries': 'Candy & Sweets',
  'cookies': 'Candy & Sweets', 'biscuits': 'Candy & Sweets',
  'dairies': 'Dairy', 'dairy': 'Dairy', 'cheeses': 'Dairy',
  'yogurts': 'Dairy', 'butters': 'Dairy',
  'breads': 'Bread', 'bread': 'Bread',
  'pastas': 'Pasta', 'pasta': 'Pasta', 'noodles': 'Pasta',
  'rice': 'Rice', 'rices': 'Rice',
  'condiments': 'Condiments', 'sauces': 'Condiments', 'dressings': 'Condiments',
  'spreads': 'Spreads', 'jams': 'Spreads', 'honeys': 'Spreads',
  'nut-butters': 'Spreads', 'peanut-butters': 'Spreads',
  'canned-vegetables': 'Canned Vegetables', 'canned-soups': 'Canned Soup',
  'soups': 'Canned Soup',
  'frozen-vegetables': 'Frozen Vegetables',
  'legumes': 'Beans & Legumes', 'beans': 'Beans & Legumes',
  'spices': 'Spices & Seasonings', 'seasonings': 'Spices & Seasonings',
  'meats': 'Food - Other', 'fish': 'Food - Other', 'seafood': 'Food - Other'
};

const OBF_BEAUTY_MAPPINGS = {
  'shampoos': 'Shampoo', 'shampoo': 'Shampoo', 'hair-shampoos': 'Shampoo',
  'conditioners': 'Hair Care', 'hair-care': 'Hair Care', 'hair-products': 'Hair Care',
  'body-washes': 'Body Wash', 'body-wash': 'Body Wash', 'shower-gels': 'Body Wash',
  'soaps': 'Body Wash',
  'body-lotions': 'Body Lotion', 'body-creams': 'Body Lotion', 'moisturizers': 'Body Lotion',
  'lotions': 'Lotion',
  'face-creams': 'Face Care', 'face-care': 'Face Care', 'facial-care': 'Face Care',
  'face-cleansers': 'Face Wash', 'face-washes': 'Face Wash', 'cleansers': 'Face Wash',
  'makeups': 'Face Makeup', 'makeup': 'Face Makeup', 'foundations': 'Face Makeup',
  'concealers': 'Face Makeup', 'powders': 'Face Makeup', 'blushes': 'Face Makeup',
  'eye-makeup': 'Eye Makeup', 'eye-shadows': 'Eye Makeup', 'mascaras': 'Eye Makeup',
  'eyeliners': 'Eye Makeup',
  'lip-makeup': 'Lip Makeup', 'lipsticks': 'Lip Makeup', 'lip-glosses': 'Lip Makeup',
  'lip-balms': 'Lip Makeup',
  'nail-polish': 'Nail Products', 'nail-polishes': 'Nail Products', 'nail-care': 'Nail Products',
  'sunscreens': 'Sunscreen', 'sunscreen': 'Sunscreen', 'sun-care': 'Sunscreen',
  'deodorants': 'Deodorant', 'deodorant': 'Deodorant', 'antiperspirants': 'Deodorant',
  'toothpastes': 'Oral Care', 'toothpaste': 'Oral Care', 'mouthwashes': 'Oral Care',
  'oral-care': 'Oral Care',
  'baby-care': 'Baby Care', 'baby-products': 'Baby Care',
  'skin-care': 'Skin Care', 'skincare': 'Skin Care'
};

const NAME_KEYWORD_MAPPINGS = {
  'shampoo': 'Shampoo', 'conditioner': 'Hair Care',
  'body wash': 'Body Wash', 'shower gel': 'Body Wash',
  'lotion': 'Body Lotion', 'moisturizer': 'Body Lotion',
  'sunscreen': 'Sunscreen', 'spf': 'Sunscreen',
  'deodorant': 'Deodorant', 'antiperspirant': 'Deodorant',
  'toothpaste': 'Oral Care', 'mouthwash': 'Oral Care',
  'lipstick': 'Lip Makeup', 'lip gloss': 'Lip Makeup', 'lip balm': 'Lip Makeup',
  'mascara': 'Eye Makeup', 'eyeliner': 'Eye Makeup', 'eyeshadow': 'Eye Makeup',
  'foundation': 'Face Makeup', 'concealer': 'Face Makeup', 'blush': 'Face Makeup',
  'nail polish': 'Nail Products',
  'face wash': 'Face Wash', 'cleanser': 'Face Wash',
  'baby': 'Baby Care',
  'cereal': 'Breakfast Cereal', 'granola': 'Breakfast Cereal',
  'juice': 'Beverages', 'soda': 'Beverages', 'water': 'Beverages',
  'milk': 'Dairy', 'cheese': 'Dairy', 'yogurt': 'Dairy',
  'bread': 'Bread', 'pasta': 'Pasta', 'rice': 'Rice',
  'chips': 'Snacks', 'crackers': 'Snacks', 'popcorn': 'Snacks',
  'cookie': 'Candy & Sweets', 'candy': 'Candy & Sweets', 'chocolate': 'Candy & Sweets',
  'sauce': 'Condiments', 'ketchup': 'Condiments', 'mustard': 'Condiments',
  'jam': 'Spreads', 'peanut butter': 'Spreads', 'honey': 'Spreads',
  'soup': 'Canned Soup', 'beans': 'Beans & Legumes',
  'nuts': 'Nuts & Seeds', 'almonds': 'Nuts & Seeds',
  'cleaner': 'Surface Cleaner', 'laundry': 'Laundry Detergent',
  'detergent': 'Laundry Detergent', 'dish soap': 'Dish Soap',
  'disinfectant': 'Disinfectant'
};

function classifySubCategory(productData) {
  const { category, sourceCategory, productName, source } = productData;
  
  if (sourceCategory) {
    const normalizedCategory = sourceCategory.toLowerCase().trim();
    const categories = normalizedCategory.split(',').map(c => c.trim());
    
    const mappings = source === 'Open Food Facts' ? OFF_FOOD_MAPPINGS : OBF_BEAUTY_MAPPINGS;
    
    for (const cat of categories) {
      if (mappings[cat]) return mappings[cat];
      for (const [key, value] of Object.entries(mappings)) {
        if (cat.includes(key) || key.includes(cat)) return value;
      }
    }
  }
  
  if (productName) {
    const normalizedName = productName.toLowerCase();
    for (const [keyword, subCategory] of Object.entries(NAME_KEYWORD_MAPPINGS)) {
      if (normalizedName.includes(keyword)) return subCategory;
    }
  }
  
  if (category === 'Personal Care') return 'Personal Care - Other';
  if (category === 'Food') return 'Food - Other';
  return null;
}

function validateSubCategory(subCategory) {
  return VALID_SUB_CATEGORIES[subCategory] || null;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body);
    console.log('Received request body:', JSON.stringify(body, null, 2));
    
    const {
      product_id,
      product_name,
      name,              // Frontend sends 'name'
      brand,
      category,
      sourceCategory,
      sub_category,      // Frontend may send this directly
      upc_barcode,
      barcode,           // Frontend sends 'barcode'
      ingredient_list_raw,
      ingredients,       // Frontend sends 'ingredients'
      ingredientIds,
      domainMapIds,
      knobId,
      source,
      source_url
    } = body;

    // Handle field name differences between frontend and Airtable
    const finalProductName = product_name || name;
    const finalBarcode = upc_barcode || barcode;
    const finalIngredients = ingredient_list_raw || ingredients;

    if (!finalProductName) {
      console.log('Error: product_name/name is required');
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'product_name is required' }) };
    }

    // Check for duplicate by barcode
    if (finalBarcode) {
      console.log('Checking for duplicate barcode:', finalBarcode);
      const checkOptions = {
        hostname: 'api.airtable.com',
        path: `/v0/${AIRTABLE_BASE_ID}/products_exposures?filterByFormula={upc_barcode}="${finalBarcode}"`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      };
      
      const checkResult = await makeRequest(checkOptions);
      console.log('Duplicate check result:', JSON.stringify(checkResult.data));
      
      if (checkResult.data.records && checkResult.data.records.length > 0) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({
            error: 'Product already exists',
            existing_product_id: checkResult.data.records[0].fields.product_id,
            message: '✓ Already in Database'
          })
        };
      }
    }

    // Classify sub_category
    const classifiedSubCategory = classifySubCategory({
      category: category || 'Personal Care',
      sourceCategory: sourceCategory || sub_category,
      productName: finalProductName,
      source: source
    });
    const validSubCategory = validateSubCategory(classifiedSubCategory);
    console.log('Classified sub_category:', classifiedSubCategory, '-> Valid:', validSubCategory);

    // Build the record
    const fields = {
      product_id: product_id || `SCAN-${Date.now()}`,
      product_name: finalProductName,
      brand: brand || 'Unknown Brand',
      category: category || 'Personal Care',
      upc_barcode: finalBarcode || '',
      ingredient_list_raw: finalIngredients || '',
      source: source || 'ToxEcology Scanner',
      source_url: source_url || 'https://scanner.toxecology.com',
      date_added: new Date().toISOString().split('T')[0]
    };

    if (validSubCategory) {
      fields.sub_category = validSubCategory;
    }

    if (ingredientIds && Array.isArray(ingredientIds) && ingredientIds.length > 0) {
      fields.Ingredients_link = ingredientIds;
    }

    if (domainMapIds && Array.isArray(domainMapIds) && domainMapIds.length > 0) {
      fields.ingredient_domain_map = domainMapIds;
    }

    if (knobId) {
      fields.knob_product_hazard = Array.isArray(knobId) ? knobId : [knobId];
    }

    console.log('Creating record with fields:', JSON.stringify(fields, null, 2));

    // Create the record
    const createOptions = {
      hostname: 'api.airtable.com',
      path: `/v0/${AIRTABLE_BASE_ID}/products_exposures`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const createResult = await makeRequest(createOptions, JSON.stringify({ fields }));
    console.log('Airtable create response:', JSON.stringify(createResult.data));

    if (!createResult.ok) {
      console.error('Airtable error:', createResult.data);
      return {
        statusCode: createResult.status,
        headers,
        body: JSON.stringify({
          error: 'Failed to create product',
          details: createResult.data.error
        })
      };
    }

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        message: '✓ Added to ToxEcology Database',
        record_id: createResult.data.id,
        product_id: createResult.data.fields.product_id,
        sub_category: validSubCategory || 'Not classified'
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', message: error.message })
    };
  }
};
