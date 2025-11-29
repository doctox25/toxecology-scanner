/**
 * ToxEcology Scanner - Add Product Function
 * 
 * Endpoint: /.netlify/functions/add-product (POST)
 * Purpose: Creates new record in products_exposures with proper sub_category mapping
 * 
 * Updated: November 2025
 * Version: 2.0 - Now includes sub_category support!
 */

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

// ============================================================================
// SUB-CATEGORY MAPPING - Maps external source categories to Airtable options
// ============================================================================

// Valid sub_category options in Airtable (single-select field)
const VALID_SUB_CATEGORIES = {
  // Personal Care
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
  
  // Food
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
  
  // Home Cleaning
  'Surface Cleaner': 'Surface Cleaner',
  'All-purpose cleaner': 'All-purpose cleaner',
  'Laundry Detergent': 'Laundry Detergent',
  'Dish Soap': 'Dish Soap',
  'Disinfectant': 'Disinfectant',
  
  // Other
  'Other': 'Other'
};

// Open Food Facts category mappings
const OFF_FOOD_MAPPINGS = {
  // Beverages
  'beverages': 'Beverages',
  'drinks': 'Beverages',
  'sodas': 'Beverages',
  'juices': 'Beverages',
  'waters': 'Beverages',
  'teas': 'Beverages',
  'coffees': 'Beverages',
  'energy-drinks': 'Beverages',
  'milk': 'Dairy',
  
  // Breakfast
  'breakfasts': 'Breakfast Cereal',
  'cereals': 'Breakfast Cereal',
  'breakfast-cereals': 'Breakfast Cereal',
  
  // Snacks
  'snacks': 'Snacks',
  'chips': 'Snacks',
  'crackers': 'Snacks',
  'popcorn': 'Snacks',
  'pretzels': 'Snacks',
  'nuts': 'Nuts & Seeds',
  'seeds': 'Nuts & Seeds',
  'dried-fruits': 'Snacks',
  
  // Sweets
  'sugary-snacks': 'Candy & Sweets',
  'chocolates': 'Candy & Sweets',
  'candies': 'Candy & Sweets',
  'confectioneries': 'Candy & Sweets',
  'cookies': 'Candy & Sweets',
  'biscuits': 'Candy & Sweets',
  'ice-creams': 'Candy & Sweets',
  
  // Dairy
  'dairies': 'Dairy',
  'dairy': 'Dairy',
  'cheeses': 'Dairy',
  'yogurts': 'Dairy',
  'butters': 'Dairy',
  'creams': 'Dairy',
  
  // Breads & Grains
  'breads': 'Bread',
  'bread': 'Bread',
  'pastas': 'Pasta',
  'pasta': 'Pasta',
  'noodles': 'Pasta',
  'rice': 'Rice',
  'rices': 'Rice',
  'grains': 'Rice',
  
  // Condiments & Spreads
  'condiments': 'Condiments',
  'sauces': 'Condiments',
  'dressings': 'Condiments',
  'ketchup': 'Condiments',
  'mustard': 'Condiments',
  'mayonnaise': 'Condiments',
  'spreads': 'Spreads',
  'jams': 'Spreads',
  'honeys': 'Spreads',
  'nut-butters': 'Spreads',
  'peanut-butters': 'Spreads',
  'chocolate-spreads': 'Spreads',
  
  // Canned & Preserved
  'canned': 'Canned Vegetables',
  'canned-foods': 'Canned Vegetables',
  'canned-vegetables': 'Canned Vegetables',
  'canned-beans': 'Beans & Legumes',
  'canned-soups': 'Canned Soup',
  'soups': 'Canned Soup',
  
  // Frozen
  'frozen-foods': 'Frozen Vegetables',
  'frozen-vegetables': 'Frozen Vegetables',
  'frozen': 'Frozen Vegetables',
  
  // Other categories
  'legumes': 'Beans & Legumes',
  'beans': 'Beans & Legumes',
  'spices': 'Spices & Seasonings',
  'seasonings': 'Spices & Seasonings',
  'herbs': 'Spices & Seasonings',
  
  // Meats & Proteins (map to Food - Other for now)
  'meats': 'Food - Other',
  'fish': 'Food - Other',
  'seafood': 'Food - Other',
  'poultry': 'Food - Other',
  'eggs': 'Food - Other'
};

// Open Beauty Facts category mappings
const OBF_BEAUTY_MAPPINGS = {
  // Hair
  'shampoos': 'Shampoo',
  'shampoo': 'Shampoo',
  'hair-shampoos': 'Shampoo',
  'conditioners': 'Hair Care',
  'hair-conditioners': 'Hair Care',
  'hair-care': 'Hair Care',
  'hair-products': 'Hair Care',
  'hair-colorants': 'Hair Care',
  'hair-dyes': 'Hair Care',
  'hair-styling': 'Hair Care',
  'hair-treatments': 'Hair Care',
  
  // Body
  'body-washes': 'Body Wash',
  'body-wash': 'Body Wash',
  'shower-gels': 'Body Wash',
  'soaps': 'Body Wash',
  'body-lotions': 'Body Lotion',
  'body-creams': 'Body Lotion',
  'body-milks': 'Body Lotion',
  'moisturizers': 'Body Lotion',
  'lotions': 'Lotion',
  
  // Face
  'face-creams': 'Face Care',
  'face-care': 'Face Care',
  'facial-care': 'Face Care',
  'face-cleansers': 'Face Wash',
  'face-washes': 'Face Wash',
  'cleansers': 'Face Wash',
  'toners': 'Face Care',
  'serums': 'Face Care',
  'masks': 'Face Care',
  'face-masks': 'Face Care',
  
  // Makeup
  'makeups': 'Face Makeup',
  'makeup': 'Face Makeup',
  'foundations': 'Face Makeup',
  'concealers': 'Face Makeup',
  'powders': 'Face Makeup',
  'blushes': 'Face Makeup',
  'bronzers': 'Face Makeup',
  'primers': 'Face Makeup',
  'bb-creams': 'Face Makeup',
  'cc-creams': 'Face Makeup',
  
  'eye-makeup': 'Eye Makeup',
  'eye-shadows': 'Eye Makeup',
  'eyeshadows': 'Eye Makeup',
  'mascaras': 'Eye Makeup',
  'eyeliners': 'Eye Makeup',
  'eye-pencils': 'Eye Makeup',
  'brow-products': 'Eye Makeup',
  'eyebrow': 'Eye Makeup',
  
  'lip-makeup': 'Lip Makeup',
  'lipsticks': 'Lip Makeup',
  'lip-glosses': 'Lip Makeup',
  'lip-balms': 'Lip Makeup',
  'lip-liners': 'Lip Makeup',
  'lip-care': 'Lip Makeup',
  
  // Nails
  'nail-polish': 'Nail Products',
  'nail-polishes': 'Nail Products',
  'nail-care': 'Nail Products',
  'nail-treatments': 'Nail Products',
  'nail-products': 'Nail Products',
  
  // Sun
  'sunscreens': 'Sunscreen',
  'sunscreen': 'Sunscreen',
  'sun-care': 'Sunscreen',
  'sun-protection': 'Sunscreen',
  'spf': 'Sunscreen',
  'after-sun': 'Sunscreen',
  
  // Deodorant
  'deodorants': 'Deodorant',
  'deodorant': 'Deodorant',
  'antiperspirants': 'Deodorant',
  
  // Oral
  'toothpastes': 'Oral Care',
  'toothpaste': 'Oral Care',
  'mouthwashes': 'Oral Care',
  'oral-care': 'Oral Care',
  'dental-care': 'Oral Care',
  
  // Baby
  'baby-care': 'Baby Care',
  'baby-products': 'Baby Care',
  'baby-lotions': 'Baby Care',
  'baby-shampoos': 'Baby Care',
  'diapers': 'Baby Care',
  
  // Skin Care
  'skin-care': 'Skin Care',
  'skincare': 'Skin Care',
  'anti-aging': 'Skin Care',
  'acne-treatments': 'Skin Care'
};

// Product name keyword mappings (fallback)
const NAME_KEYWORD_MAPPINGS = {
  // Personal Care keywords
  'shampoo': 'Shampoo',
  'conditioner': 'Hair Care',
  'body wash': 'Body Wash',
  'shower gel': 'Body Wash',
  'lotion': 'Body Lotion',
  'moisturizer': 'Body Lotion',
  'cream': 'Skin Care',
  'serum': 'Skin Care',
  'sunscreen': 'Sunscreen',
  'spf': 'Sunscreen',
  'deodorant': 'Deodorant',
  'antiperspirant': 'Deodorant',
  'toothpaste': 'Oral Care',
  'mouthwash': 'Oral Care',
  'lipstick': 'Lip Makeup',
  'lip gloss': 'Lip Makeup',
  'lip balm': 'Lip Makeup',
  'mascara': 'Eye Makeup',
  'eyeliner': 'Eye Makeup',
  'eyeshadow': 'Eye Makeup',
  'eye shadow': 'Eye Makeup',
  'foundation': 'Face Makeup',
  'concealer': 'Face Makeup',
  'blush': 'Face Makeup',
  'bronzer': 'Face Makeup',
  'nail polish': 'Nail Products',
  'nail lacquer': 'Nail Products',
  'face wash': 'Face Wash',
  'cleanser': 'Face Wash',
  'baby': 'Baby Care',
  
  // Food keywords
  'cereal': 'Breakfast Cereal',
  'granola': 'Breakfast Cereal',
  'oatmeal': 'Breakfast Cereal',
  'juice': 'Beverages',
  'soda': 'Beverages',
  'water': 'Beverages',
  'tea': 'Beverages',
  'coffee': 'Beverages',
  'milk': 'Dairy',
  'cheese': 'Dairy',
  'yogurt': 'Dairy',
  'butter': 'Dairy',
  'bread': 'Bread',
  'pasta': 'Pasta',
  'noodle': 'Pasta',
  'rice': 'Rice',
  'chips': 'Snacks',
  'crackers': 'Snacks',
  'popcorn': 'Snacks',
  'pretzel': 'Snacks',
  'cookie': 'Candy & Sweets',
  'candy': 'Candy & Sweets',
  'chocolate': 'Candy & Sweets',
  'gummy': 'Candy & Sweets',
  'ice cream': 'Candy & Sweets',
  'sauce': 'Condiments',
  'ketchup': 'Condiments',
  'mustard': 'Condiments',
  'mayo': 'Condiments',
  'dressing': 'Condiments',
  'jam': 'Spreads',
  'jelly': 'Spreads',
  'peanut butter': 'Spreads',
  'nutella': 'Spreads',
  'honey': 'Spreads',
  'soup': 'Canned Soup',
  'beans': 'Beans & Legumes',
  'nuts': 'Nuts & Seeds',
  'seeds': 'Nuts & Seeds',
  'almonds': 'Nuts & Seeds',
  'cashews': 'Nuts & Seeds',
  'peanuts': 'Nuts & Seeds',
  
  // Cleaning keywords
  'cleaner': 'Surface Cleaner',
  'all-purpose': 'All-purpose cleaner',
  'multi-surface': 'Surface Cleaner',
  'laundry': 'Laundry Detergent',
  'detergent': 'Laundry Detergent',
  'dish soap': 'Dish Soap',
  'dishwashing': 'Dish Soap',
  'disinfectant': 'Disinfectant',
  'sanitizer': 'Disinfectant'
};

/**
 * Classify sub_category from external source data
 * @param {Object} productData - Product data from external source
 * @returns {string} Valid Airtable sub_category value
 */
function classifySubCategory(productData) {
  const { category, sourceCategory, productName, source } = productData;
  
  // 1. Try to map from source category (Open Food Facts / Open Beauty Facts)
  if (sourceCategory) {
    const normalizedCategory = sourceCategory.toLowerCase().trim();
    
    // Check Open Food Facts mappings
    if (source === 'Open Food Facts') {
      // OFF categories are comma-separated, check each one
      const categories = normalizedCategory.split(',').map(c => c.trim());
      for (const cat of categories) {
        // Try exact match first
        if (OFF_FOOD_MAPPINGS[cat]) {
          return OFF_FOOD_MAPPINGS[cat];
        }
        // Try partial match
        for (const [key, value] of Object.entries(OFF_FOOD_MAPPINGS)) {
          if (cat.includes(key) || key.includes(cat)) {
            return value;
          }
        }
      }
    }
    
    // Check Open Beauty Facts mappings
    if (source === 'Open Beauty Facts') {
      const categories = normalizedCategory.split(',').map(c => c.trim());
      for (const cat of categories) {
        if (OBF_BEAUTY_MAPPINGS[cat]) {
          return OBF_BEAUTY_MAPPINGS[cat];
        }
        for (const [key, value] of Object.entries(OBF_BEAUTY_MAPPINGS)) {
          if (cat.includes(key) || key.includes(cat)) {
            return value;
          }
        }
      }
    }
  }
  
  // 2. Fallback: Use product name keywords
  if (productName) {
    const normalizedName = productName.toLowerCase();
    for (const [keyword, subCategory] of Object.entries(NAME_KEYWORD_MAPPINGS)) {
      if (normalizedName.includes(keyword)) {
        return subCategory;
      }
    }
  }
  
  // 3. Final fallback: Use category-based default
  if (category === 'Personal Care') {
    return 'Personal Care - Other';
  } else if (category === 'Food') {
    return 'Food - Other';
  } else if (category === 'Home Cleaning') {
    return 'Surface Cleaner';
  }
  
  // Ultimate fallback
  return 'Other';
}

/**
 * Validate that sub_category is a valid Airtable option
 * @param {string} subCategory - Sub-category to validate
 * @returns {string|null} Valid sub-category or null
 */
function validateSubCategory(subCategory) {
  if (VALID_SUB_CATEGORIES[subCategory]) {
    return VALID_SUB_CATEGORIES[subCategory];
  }
  return null;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
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

  try {
    const body = JSON.parse(event.body);
    
    const {
      product_id,
      product_name,
      brand,
      category,
      sourceCategory,  // NEW: External source category for mapping
      upc_barcode,
      ingredient_list_raw,
      ingredientIds,
      domainMapIds,
      knobId,
      source,
      source_url
    } = body;

    // Validate required fields
    if (!product_name) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'product_name is required' })
      };
    }

    // Check for duplicate by barcode
    if (upc_barcode) {
      const checkResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/products_exposures?filterByFormula={upc_barcode}="${upc_barcode}"`,
        {
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const checkData = await checkResponse.json();
      
      if (checkData.records && checkData.records.length > 0) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({
            error: 'Product already exists',
            existing_product_id: checkData.records[0].fields.product_id,
            message: '✓ Already in Database'
          })
        };
      }
    }

    // Also check by name + brand
    if (product_name && brand) {
      const nameCheck = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/products_exposures?filterByFormula=AND({product_name}="${product_name.replace(/"/g, '\\"')}",{brand}="${brand.replace(/"/g, '\\"')}")`,
        {
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const nameData = await nameCheck.json();
      
      if (nameData.records && nameData.records.length > 0) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({
            error: 'Product already exists',
            existing_product_id: nameData.records[0].fields.product_id,
            message: '✓ Already in Database'
          })
        };
      }
    }

    // *** NEW: Classify sub_category ***
    const classifiedSubCategory = classifySubCategory({
      category: category || 'Personal Care',
      sourceCategory: sourceCategory,
      productName: product_name,
      source: source
    });
    
    // Validate it's a real Airtable option
    const validSubCategory = validateSubCategory(classifiedSubCategory);

    // Build the record
    const fields = {
      product_id: product_id || `SCAN-${Date.now()}`,
      product_name: product_name,
      brand: brand || 'Unknown Brand',
      category: category || 'Personal Care',
      upc_barcode: upc_barcode || '',
      ingredient_list_raw: ingredient_list_raw || '',
      source: source || 'ToxEcology Scanner',
      source_url: source_url || 'https://scanner.toxecology.com',
      date_added: new Date().toISOString().split('T')[0]
    };

    // *** ADD sub_category if valid ***
    if (validSubCategory) {
      fields.sub_category = validSubCategory;
    }

    // Link ingredients if provided
    if (ingredientIds && Array.isArray(ingredientIds) && ingredientIds.length > 0) {
      fields.Ingredients_link = ingredientIds;
    }

    // Link domain map if provided
    if (domainMapIds && Array.isArray(domainMapIds) && domainMapIds.length > 0) {
      fields.ingredient_domain_map = domainMapIds;
    }

    // Link knob if provided (should be array with single record ID)
    if (knobId) {
      fields.knob_product_hazard = Array.isArray(knobId) ? knobId : [knobId];
    }

    // Create the record
    const createResponse = await fetch(
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

    const createData = await createResponse.json();

    if (!createResponse.ok) {
      console.error('Airtable error:', createData);
      return {
        statusCode: createResponse.status,
        headers,
        body: JSON.stringify({
          error: 'Failed to create product',
          details: createData.error
        })
      };
    }

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        success: true,
        message: '✓ Added to ToxEcology Database',
        record_id: createData.id,
        product_id: createData.fields.product_id,
        sub_category: validSubCategory || 'Not classified',
        sub_category_source: validSubCategory ? 'auto-classified' : 'skipped'
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
