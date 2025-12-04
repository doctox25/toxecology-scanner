const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// EXACT marker_id mappings from ToxEcology Marker_Vocabulary ontology
// Format: 'vibrant pdf name (lowercase)': 'YOUR_MARKER_ID'
const MARKER_MAP = {
  // ===== DOM_METALS (20 markers) =====
  'mercury': 'MERC',
  'uranium': 'URAN',
  'cadmium': 'CAD',
  'lead': 'LEAD',
  'palladium': 'PALL',
  'bismuth': 'BIS',
  'beryllium': 'BER',
  'antimony': 'ANT',
  'nickel': 'NICK',
  'thorium': 'THOR',
  'platinum': 'PLAT',
  'gadolinium': 'GAD',
  'barium': 'BAR',
  'tungsten': 'TUNG',
  'thallium': 'THAL',
  'arsenic': 'ARS',
  'aluminum': 'ALU',
  'cesium': 'CES',
  'tin': 'TIN',
  'tellurium': 'TELL',

  // ===== DOM_MYCOTOX (31 markers) =====
  'aflatoxin b2': 'AFB2',
  'aflatoxin b1': 'AFB1',
  'dihydrocitrinone': 'DHC',
  'roridin a': 'ROR_A',
  'sterigmatocystin': 'STC',
  'citrinin': 'CTN',
  'nivalenol': 'NIV',
  'aflatoxin g1': 'AFG1',
  'mycophenolic acid': 'MPA',
  'chaetoglobosin a': 'CHA',
  'verrucarin a': 'VER_A',
  'enniatin b1': 'ENN_B1',
  'gliotoxin': 'GLIO',
  'diacetoxyscirpenol': 'DAS',
  't-2 toxin': 'T2_TOX',
  't2 toxin': 'T2_TOX',
  'patulin': 'PAT',
  'deoxynivalenol': 'DON',
  'roridin l2': 'ROR_L2',
  'roridin l-2': 'ROR_L2',
  'aflatoxin g2': 'AFG2',
  'aflatoxin m1': 'AFM1',
  'fumonisin b1': 'F_B1',
  'fumonisins b1': 'F_B1',
  'verrucarin j': 'VER_J',
  'zearalenone': 'ZEN',
  'fumonisin b3': 'F_B3',
  'fumonisins b3': 'F_B3',
  'roridin e': 'ROR_E',
  'satratoxin g': 'SAT_G',
  'fumonisin b2': 'F_B2',
  'fumonisins b2': 'F_B2',
  'ochratoxin a': 'OTA',
  'satratoxin h': 'SAT_H',

  // ===== DOM_PARABENS (4 markers) =====
  'methylparaben': 'M_PARA',
  'butylparaben': 'B_PARA',
  'propylparaben': 'P_PARA',
  'ethylparaben': 'E_PARA',

  // ===== DOM_PESTICIDES (14 markers) =====
  'dimethyldithiophosphate': 'DMDTP',
  'glyphosate': 'GLYP',
  'diethylthiophosphate': 'DETP',
  'diethyldithiophosphate': 'DEDTP',
  'diethyl phosphate': 'DEP',
  '2,4-dichlorophenoxyacetic acid': '2_4_D',
  '2,4-d': '2_4_D',
  '2,2-bis(4-chlorophenyl) acetic acid': 'DDA',
  'dda': 'DDA',
  '3-phenoxybenzoic acid': '3PBA',
  '3pba': '3PBA',
  'atrazine': 'ATRA',
  'dimethylthiophosphate': 'DMTP',
  'dimethyl phosphate': 'DMP',
  'atrazine mercapturate': 'ATRA_M',
  'perchlorate': 'PERC',

  // ===== DOM_PFAS (22 markers) =====
  'genx': 'GENX',
  'genx/hpfo-da': 'GENX',
  'genx / hpfo-da': 'GENX',
  'hpfo-da': 'GENX',
  'perfluorooctanoic acid': 'PFOA',
  'pfoa': 'PFOA',
  'perfluoropentanoic acid': 'PFPEA',
  'pfpea': 'PFPEA',
  '9-chlorohexadecafluoro-3-oxanonane-1-sulfonate': '9CL_P',
  '9cl-p': '9CL_P',
  'dodecafluoro-3h-4,8-dioxanoate': 'NADONA',
  'nadona': 'NADONA',
  'perfluoro-n-[1,2-13c2] decanoic acid': 'MPFDA',
  'mpfda': 'MPFDA',
  'perfluoroundecanoic acid': 'PFUNA',
  'pfuna': 'PFUNA',
  'perfluoroheptanoic acid': 'PFHPA',
  'pfhpa': 'PFHPA',
  'perfluoro-n-[1,2-13c2] hexanoic acid': 'C13_PFHXA',
  'perfluorooctane sulfonic acid': 'PFOS',
  'pfos': 'PFOS',
  'perfluorohexane sulfonic acid': 'PFHXS',
  'pfhxs': 'PFHXS',
  'perfluorotridecanoic acid': 'PFTRDA',
  'pftrda': 'PFTRDA',
  'perfluorodecanoic acid': 'PFDEA',
  'pfdea': 'PFDEA',
  'perfluorotetradecanoic acid': 'PFTEDA',
  'pfteda': 'PFTEDA',
  'perfluoro-1-heptane sulfonic acid': 'PFHPS',
  'pfhps': 'PFHPS',
  'perfluorononanoic acid': 'PFNA',
  'pfna': 'PFNA',
  'perfluorododecanoic acid': 'PFDOA',
  'pfdoa': 'PFDOA',
  'perfluorobutanoic acid': 'PFBA',
  'pfba': 'PFBA',
  'perfluoro-1-[1,2,3,4-13c4] octanesulfonic acid': 'C13_PFOS',
  'perfluoro-[1,2-13c2] octanoic acid': 'M2PFOA',
  'm2pfoa': 'M2PFOA',
  'perfluorohexanoic acid': 'PFHXA',
  'pfhxa': 'PFHXA',

  // ===== DOM_PHTHALATES (4 markers) =====
  'mono-(2-ethyl-5-oxohexyl) phthalate': 'MEOHP',
  'meohp': 'MEOHP',
  'mono-(2-ethyl-5-hydroxyhexyl) phthalate': 'MEHHP',
  'mehhp': 'MEHHP',
  'mono-ethyl phthalate': 'METP',
  'mono ethyl phthalate': 'METP',
  'metp': 'METP',
  'mono-2-ethylhexyl phthalate': 'MEHP',
  'mono 2-ethylhexyl phthalate': 'MEHP',
  'mehp': 'MEHP',

  // ===== DOM_PLASTICS (4 markers) =====
  '4-nonylphenol': '4_NON',
  'bisphenol a': 'BPA',
  'bpa': 'BPA',
  'diphenyl phosphate': 'DPP',
  'dpp': 'DPP',
  'triclosan': 'TCS',

  // ===== DOM_VOC (12 markers) =====
  '2-methylhippuric acid': '2MHA',
  '2mha': '2MHA',
  'n-acetyl (3,4-dihydroxybutyl) cysteine': 'NADB_CYS',
  'n-acetyl-s-(3,4-dihydroxybutyl)-cysteine': 'NADB_CYS',
  'n-acetyl-s-(3,4-dihydroxybutyl)-l-cysteine': 'NADB_CYS',
  'phenylglyoxylic acid': 'PGO',
  'phenyl glyoxylic acid': 'PGO',
  'pgo': 'PGO',
  'n-acetyl (propyl) cysteine': 'NAPR',
  'n-acetyl-s-(propyl)-cysteine': 'NAPR',
  'napr': 'NAPR',
  '3-methylhippuric acid': '3MHA',
  '3mha': '3MHA',
  '2-hydroxyethyl mercapturic acid': '2HEMA',
  'hema': '2HEMA',
  '2hema': '2HEMA',
  'n-acetyl phenyl cysteine': 'NAP',
  'nap': 'NAP',
  'n-acetyl (2-cyanoethyl) cysteine': 'NACE',
  'n-acetyl-s-(2-cyanoethyl)-cysteine': 'NACE',
  'nace': 'NACE',
  'n-acetyl-s-(2-carbamoylethyl)-cysteine': 'NAC_2_CARB',
  'n-acetyl (2-carbamoylethyl) cysteine': 'NAC_2_CARB',
  'n-acetyl-s-(2-carbamoylethyl)-l-cysteine': 'NAC_2_CARB',
  '2-hydroxyisobutyric acid': '2HIB',
  '2hib': '2HIB',
  '4-methylhippuric acid': '4MHA',
  '4mha': '4MHA',
  'n-acetyl (2,hydroxypropyl) cysteine': 'NAHP',
  'n-acetyl-s-(2-hydroxypropyl)-cysteine': 'NAHP',
  'nahp': 'NAHP',

  // ===== DOM_METABOLIC (1 marker) =====
  'tiglylglycine': 'TG'
};

function normalizeMarkerName(rawName) {
  if (!rawName) return 'UNKNOWN';
  
  // Clean up the name
  let cleaned = rawName.toLowerCase().trim();
  
  // Remove parenthetical abbreviations like "(DEDTP)" or "(2MHA)" 
  // but keep the content for matching
  const parenMatch = rawName.match(/\(([A-Z0-9_-]+)\)/i);
  const abbrevInParen = parenMatch ? parenMatch[1].toUpperCase() : null;
  
  cleaned = cleaned.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  
  // Direct match on cleaned name
  if (MARKER_MAP[cleaned]) {
    return MARKER_MAP[cleaned];
  }
  
  // Check if abbreviation from parentheses is a direct match
  if (abbrevInParen) {
    const abbrevLower = abbrevInParen.toLowerCase();
    if (MARKER_MAP[abbrevLower]) {
      return MARKER_MAP[abbrevLower];
    }
    // Check if abbrev itself is a valid marker_id
    const validIds = new Set(Object.values(MARKER_MAP));
    if (validIds.has(abbrevInParen)) {
      return abbrevInParen;
    }
    if (validIds.has(abbrevInParen.replace(/-/g, '_'))) {
      return abbrevInParen.replace(/-/g, '_');
    }
  }
  
  // Special handling for N-Acetyl-S compounds (tricky VOC markers)
  if (cleaned.includes('n-acetyl') || cleaned.includes('acetyl')) {
    if (cleaned.includes('carbamoylethyl') || cleaned.includes('carbamoyl')) {
      return 'NAC_2_CARB';
    }
    if (cleaned.includes('dihydroxybutyl') || cleaned.includes('3,4-dihydroxy')) {
      return 'NADB_CYS';
    }
    if (cleaned.includes('cyanoethyl') || cleaned.includes('2-cyano')) {
      return 'NACE';
    }
    if (cleaned.includes('hydroxypropyl')) {
      return 'NAHP';
    }
    if (cleaned.includes('phenyl') && !cleaned.includes('glyoxylic')) {
      return 'NAP';
    }
    if (cleaned.includes('propyl') && !cleaned.includes('hydroxy')) {
      return 'NAPR';
    }
  }
  
  // Try partial matches - check if any key is contained in the name
  for (const [key, value] of Object.entries(MARKER_MAP)) {
    if (cleaned.includes(key) && key.length > 3) {
      return value;
    }
  }
  
  // Fallback: use abbreviation from parentheses if present
  if (abbrevInParen) {
    return abbrevInParen.replace(/-/g, '_');
  }
  
  // Last resort: log and create short code
  console.log('[Vibrant Parser] Unmapped marker:', rawName);
  const words = rawName.replace(/[^a-zA-Z\s]/g, ' ').split(/\s+/).filter(w => w.length > 0);
  return words.map(w => w[0]).join('').toUpperCase().substring(0, 8) || 'UNK';
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

    console.log('[Vibrant Parser] Processing PDF for patient:', patientId, 'report:', reportId);

    const extractionPrompt = `Extract ALL test results from this Vibrant Wellness lab report PDF.

For each marker/test result, extract:
- marker_name: The COMPLETE name of the marker as shown (e.g., "N-Acetyl-S-(2-carbamoylethyl)-L-cysteine" or "Diethyldithiophosphate (DEDTP)")
- value: The numeric result only (if "<LOD" or "ND" or "Not Detected", use 0)

Return ONLY valid JSON (no markdown, no code blocks):
{
  "markers": [
    {"marker_name": "Arsenic", "value": 12.5},
    {"marker_name": "Diethyldithiophosphate (DEDTP)", "value": 1.0},
    {"marker_name": "N-Acetyl-S-(2-carbamoylethyl)-L-cysteine", "value": 80.5},
    {"marker_name": "N-Acetyl (3,4-Dihydroxybutyl) Cysteine", "value": 119.7},
    {"marker_name": "Zearalenone (ZEN)", "value": 0.19}
  ]
}

CRITICAL INSTRUCTIONS:
- Extract ALL markers from ALL pages of the report
- Include both normal AND elevated results
- Use the COMPLETE marker name exactly as shown in the PDF
- Include any abbreviations in parentheses if shown (e.g., "Nickel" or "Zearalenone (ZEN)")
- Value must be a number only (no units, no text)
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
      console.error('[Vibrant Parser] Claude API error:', response.status, errorText);
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
      console.error('[Vibrant Parser] JSON parse error:', parseError);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to parse Claude response', raw: extractedText.substring(0, 500) }) };
    }

    // Use user-provided reportId
    const finalReportId = reportId || `RPT-${Date.now()}`;
    
    console.log('[Vibrant Parser] Report ID:', finalReportId);
    console.log('[Vibrant Parser] Extracted', parsed.markers?.length || 0, 'markers');

    // Format for Airtable - only the 5 fields needed
    const airtableRecords = (parsed.markers || []).map((marker, index) => {
      const markerId = normalizeMarkerName(marker.marker_name);
      return {
        result_id: `${finalReportId}-${String(index + 1).padStart(3, '0')}`,
        report_id: finalReportId,
        patient_id: patientId || '',
        marker_id_inbox: markerId,
        value: parseFloat(marker.value) || 0
      };
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        report_id: finalReportId,
        patient_id: patientId || '',
        count: airtableRecords.length,
        results: airtableRecords
      })
    };

  } catch (error) {
    console.error('[Vibrant Parser] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server error', details: error.message })
    };
  }
};
