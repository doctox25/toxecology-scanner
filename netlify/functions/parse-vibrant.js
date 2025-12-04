const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Complete marker mapping: Vibrant PDF names → Your marker_id abbreviations
const MARKER_MAP = {
  // Mycotoxins
  'aflatoxin b1': 'AFB1',
  'aflatoxin b2': 'AFB2',
  'aflatoxin g1': 'AFG1',
  'aflatoxin g2': 'AFG2',
  'aflatoxin m1': 'AFM1',
  'ochratoxin a': 'OTA',
  'gliotoxin': 'GLIO',
  'mycophenolic acid': 'MPA',
  'sterigmatocystin': 'STC',
  'roridin e': 'ROR_E',
  'roridin a': 'ROR_A',
  'roridin l2': 'ROR_L2',
  'roridin l-2': 'ROR_L2',
  'verrucarin a': 'VER_A',
  'verrucarin j': 'VER_J',
  'satratoxin g': 'SAT_G',
  'satratoxin h': 'SAT_H',
  't-2 toxin': 'T2_TOX',
  't2 toxin': 'T2_TOX',
  'deoxynivalenol': 'DON',
  'zearalenone': 'ZEA',
  'citrinin': 'CTN',
  'chaetoglobosin a': 'CHA',
  'enniatin b': 'ENN_B',
  'enniatin b1': 'ENN_B1',
  'fumonisin b1': 'F_B1',
  'fumonisins b1': 'F_B1',
  'fumonisin b2': 'F_B2',
  'fumonisins b2': 'F_B2',
  'fumonisin b3': 'F_B3',
  'fumonisins b3': 'F_B3',
  'patulin': 'PAT',
  'dihydrocitrinone': 'DHC',
  'diacetoxyscirpenol': 'DAS',
  'nivalenol': 'NIV',
  
  // Heavy Metals
  'arsenic': 'ARS',
  'lead': 'LEAD',
  'mercury': 'MERC',
  'cadmium': 'CAD',
  'aluminum': 'ALU',
  'barium': 'BAR',
  'beryllium': 'BER',
  'bismuth': 'BIS',
  'cesium': 'CES',
  'gadolinium': 'GAD',
  'nickel': 'NI',
  'palladium': 'PALL',
  'platinum': 'PLAT',
  'tellurium': 'TELL',
  'thallium': 'THAL',
  'thorium': 'THOR',
  'tin': 'TIN',
  'tungsten': 'TUNG',
  'uranium': 'URAN',
  'antimony': 'ANT',
  
  // PFAS
  'pfos': 'PFOS',
  'pfoa': 'PFOA',
  'pfna': 'PFNA',
  'pfda': 'PFDA',
  'pfunda': 'PFUNDA',
  'pfdoa': 'PFDOA',
  'pftrda': 'PFTRDA',
  'pfhxa': 'PFHXA',
  'pfhxs': 'PFHXS',
  'pfhpa': 'PFHPA',
  'pfhps': 'PFHPS',
  'pfba': 'PFBA',
  'pfbs': 'PFBS',
  'pfpea': 'PFPEA',
  'genx': 'GENX',
  'genx/hpfo-da': 'GENX',
  'perfluorooctane sulfonic acid': 'PFOS',
  'perfluorooctanoic acid': 'PFOA',
  'perfluorononanoic acid': 'PFNA',
  'perfluorodecanoic acid': 'PFDA',
  
  // Phthalates
  'mono-ethyl phthalate': 'METP',
  'mono ethyl phthalate': 'METP',
  'metp': 'METP',
  'mono-2-ethylhexyl phthalate': 'MEHP',
  'mono 2-ethylhexyl phthalate': 'MEHP',
  'mehp': 'MEHP',
  'mono-(2-ethyl-5-oxohexyl) phthalate': 'MEOHP',
  'mono (2-ethyl-5-oxohexyl) phthalate': 'MEOHP',
  'meohp': 'MEOHP',
  'mono-(2-ethyl-5-hydroxyhexyl) phthalate': 'MEHHP',
  'mono (2-ethyl-5-hydroxyhexyl) phthalate': 'MEHHP',
  'mehhp': 'MEHHP',
  'mono-n-butyl phthalate': 'MNBP',
  'mnbp': 'MNBP',
  'mono-isobutyl phthalate': 'MIBP',
  'mibp': 'MIBP',
  'mono-benzyl phthalate': 'MBZP',
  'mbzp': 'MBZP',
  'mcpp': 'MCPP',
  
  // Parabens
  'methylparaben': 'M_PARA',
  'ethylparaben': 'E_PARA',
  'propylparaben': 'P_PAR',
  'butylparaben': 'B_PAR',
  
  // Plastics
  'bisphenol a': 'BPA',
  'bpa': 'BPA',
  'triclosan': 'TCS',
  '4-nonylphenol': '4_NON',
  'diphenyl phosphate': 'DPP',
  
  // VOCs
  '2-hydroxyethyl mercapturic acid': '2HEMA',
  'hema': '2HEMA',
  '2-methylhippuric acid': '2MHA',
  '3-methylhippuric acid': '3MHA',
  '4-methylhippuric acid': '4MHA',
  'n-acetyl (propyl) cysteine': 'NAPR',
  'n-acetyl propyl cysteine': 'NAPR',
  'n-acetyl (2-cyanoethyl) cysteine': 'NACE',
  'n-acetyl 2-cyanoethyl cysteine': 'NACE',
  'n-acetyl (3,4-dihydroxybutyl) cysteine': 'NADB_CYS',
  'n-acetyl 3,4-dihydroxybutyl cysteine': 'NADB_CYS',
  'n-acetyl-s-(3,4-dihydroxybutyl) cysteine': 'NADB_CYS',
  'n-acetyl-s-(3,4-dihydroxybutyl)-cysteine': 'NADB_CYS',
  'nadb': 'NADB_CYS',
  'n-acetyl-s-(2-carbamoylethyl)-cysteine': 'NAC_2_CARB',
  'n-acetyl-s-(2-carbamoylethyl) cysteine': 'NAC_2_CARB',
  'n-acetyl (2-carbamoylethyl) cysteine': 'NAC_2_CARB',
  'n-acetyl 2-carbamoylethyl cysteine': 'NAC_2_CARB',
  '2-carbamoylethyl': 'NAC_2_CARB',
  'phenylglyoxylic acid': 'PGO',
  'phenyl glyoxylic acid': 'PGO',
  'mandelic acid': 'MA',
  '2-hydroxyisobutyric acid': '2HIB',
  'n-acetyl (2,hydroxypropyl) cysteine': 'NAHP',
  'n-acetyl 2-hydroxypropyl cysteine': 'NAHP',
  'n-acetyl phenyl cysteine': 'NAP',
  
  // Pesticides
  'glyphosate': 'GLYP',
  'perchlorate': 'PERC',
  '2,4-d': '2_4_D',
  '2,4-dichlorophenoxyacetic acid': '2_4_D',
  'dda': 'DDA',
  '2,2-bis(4-chlorophenyl) acetic acid': 'DDA',
  'diethyl phosphate': 'DEP',
  'dimethyl phosphate': 'DMP',
  'diethyldithiophosphate': 'DEDTP',
  'diethylthiophosphate': 'DETP',
  'dimethyldithiophosphate': 'DMDTP',
  'dimethylthiophosphate': 'DMTP',
  '3-phenoxybenzoic acid': '3PBA',
  'atrazine': 'ATRA',
  'atrazine mercapturate': 'ATRA_M',
  
  // Mitochondrial
  'tiglylglycine': 'TG'
};

function normalizeMarkerName(rawName) {
  if (!rawName) return 'UNKNOWN';
  
  // Clean up the name
  let cleaned = rawName.toLowerCase().trim();
  
  // Remove parenthetical abbreviations like "(DEDTP)" or "(2MHA)"
  cleaned = cleaned.replace(/\s*\([^)]+\)\s*/g, ' ').trim();
  
  // Direct match first
  if (MARKER_MAP[cleaned]) {
    return MARKER_MAP[cleaned];
  }
  
  // Try matching without special characters
  const simpler = cleaned.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (MARKER_MAP[simpler]) {
    return MARKER_MAP[simpler];
  }
  
  // Try partial matches - check if any key is contained in the name
  for (const [key, value] of Object.entries(MARKER_MAP)) {
    if (cleaned.includes(key)) {
      return value;
    }
  }
  
  // Try reverse - check if name is contained in any key
  for (const [key, value] of Object.entries(MARKER_MAP)) {
    if (key.includes(cleaned)) {
      return value;
    }
  }
  
  // Fallback: extract abbreviation if present in parentheses from original
  const abbrevMatch = rawName.match(/\(([A-Z0-9_-]+)\)/);
  if (abbrevMatch) {
    return abbrevMatch[1].replace(/-/g, '_');
  }
  
  // Last resort: create short code from first letters
  console.log('[Vibrant Parser] Unmapped marker:', rawName);
  return rawName.split(/\s+/).map(w => w[0]).join('').toUpperCase().substring(0, 6);
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

For each marker/test, extract:
- marker_name: The full name of the marker
- value: The numeric result (if "<LOD" or "ND" or "Not Detected", use 0)

Return ONLY valid JSON (no markdown, no backticks):
{
  "markers": [
    {"marker_name": "Arsenic", "value": 12.5},
    {"marker_name": "Lead", "value": 0.3},
    {"marker_name": "Ochratoxin A", "value": 4.2},
    {"marker_name": "Diethyldithiophosphate (DEDTP)", "value": 1.0}
  ]
}

IMPORTANT:
- Extract ALL markers from ALL pages
- Include both normal and elevated results
- Use the exact marker name as shown in the report
- Value must be a number only (no units)`;

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

    // Use user-provided reportId, not scraped
    const finalReportId = reportId || `RPT-${Date.now()}`;
    
    console.log('[Vibrant Parser] Report ID:', finalReportId);
    console.log('[Vibrant Parser] Extracted', parsed.markers?.length || 0, 'markers');

    // Format for Airtable - only the 5 fields you need
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
