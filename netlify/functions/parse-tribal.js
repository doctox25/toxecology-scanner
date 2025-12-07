// parse-tribal.js
// Netlify function to extract lab results from Tribal Diagnostics PDFs
// For Formula Wellness longevity biomarkers

const MARKER_MAP = {
  // === HORMONES ===
  'Testosterone': 'TEST',
  'Total Testosterone': 'TEST',
  'Free Testosterone': 'FREE_T',
  'Calc Free Testosterone': 'FREE_T',
  'Sex Hormone Binding Globulin': 'SHBG',
  'SHBG': 'SHBG',
  'Follicle Stim Hormone': 'FSH',
  'FSH': 'FSH',
  'Luteinizing Hormone': 'LH',
  'LH': 'LH',
  'Estradiol': 'E2',
  'DHEA Sulfate': 'DHEAS',
  'DHEA-S': 'DHEAS',
  'Prolactin': 'PRL',
  'Cortisol': 'CORTISOL',
  'Cortisol, Random': 'CORTISOL',
  'Progesterone': 'PROG',
  
  // === THYROID ===
  'TSH': 'TSH',
  'Free T3': 'FT3',
  'Free T4': 'FT4',
  'Total T3': 'TT3',
  'Total T4': 'TT4',
  'Reverse T3': 'RT3',
  'Thyroid Peroxidase Antibodies': 'TPO',
  'Thyroglobulin Antibodies': 'TG_AB',
  
  // === METABOLIC / DIABETES ===
  'Hemoglobin A1C %': 'HBA1C',
  'HbA1c': 'HBA1C',
  'Glucose': 'GLUCOSE',
  'Fasting Glucose': 'GLUCOSE',
  'Insulin': 'INSULIN',
  'Fasting Insulin': 'INSULIN',
  'HOMA-IR': 'HOMA_IR',
  
  // === VITAMINS & MINERALS ===
  'Vitamin D 25': 'VIT_D',
  'Vitamin D, 25 Hydroxy': 'VIT_D',
  '25-Hydroxy Vitamin D': 'VIT_D',
  'Vitamin B12': 'VIT_B12',
  'B12': 'VIT_B12',
  'Folate': 'FOLATE',
  'Folic Acid': 'FOLATE',
  'Ferritin': 'FERRITIN',
  'Iron': 'IRON',
  'Serum Iron': 'IRON',
  'TIBC': 'TIBC',
  'Iron Saturation': 'IRON_SAT',
  'Magnesium': 'MAG',
  'Zinc': 'ZINC',
  'Copper': 'COPPER',
  
  // === LIPIDS ===
  'Cholesterol': 'CHOL',
  'Total Cholesterol': 'CHOL',
  'Triglycerides': 'TRIG',
  'HDL': 'HDL',
  'HDL Cholesterol': 'HDL',
  'LDL': 'LDL',
  'Calc LDL': 'LDL',
  'LDL Cholesterol': 'LDL',
  'VLDL': 'VLDL',
  'VLDL (Calc)': 'VLDL',
  'Apolipoprotein B': 'APOB',
  'ApoB': 'APOB',
  'Lipoprotein(a)': 'LPA',
  'Lp(a)': 'LPA',
  'Chol/HDL': 'CHOL_HDL_RATIO',
  'Risk Ratio LDL/HDL': 'LDL_HDL_RATIO',
  
  // === INFLAMMATION ===
  'hsCRP': 'HSCRP',
  'High-Sensitivity CRP': 'HSCRP',
  'hs-CRP': 'HSCRP',
  'C-Reactive Protein': 'CRP',
  'Homocysteine': 'HCY',
  'Fibrinogen': 'FIB',
  'Uric Acid': 'URIC_ACID',
  
  // === KIDNEY ===
  'Creatinine': 'CREAT',
  'Creatinine, Serum': 'CREAT',
  'BUN': 'BUN',
  'Blood Urea Nitrogen': 'BUN',
  'BUN/Creat (Calc)': 'BUN_CREAT',
  'eGFR': 'EGFR',
  'eGFR non-African Amer.': 'EGFR',
  'eGFR African Amer': 'EGFR_AA',
  'Cystatin C': 'CYSC',
  
  // === LIVER ===
  'ALT': 'ALT',
  'SGPT': 'ALT',
  'AST': 'AST',
  'SGOT': 'AST',
  'AlkP': 'ALP',
  'Alkaline Phosphatase': 'ALP',
  'GGT': 'GGT',
  'Gamma GT': 'GGT',
  'Total Bilirubin': 'TBILI',
  'Bilirubin': 'TBILI',
  'Direct Bilirubin': 'DBILI',
  'Albumin': 'ALB',
  'Total Protein': 'TP',
  'Globulin': 'GLOB',
  'Globulin (Calc)': 'GLOB',
  'A/G Calc': 'AG_RATIO',
  
  // === ELECTROLYTES ===
  'Sodium': 'NA',
  'Potassium': 'K',
  'Chloride': 'CL',
  'CO2': 'CO2',
  'Carbon Dioxide': 'CO2',
  'Calcium': 'CA',
  'Phosphorus': 'PHOS',
  'Anion Gap': 'ANION_GAP',
  
  // === HEMATOLOGY / CBC ===
  'White Blood Cell Count': 'WBC',
  'WBC': 'WBC',
  'Red Blood Cell Count': 'RBC',
  'RBC': 'RBC',
  'Hemoglobin': 'HGB',
  'Hematocrit': 'HCT',
  'MCV': 'MCV',
  'MCH': 'MCH',
  'MCHC': 'MCHC',
  'RDW': 'RDW',
  'RDW-CV': 'RDW_CV',
  'RDW-SD': 'RDW_SD',
  'Platelet': 'PLT',
  'Platelet Count': 'PLT',
  'MPV': 'MPV',
  
  // CBC Differential
  'Neutrophils %': 'NEUT_PCT',
  'Lymphocytes%': 'LYMPH_PCT',
  'Monocytes%': 'MONO_PCT',
  'Eosinophils %': 'EOS_PCT',
  'Basophils %': 'BASO_PCT',
  'NEUT#': 'NEUT_ABS',
  'LYMPH#': 'LYMPH_ABS',
  'MONO#': 'MONO_ABS',
  'EO#': 'EOS_ABS',
  'BASO#': 'BASO_ABS',
  'Immature Granulocytes%': 'IG_PCT',
  'IG#': 'IG_ABS',
  'NRBC %': 'NRBC_PCT',
  'NRBC #': 'NRBC_ABS',
  
  // === CANCER SCREENING ===
  'Total PSA': 'PSA',
  'PSA': 'PSA',
  'PSA, Total, Diagnostic': 'PSA',
  'Free PSA': 'PSA_FREE',
  
  // === GROWTH / AGING ===
  'IGF-I': 'IGF1',
  'IGF-1': 'IGF1',
  'Insulin-Like Growth Factor': 'IGF1',
  
  // === OTHER ===
  'Sed Rate': 'ESR',
  'ESR': 'ESR',
  'Prealbumin': 'PREALB',
};

// Normalize marker name to our ID
function normalizeMarker(markerName) {
  if (!markerName) return null;
  
  // Clean the marker name
  const cleaned = markerName.trim();
  
  // Direct lookup
  if (MARKER_MAP[cleaned]) {
    return MARKER_MAP[cleaned];
  }
  
  // Try case-insensitive match
  const lowerCleaned = cleaned.toLowerCase();
  for (const [key, value] of Object.entries(MARKER_MAP)) {
    if (key.toLowerCase() === lowerCleaned) {
      return value;
    }
  }
  
  // Try partial match for common patterns
  for (const [key, value] of Object.entries(MARKER_MAP)) {
    if (cleaned.includes(key) || key.includes(cleaned)) {
      return value;
    }
  }
  
  // Return cleaned name if no match (for manual review)
  return `UNKNOWN_${cleaned.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20)}`;
}

// Parse numeric value from result string
function parseValue(valueStr) {
  if (!valueStr) return null;
  
  // Handle < or > prefixes
  const cleaned = valueStr.toString().replace(/[<>]/g, '').trim();
  
  // Extract numeric value
  const match = cleaned.match(/[\d.]+/);
  if (match) {
    return parseFloat(match[0]);
  }
  return null;
}

// Parse reference range
function parseRefRange(refStr) {
  if (!refStr) return { low: null, high: null };
  
  const cleaned = refStr.toString().trim();
  
  // Handle ">X" format
  if (cleaned.startsWith('>')) {
    const val = parseFloat(cleaned.replace('>', ''));
    return { low: val, high: null };
  }
  
  // Handle "<X" format
  if (cleaned.startsWith('<')) {
    const val = parseFloat(cleaned.replace('<', ''));
    return { low: null, high: val };
  }
  
  // Handle "X-Y" format
  const rangeMatch = cleaned.match(/([\d.]+)\s*[-–]\s*([\d.]+)/);
  if (rangeMatch) {
    return { low: parseFloat(rangeMatch[1]), high: parseFloat(rangeMatch[2]) };
  }
  
  return { low: null, high: null };
}

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
    const { pdf_base64, patient_id } = JSON.parse(event.body);

    if (!pdf_base64) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No PDF data provided' })
      };
    }

    // Call Claude API to extract data
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: pdf_base64
                }
              },
              {
                type: 'text',
                text: `Extract ALL lab results from this Tribal Diagnostics PDF.

Return a JSON object with this EXACT structure:
{
  "report_id": "the Sample ID or Lab Accession number (e.g., C25058397)",
  "patient_name": "patient name from header",
  "sample_date": "date collected",
  "results": [
    {
      "marker_name": "exact marker name as shown",
      "value": "numeric value only (no units)",
      "units": "the unit of measurement",
      "ref_low": "lower reference range (number only, null if none)",
      "ref_high": "upper reference range (number only, null if none)",
      "flag": "H, L, A, or null if normal",
      "category": "the section header (e.g., Hormone, Lipid, Hematology)",
      "previous_value": "previous result 1 value if shown, null otherwise",
      "previous_date": "date of previous result if shown, null otherwise"
    }
  ]
}

Important:
- Extract EVERY marker from the Clinical Results sections
- Include markers from Results Summary AND detailed Clinical Results
- For values like "<0.11", extract as 0.11 and note the qualifier
- For reference ranges like ">60", set ref_low to 60 and ref_high to null
- Include the category/section each marker belongs to
- Extract previous results if available (Previous Result 1 column)
- Return ONLY the JSON object, no other text`
              }
            ]
          }
        ]
      })
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error('Anthropic API error:', errorText);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Claude API failed', details: errorText })
      };
    }

    const claudeData = await anthropicResponse.json();
    const responseText = claudeData.content[0].text;

    // Parse Claude's JSON response
    let parsedData;
    try {
      // Try to extract JSON from response (handle markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', responseText);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Failed to parse Claude response', 
          raw: responseText.substring(0, 500) 
        })
      };
    }

    // Process and normalize results
    const processedResults = [];
    let index = 1;

    for (const result of parsedData.results || []) {
      const markerId = normalizeMarker(result.marker_name);
      const value = parseValue(result.value);
      
      // Skip if no valid value
      if (value === null) continue;

      const refRange = parseRefRange(`${result.ref_low || ''}-${result.ref_high || ''}`);

      processedResults.push({
        result_id: `${parsedData.report_id}-${String(index).padStart(3, '0')}`,
        report_id: parsedData.report_id,
        patient_id: patient_id || '',
        marker_id_inbox: markerId,
        marker_name_original: result.marker_name,
        value: value,
        units: result.units || '',
        ref_low: result.ref_low || refRange.low,
        ref_high: result.ref_high || refRange.high,
        flag: result.flag || '',
        category: result.category || '',
        previous_value: parseValue(result.previous_value),
        previous_date: result.previous_date || ''
      });

      index++;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        report_id: parsedData.report_id,
        patient_name: parsedData.patient_name,
        sample_date: parsedData.sample_date,
        results: processedResults,
        total_markers: processedResults.length
      })
    };

  } catch (error) {
    console.error('Parser error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Parser failed', message: error.message })
    };
  }
};
