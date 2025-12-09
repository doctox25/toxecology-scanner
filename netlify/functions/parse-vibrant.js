// parse-vibrant-tox-sonnet.js - Total Tox Panel Parser (100% extraction)
// Uses Sonnet model - requires 60+ second timeout
// Deploy to AWS Lambda, local, or platform with longer timeouts

const Anthropic = require("@anthropic-ai/sdk").default;

// ============================================================================
// COMPLETE MARKER MAPPINGS (108 Total Tox markers)
// ============================================================================

const MARKER_MAP = {
  // MYCOTOXINS (32 markers)
  'aflatoxin b1': 'AFB1', 'aflatoxin b2': 'AFB2', 'aflatoxin g1': 'AFG1', 'aflatoxin g2': 'AFG2', 'aflatoxin m1': 'AFM1',
  'ochratoxin a': 'OTA', 'gliotoxin': 'GLIO', 'mycophenolic acid': 'MPA', 'sterigmatocystin': 'STC', 'zearalenone': 'ZEN',
  'citrinin': 'CTN', 'dihydrocitrinone': 'DHC', 'chaetoglobosin a': 'CHA', 
  'enniatin b1': 'ENN_B1', 'enniatin b': 'ENN_B', 'enniatin a1': 'ENN_A1',
  'fumonisin b1': 'F_B1', 'fumonisins b1': 'F_B1', 'fumonisin b2': 'F_B2', 'fumonisins b2': 'F_B2', 
  'fumonisin b3': 'F_B3', 'fumonisins b3': 'F_B3',
  'patulin': 'PAT', 'deoxynivalenol': 'DON', 'nivalenol': 'NIV', 'diacetoxyscirpenol': 'DAS', 't-2 toxin': 'T2_TOX',
  'roridin a': 'ROR_A', 'roridin e': 'ROR_E', 'roridin l-2': 'ROR_L2', 'roridin l2': 'ROR_L2',
  'satratoxin g': 'SAT_G', 'satratoxin h': 'SAT_H',
  'verrucarin a': 'VER_A', 'verrucarin j': 'VER_J', 'verrucarol': 'VERRUCAROL',
  
  // HEAVY METALS (20 markers)
  'aluminum': 'ALU', 'antimony': 'ANT', 'arsenic': 'ARS', 'barium': 'BAR', 'beryllium': 'BER', 'bismuth': 'BIS',
  'cadmium': 'CAD', 'cesium': 'CES', 'gadolinium': 'GAD', 'lead': 'LEAD', 'mercury': 'MERC', 'nickel': 'NICK',
  'palladium': 'PALL', 'platinum': 'PLAT', 'tellurium': 'TELL', 'thallium': 'THAL', 'thorium': 'THOR',
  'tin': 'TIN', 'tungsten': 'TUNG', 'uranium': 'URAN',
  
  // PFAS (21 markers)
  'genx': 'GENX', 'genx/hpfo-da': 'GENX',
  '9-chlorohexadecafluoro-3-oxanonane-1-sulfonate': '9CL_PFAS',
  'dodecafluoro-3h-4,8-dioxanoate': 'NADONA', 'nadona': 'NADONA',
  'perfluoro-[1,2-13c2] octanoic acid': 'M2PFOA', 'm2pfoa': 'M2PFOA',
  'perfluoro-1-[1,2,3,4-13c4] octanesulfonic acid': 'C13_PFOS',
  'perfluoro-1-heptane sulfonic acid': 'PFHPS', 'pfhps': 'PFHPS',
  'perfluoro-n-[1,2-13c2] decanoic acid': 'MPFDA', 'mpfda': 'MPFDA',
  'perfluoro-n-[1,2-13c2] hexanoic acid': 'C13_PFHXA',
  'perfluorobutanoic acid': 'PFBA', 'pfba': 'PFBA',
  'perfluorodecanoic acid': 'PFDEA', 'pfdea': 'PFDEA', 'pfda': 'PFDEA',
  'perfluorododecanoic acid': 'PFDOA', 'pfdoa': 'PFDOA',
  'perfluoroheptanoic acid': 'PFHPA', 'pfhpa': 'PFHPA',
  'perfluorohexane sulfonic acid': 'PFHXS', 'pfhxs': 'PFHXS',
  'perfluorohexanoic acid': 'PFHXA', 'pfhxa': 'PFHXA',
  'perfluorononanoic acid': 'PFNA', 'pfna': 'PFNA',
  'perfluorooctane sulfonic acid': 'PFOS', 'pfos': 'PFOS',
  'perfluorooctanoic acid': 'PFOA', 'pfoa': 'PFOA',
  'perfluoropentanoic acid': 'PFPEA', 'pfpea': 'PFPEA',
  'perfluorotetradecanoic acid': 'PFTEDA', 'pfteda': 'PFTEDA',
  'perfluorotridecanoic acid': 'PFTRDA', 'pftrda': 'PFTRDA',
  'perfluoroundecanoic acid': 'PFUNA', 'pfuna': 'PFUNA',
  
  // ENVIRONMENTAL PHENOLS (3 markers)
  '4-nonylphenol': '4_NON', 'bisphenol a': 'BPA', 'bpa': 'BPA', 'triclosan': 'TCS', 'tcs': 'TCS',
  
  // HERBICIDES/PESTICIDES (12 markers)
  '2,4-dichlorophenoxyacetic acid': '2_4_D', '2,4-d': '2_4_D',
  'atrazine': 'ATRA', 'atrazine mercapturate': 'ATRA_M', 'glyphosate': 'GLYP',
  '2,2-bis(4-chlorophenyl) acetic acid': 'DDA', '2,2-bis(4-chlorophenyl)acetic acid': 'DDA', 
  '2,2-bis (4-chlorophenyl) acetic acid': 'DDA', 'dda': 'DDA', 'p,p-dda': 'DDA',
  '3-phenoxybenzoic acid': '3PBA', '3pba': '3PBA', '3-pba': '3PBA',
  'diethyl phosphate': 'DEP', 'dep': 'DEP',
  'diethyldithiophosphate': 'DEDTP', 'dedtp': 'DEDTP',
  'diethylthiophosphate': 'DETP', 'detp': 'DETP',
  'dimethyl phosphate': 'DMP', 'dmp': 'DMP',
  'dimethyldithiophosphate': 'DMDTP', 'dmdtp': 'DMDTP',
  'dimethylthiophosphate': 'DMTP', 'dmtp': 'DMTP',
  
  // PARABENS (4 markers)
  'butylparaben': 'B_PARA', 'ethylparaben': 'E_PARA', 'methylparaben': 'M_PARA', 'propylparaben': 'P_PARA',
  
  // PHTHALATES (4 markers)
  'mono-(2-ethyl-5-hydroxyhexyl) phthalate': 'MEHHP', 'mono-2-ethyl-5-hydroxyhexyl phthalate': 'MEHHP', 
  'mono-(2-ethyl-5-hydroxyhexyl)phthalate': 'MEHHP', 'mehhp': 'MEHHP',
  'mono-(2-ethyl-5-oxohexyl) phthalate': 'MEOHP', 'mono-2-ethyl-5-oxohexyl phthalate': 'MEOHP', 
  'mono-(2-ethyl-5-oxohexyl)phthalate': 'MEOHP', 'meohp': 'MEOHP',
  'mono-2-ethylhexyl phthalate': 'MEHP', 'mono-(2-ethylhexyl) phthalate': 'MEHP', 
  'mono-(2-ethylhexyl)phthalate': 'MEHP', 'mehp': 'MEHP',
  'mono-ethyl phthalate': 'METP', 'monoethyl phthalate': 'METP', 'mono-ethylphthalate': 'METP',
  'metp': 'METP', 'mep': 'METP',
  
  // VOCs (11 markers)
  '2-hydroxyethyl mercapturic acid': '2HEMA', '2hema': '2HEMA', 'hema': '2HEMA',
  '2-hydroxyisobutyric acid': '2HIB', '2hib': '2HIB',
  '2-methylhippuric acid': '2MHA', '2mha': '2MHA',
  '3-methylhippuric acid': '3MHA', '3mha': '3MHA',
  '4-methylhippuric acid': '4MHA', '4mha': '4MHA',
  'n-acetyl (2-cyanoethyl) cysteine': 'NACE', 'n-acetyl-s-(2-cyanoethyl)-cysteine': 'NACE', 'nace': 'NACE',
  'n-acetyl (2,hydroxypropyl) cysteine': 'NAHP', 'n-acetyl-s-(2-hydroxypropyl)-cysteine': 'NAHP', 'nahp': 'NAHP',
  'n-acetyl (3,4-dihydroxybutyl) cysteine': 'NADC', 'n-acetyl-s-(3,4-dihydroxybutyl)-cysteine': 'NADC', 'nadc': 'NADC',
  'n-acetyl (propyl) cysteine': 'NAPR', 'n-acetyl-s-propyl-cysteine': 'NAPR', 'napr': 'NAPR',
  'n-acetyl phenyl cysteine': 'NAP', 'n-acetyl-s-phenyl-cysteine': 'NAP', 'nap': 'NAP',
  'phenyl glyoxylic acid': 'PGO', 'pgo': 'PGO',
  
  // OTHER (3 markers)
  'diphenyl phosphate': 'DPP', 'dpp': 'DPP',
  'n-acetyl-s-(2-carbamoylethyl)-cysteine': 'NASC', 'nasc': 'NASC',
  'perchlorate': 'PERC', 'perc': 'PERC',
  'tiglylglycine': 'TG', 'tg': 'TG',
};

function normalizeMarkerName(rawName) {
  if (!rawName) return 'UNKNOWN';
  let cleaned = rawName.toLowerCase().trim();
  
  // Remove only unit suffixes in parentheses, not chemical structures
  cleaned = cleaned.replace(/\s*\((ug\/g|ng\/g|µmol\/l|pg\/ml|ng\/ml|ppb|ppm)\)\s*/gi, '').trim();
  cleaned = cleaned.replace(/\s*(ug\/g|ng\/g|µmol\/l|pg\/ml|ng\/ml)\s*$/gi, '').trim();
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  if (MARKER_MAP[cleaned]) return MARKER_MAP[cleaned];
  
  // Check partial matches
  for (const [key, value] of Object.entries(MARKER_MAP)) {
    if (cleaned.includes(key) && key.length > 4) {
      return value;
    }
  }
  
  // Fallback to uppercase abbreviation
  return cleaned.toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 20);
}

function tryParseJSON(text) {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('[Vibrant Parser] JSON parse error:', e.message);
  }
  return null;
}

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body);
    const pdfBase64 = body.pdf;
    const patientId = body.patient_id || '';

    if (!pdfBase64) {
      return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'No PDF data provided' }) };
    }

    console.log(`[Vibrant Parser] Processing Total Tox PDF for patient: ${patientId || '(no ID)'}`);

    const client = new Anthropic();
    
    // SINGLE PASS EXTRACTION WITH SONNET - COMPLETE AND THOROUGH
    const extractionPrompt = `Extract ALL lab results from this Vibrant Wellness Total Tox Burden PDF.

CRITICAL: You MUST extract EVERY SINGLE marker. There are approximately 108 markers in a Total Tox panel.

Categories to extract:
1. MYCOTOXINS (~32 markers): All Aflatoxins (B1, B2, G1, G2, M1), Ochratoxin A, Gliotoxin, Mycophenolic Acid, Sterigmatocystin, Zearalenone, Citrinin, Dihydrocitrinone, Chaetoglobosin A, Enniatins (B, B1, A1), Fumonisins (B1, B2, B3), Patulin, Deoxynivalenol, Nivalenol, Diacetoxyscirpenol, T-2 Toxin, Roridins (A, E, L-2), Satratoxins (G, H), Verrucarins (A, J), Verrucarol

2. HEAVY METALS (~20 markers): Aluminum, Antimony, Arsenic, Barium, Beryllium, Bismuth, Cadmium, Cesium, Gadolinium, Lead, Mercury, Nickel, Palladium, Platinum, Tellurium, Thallium, Thorium, Tin, Tungsten, Uranium

3. PFAS (~21 markers): All perfluoro compounds including GenX, PFOA, PFOS, PFBA, PFDA, PFDOA, PFHPA, PFHXA, PFHXS, PFNA, PFPEA, PFTEDA, PFTRDA, PFUNA, and internal standards

4. ENVIRONMENTAL PHENOLS (3 markers): 4-Nonylphenol, Bisphenol A (BPA), Triclosan

5. PESTICIDES/HERBICIDES (~12 markers): 2,4-D, Atrazine, Atrazine Mercapturate, Glyphosate, DDA, 3-PBA, all organophosphates (DEP, DEDTP, DETP, DMP, DMDTP, DMTP)

6. PHTHALATES (4 markers): MEHHP, MEOHP, MEHP, METP

7. PARABENS (4 markers): Methylparaben, Ethylparaben, Propylparaben, Butylparaben

8. VOCs (~11 markers): All hippuric acids (2-MHA, 3-MHA, 4-MHA), mercapturic acids, N-Acetyl compounds, Phenyl glyoxylic acid, 2-Hydroxyisobutyric acid, 2-Hydroxyethyl mercapturic acid

9. OTHER (3 markers): Perchlorate, Tiglylglycine, Diphenyl phosphate

INSTRUCTIONS:
- Extract the Report ID (accession number near the top)
- For each marker, extract the EXACT numeric value
- Use 0 for values shown as "<LOD", "Not Detected", or below detection limit
- Include ALL markers even if value is 0

Return JSON in this exact format:
{
  "report_id": "XXXXXXXXXX",
  "panel_type": "TOX",
  "markers": [
    {"marker_name": "Aflatoxin B1", "value": 0.71},
    {"marker_name": "Aflatoxin B2", "value": 7.74},
    ... continue for ALL markers
  ]
}

Return ONLY valid JSON, no markdown, no explanations.`;

    console.log('[Vibrant Parser] Starting Sonnet extraction...');
    
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      messages: [{
        role: 'user',
        content: [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } },
          { type: 'text', text: extractionPrompt }
        ]
      }]
    });

    console.log('[Vibrant Parser] Sonnet response received');

    const parsed = tryParseJSON(response.content[0].text);
    
    if (!parsed) {
      console.error('[Vibrant Parser] Parse failed');
      console.log('[Vibrant Parser] Raw response:', response.content[0].text.substring(0, 1000));
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Failed to parse Claude response' })
      };
    }

    const reportId = parsed.report_id || 'UNKNOWN';
    const markers = parsed.markers || [];

    console.log(`[Vibrant Parser] Report ID: ${reportId}, Extracted: ${markers.length} markers`);

    // Process markers
    const results = [];
    const seenMarkers = new Set();
    let idx = 1;

    for (const marker of markers) {
      const rawName = marker.marker_name || marker.name || '';
      if (!rawName) continue;
      
      const markerId = normalizeMarkerName(rawName);
      
      // Skip duplicates
      if (seenMarkers.has(markerId)) continue;
      seenMarkers.add(markerId);
      
      const value = typeof marker.value === 'number' ? marker.value : 
                    parseFloat(String(marker.value).replace(/[<>]/g, '')) || 0;

      results.push({
        result_id: `${reportId}-TOX-${String(idx).padStart(3, '0')}`,
        report_id: reportId,
        patient_id: patientId,
        marker_id_inbox: markerId,
        value: value,
        marker_type: 'biomarker'
      });
      idx++;
    }

    console.log(`[Vibrant Parser] Final results: ${results.length} biomarkers`);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        report_id: reportId,
        patient_id: patientId,
        panel_type: 'TOX',
        results: results,
        biomarker_count: results.length,
        snp_count: 0
      })
    };

  } catch (error) {
    console.error('[Vibrant Parser] Error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message })
    };
  }
};
