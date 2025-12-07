const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Marker mappings for Formula Wellness / Tribal Diagnostics labs
const MARKER_MAP = {
  // === HORMONES ===
  'testosterone': 'TEST',
  'total testosterone': 'TEST',
  'free testosterone': 'FREE_T',
  'calc free testosterone': 'FREE_T',
  'sex hormone binding globulin': 'SHBG',
  'shbg': 'SHBG',
  'follicle stim hormone': 'FSH',
  'fsh': 'FSH',
  'luteinizing hormone': 'LH',
  'lh': 'LH',
  'estradiol': 'E2',
  'dhea sulfate': 'DHEAS',
  'dhea-s': 'DHEAS',
  'prolactin': 'PRL',
  'cortisol': 'CORTISOL',
  'cortisol, random': 'CORTISOL',
  'progesterone': 'PROG',
  
  // === THYROID ===
  'tsh': 'TSH',
  'free t3': 'FT3',
  'free t4': 'FT4',
  'total t3': 'TT3',
  'total t4': 'TT4',
  'reverse t3': 'RT3',
  'thyroid peroxidase antibodies': 'TPO',
  'thyroglobulin antibodies': 'TG_AB',
  
  // === METABOLIC / DIABETES ===
  'hemoglobin a1c %': 'HBA1C',
  'hemoglobin a1c': 'HBA1C',
  'hba1c': 'HBA1C',
  'hgba1c': 'HBA1C',
  'glucose': 'GLUCOSE',
  'fasting glucose': 'GLUCOSE',
  'insulin': 'INSULIN',
  'fasting insulin': 'INSULIN',
  'homa-ir': 'HOMA_IR',
  
  // === VITAMINS & MINERALS ===
  'vitamin d 25': 'VIT_D',
  'vitamin d, 25 hydroxy': 'VIT_D',
  '25-hydroxy vitamin d': 'VIT_D',
  'vitamin b12': 'VIT_B12',
  'b12': 'VIT_B12',
  'folate': 'FOLATE',
  'folic acid': 'FOLATE',
  'ferritin': 'FERRITIN',
  'iron': 'IRON',
  'serum iron': 'IRON',
  'tibc': 'TIBC',
  'iron saturation': 'IRON_SAT',
  'magnesium': 'MAG',
  'zinc': 'ZINC',
  'copper': 'COPPER',
  
  // === LIPIDS ===
  'cholesterol': 'CHOL',
  'total cholesterol': 'CHOL',
  'triglycerides': 'TRIG',
  'hdl': 'HDL',
  'hdl cholesterol': 'HDL',
  'ldl': 'LDL',
  'calc ldl': 'LDL',
  'ldl cholesterol': 'LDL',
  'vldl': 'VLDL',
  'vldl (calc)': 'VLDL',
  'apolipoprotein b': 'APOB',
  'apob': 'APOB',
  'lipoprotein(a)': 'LPA',
  'lp(a)': 'LPA',
  'chol/hdl': 'CHOL_HDL_RATIO',
  'risk ratio ldl/hdl': 'LDL_HDL_RATIO',
  
  // === INFLAMMATION ===
  'hscrp': 'HSCRP',
  'high-sensitivity crp': 'HSCRP',
  'hs-crp': 'HSCRP',
  'c-reactive protein': 'CRP',
  'homocysteine': 'HCY',
  'fibrinogen': 'FIB',
  'uric acid': 'URIC_ACID',
  
  // === KIDNEY ===
  'creatinine': 'CREAT',
  'creatinine, serum': 'CREAT',
  'bun': 'BUN',
  'blood urea nitrogen': 'BUN',
  'bun/creat (calc)': 'BUN_CREAT',
  'egfr': 'EGFR',
  'egfr non-african amer.': 'EGFR',
  'egfr african amer': 'EGFR_AA',
  'cystatin c': 'CYSC',
  
  // === LIVER ===
  'alt': 'ALT',
  'sgpt': 'ALT',
  'ast': 'AST',
  'sgot': 'AST',
  'alkp': 'ALP',
  'alkaline phosphatase': 'ALP',
  'ggt': 'GGT',
  'gamma gt': 'GGT',
  'total bilirubin': 'TBILI',
  'bilirubin': 'TBILI',
  'direct bilirubin': 'DBILI',
  'albumin': 'ALB',
  'total protein': 'TP',
  'globulin': 'GLOB',
  'globulin (calc)': 'GLOB',
  'a/g calc': 'AG_RATIO',
  
  // === ELECTROLYTES ===
  'sodium': 'NA',
  'potassium': 'K',
  'chloride': 'CL',
  'co2': 'CO2',
  'carbon dioxide': 'CO2',
  'calcium': 'CA',
  'phosphorus': 'PHOS',
  'anion gap': 'ANION_GAP',
  
  // === HEMATOLOGY / CBC ===
  'white blood cell count': 'WBC',
  'wbc': 'WBC',
  'red blood cell count': 'RBC',
  'rbc': 'RBC',
  'hemoglobin': 'HGB',
  'hematocrit': 'HCT',
  'mcv': 'MCV',
  'mch': 'MCH',
  'mchc': 'MCHC',
  'rdw': 'RDW',
  'rdw-cv': 'RDW_CV',
  'rdw-sd': 'RDW_SD',
  'platelet': 'PLT',
  'platelet count': 'PLT',
  'mpv': 'MPV',
  
  // CBC Differential
  'neutrophils %': 'NEUT_PCT',
  'lymphocytes%': 'LYMPH_PCT',
  'monocytes%': 'MONO_PCT',
  'eosinophils %': 'EOS_PCT',
  'basophils %': 'BASO_PCT',
  'neut#': 'NEUT_ABS',
  'lymph#': 'LYMPH_ABS',
  'mono#': 'MONO_ABS',
  'eo#': 'EOS_ABS',
  'baso#': 'BASO_ABS',
  'immature granulocytes%': 'IG_PCT',
  'ig#': 'IG_ABS',
  'nrbc %': 'NRBC_PCT',
  'nrbc #': 'NRBC_ABS',
  
  // === CANCER SCREENING ===
  'total psa': 'PSA',
  'psa': 'PSA',
  'psa, total, diagnostic': 'PSA',
  'free psa': 'PSA_FREE',
  
  // === GROWTH / AGING ===
  'igf-i': 'IGF1',
  'igf-1': 'IGF1',
  'insulin-like growth factor': 'IGF1',
};

function normalizeMarkerName(rawName) {
  if (!rawName) return 'UNKNOWN';
  
  const cleaned = rawName.toLowerCase().trim();
  
  // Direct match
  if (MARKER_MAP[cleaned]) {
    return MARKER_MAP[cleaned];
  }
  
  // Try partial matches
  for (const [key, value] of Object.entries(MARKER_MAP)) {
    if (cleaned.includes(key) || key.includes(cleaned)) {
      return value;
    }
  }
  
  // Return cleaned name for manual review
  console.log('[Tribal Parser] Unmapped marker:', rawName);
  return `UNKNOWN_${rawName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20)}`;
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

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body);
    const { pdfBase64, patientId, reportId } = body;

    if (!pdfBase64) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'No PDF data provided' }) };
    }

    console.log('[Tribal Parser] Processing PDF for patient:', patientId);

    const extractionPrompt = `Extract ALL lab results from this Tribal Diagnostics PDF report.

FIRST, extract patient information from the header:
- patient_name: Full name as shown (e.g., "John Smith")
- patient_dob: Date of birth (format as MM/DD/YYYY if possible)
- patient_sex: Gender/Sex if shown (e.g., "Male", "Female")
- report_id: Sample ID from header (e.g., "C25058397")
- sample_date: Date collected

THEN, for each marker/test result, extract:
- marker_name: The exact marker name as shown (e.g., "Hemoglobin A1C %", "Free T3", "Testosterone")
- value: The numeric result only (use the number from Normal or Abnormal column)
- units: The unit of measurement
- ref_low: Lower reference range (number only, null if none)
- ref_high: Upper reference range (number only, null if none)
- flag: "H" if high, "L" if low, "A" if abnormal, or null if normal
- category: The section header (e.g., "Hormone", "Lipid", "Hematology", "Diabetes")
- previous_value: The "Previous Result 1" value if shown, null otherwise

Return ONLY valid JSON (no markdown, no code blocks):
{
  "report_id": "C25058397",
  "patient_name": "John Smith",
  "patient_dob": "05/15/1980",
  "patient_sex": "Male",
  "sample_date": "11/20/2025",
  "markers": [
    {"marker_name": "TSH", "value": 3.60, "units": "uIU/mL", "ref_low": 0.35, "ref_high": 4.94, "flag": null, "category": "Thyroid", "previous_value": 2.80},
    {"marker_name": "Hemoglobin A1C %", "value": 5.7, "units": "%", "ref_low": 4.2, "ref_high": 5.6, "flag": "H", "category": "Diabetes", "previous_value": 5.8}
  ]
}

CRITICAL:
- Extract patient name, DOB, and sex from the PDF header FIRST
- Extract ALL markers from ALL pages
- Include BOTH normal AND abnormal results
- For values like "<0.11", use 0.11 as the value
- For reference ranges like ">60", set ref_low to 60, ref_high to null
- Do NOT skip any markers`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 8000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: pdfBase64
              }
            },
            {
              type: 'text',
              text: extractionPrompt
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Tribal Parser] Claude API error:', response.status, errorText);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Claude API failed', details: errorText }) };
    }

    const data = await response.json();
    let extractedText = data.content[0].text;
    
    // Clean up response
    extractedText = extractedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let parsed;
    try {
      parsed = JSON.parse(extractedText);
    } catch (parseError) {
      console.error('[Tribal Parser] JSON parse error:', parseError);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to parse Claude response', raw: extractedText.substring(0, 500) }) };
    }

    const finalReportId = reportId || parsed.report_id || `RPT-${Date.now()}`;
    
    console.log('[Tribal Parser] Report ID:', finalReportId);
    console.log('[Tribal Parser] Extracted', parsed.markers?.length || 0, 'markers');

    // Format results
    const results = (parsed.markers || []).map((marker, index) => {
      const markerId = normalizeMarkerName(marker.marker_name);
      return {
        result_id: `${finalReportId}-${String(index + 1).padStart(3, '0')}`,
        report_id: finalReportId,
        patient_id: patientId || '',
        marker_id_inbox: markerId,
        marker_name_original: marker.marker_name,
        value: parseFloat(marker.value) || 0,
        units: marker.units || '',
        ref_low: marker.ref_low,
        ref_high: marker.ref_high,
        flag: marker.flag || '',
        category: marker.category || '',
        previous_value: marker.previous_value,
        previous_date: marker.previous_date || ''
      };
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        report_id: finalReportId,
        patient_name: parsed.patient_name || '',
        patient_dob: parsed.patient_dob || '',
        patient_sex: parsed.patient_sex || '',
        sample_date: parsed.sample_date || '',
        patient_id: patientId || '',
        count: results.length,
        results: results
      })
    };

  } catch (error) {
    console.error('[Tribal Parser] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server error', details: error.message })
    };
  }
};
