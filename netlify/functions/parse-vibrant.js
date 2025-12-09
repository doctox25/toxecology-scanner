// parse-vibrant.js - Vibrant Wellness PDF Parser v3.1
// Handles: Total Tox, Oxidative Stress (biomarkers + genetics), Methylation (biomarkers + genetics)
// Using Haiku for speed (Pro plan 26s timeout limit)

const Anthropic = require("@anthropic-ai/sdk").default;

// ============================================================================
// BIOMARKER MAPPINGS - Maps Vibrant PDF names to ToxEcology marker_ids
// ============================================================================

const MARKER_MAP = {
  // ==================== MYCOTOXINS ====================
  'aflatoxin b1': 'AFB1',
  'aflatoxin b2': 'AFB2',
  'aflatoxin g1': 'AFG1',
  'aflatoxin g2': 'AFG2',
  'aflatoxin m1': 'AFM1',
  'ochratoxin a': 'OTA',
  'gliotoxin': 'GLIO',
  'mycophenolic acid': 'MPA',
  'sterigmatocystin': 'STC',
  'zearalenone': 'ZEN',
  'citrinin': 'CTN',
  'dihydrocitrinone': 'DHC',
  'chaetoglobosin a': 'CHA',
  'enniatin b1': 'ENN_B1',
  'fumonisins b1': 'F_B1',
  'fumonisin b1': 'F_B1',
  'fumonisins b2': 'F_B2',
  'fumonisin b2': 'F_B2',
  'fumonisins b3': 'F_B3',
  'fumonisin b3': 'F_B3',
  'patulin': 'PAT',
  'deoxynivalenol': 'DON',
  'nivalenol': 'NIV',
  'diacetoxyscirpenol': 'DAS',
  't-2 toxin': 'T2_TOX',
  'roridin a': 'ROR_A',
  'roridin e': 'ROR_E',
  'roridin l2': 'ROR_L2',
  'satratoxin g': 'SAT_G',
  'satratoxin h': 'SAT_H',
  'verrucarin a': 'VER_A',
  'verrucarin j': 'VER_J',

  // ==================== HEAVY METALS ====================
  'aluminum': 'ALU',
  'antimony': 'ANT',
  'arsenic': 'ARS',
  'barium': 'BAR',
  'beryllium': 'BER',
  'bismuth': 'BIS',
  'cadmium': 'CAD',
  'cesium': 'CES',
  'gadolinium': 'GAD',
  'lead': 'LEAD',
  'mercury': 'MERC',
  'nickel': 'NICK',
  'palladium': 'PALL',
  'platinum': 'PLAT',
  'tellurium': 'TELL',
  'thallium': 'THAL',
  'thorium': 'THOR',
  'tin': 'TIN',
  'tungsten': 'TUNG',
  'uranium': 'URAN',

  // ==================== PFAS ====================
  'genx': 'GENX',
  'genx/hpfo-da': 'GENX',
  '9-chlorohexadecafluoro-3-oxanonane-1-sulfonate': '9CL_PFAS',
  'dodecafluoro-3h-4,8-dioxanoate': 'NADONA',
  'nadona': 'NADONA',
  'perfluoro-[1,2-13c2] octanoic acid': 'M2PFOA',
  'm2pfoa': 'M2PFOA',
  'perfluoro-1-[1,2,3,4-13c4] octanesulfonic acid': 'C13_PFOS',
  'perfluoro-1-heptane sulfonic acid': 'PFHPS',
  'pfhps': 'PFHPS',
  'perfluoro-n-[1,2-13c2] decanoic acid': 'MPFDA',
  'mpfda': 'MPFDA',
  'perfluoro-n-[1,2-13c2] hexanoic acid': 'C13_PFHXA',
  'perfluorobutanoic acid': 'PFBA',
  'pfba': 'PFBA',
  'perfluorodecanoic acid': 'PFDEA',
  'pfdea': 'PFDEA',
  'perfluorododecanoic acid': 'PFDOA',
  'pfdoa': 'PFDOA',
  'perfluoroheptanoic acid': 'PFHPA',
  'pfhpa': 'PFHPA',
  'perfluorohexane sulfonic acid': 'PFHXS',
  'pfhxs': 'PFHXS',
  'perfluorohexanoic acid': 'PFHXA',
  'pfhxa': 'PFHXA',
  'perfluorononanoic acid': 'PFNA',
  'pfna': 'PFNA',
  'perfluorooctane sulfonic acid': 'PFOS',
  'pfos': 'PFOS',
  'perfluorooctanoic acid': 'PFOA',
  'pfoa': 'PFOA',
  'perfluoropentanoic acid': 'PFPEA',
  'pfpea': 'PFPEA',
  'perfluorotetradecanoic acid': 'PFTEDA',
  'pfteda': 'PFTEDA',
  'perfluorotridecanoic acid': 'PFTRDA',
  'pftrda': 'PFTRDA',
  'perfluoroundecanoic acid': 'PFUNA',
  'pfuna': 'PFUNA',

  // ==================== ENVIRONMENTAL PHENOLS ====================
  '4-nonylphenol': '4_NON',
  'bisphenol a': 'BPA',
  'bpa': 'BPA',
  'triclosan': 'TCS',
  'tcs': 'TCS',

  // ==================== HERBICIDES/PESTICIDES ====================
  '2,4-dichlorophenoxyacetic acid': '2_4_D',
  '2,4-d': '2_4_D',
  'atrazine': 'ATRA',
  'atrazine mercapturate': 'ATRA_M',
  'glyphosate': 'GLYP',
  '2,2-bis(4-chlorophenyl) acetic acid': 'DDA',
  'dda': 'DDA',
  '3-phenoxybenzoic acid': '3PBA',
  '3pba': '3PBA',
  'diethyl phosphate': 'DEP',
  'dep': 'DEP',
  'diethyldithiophosphate': 'DEDTP',
  'dedtp': 'DEDTP',
  'diethylthiophosphate': 'DETP',
  'detp': 'DETP',
  'dimethyl phosphate': 'DMP',
  'dmp': 'DMP',
  'dimethyldithiophosphate': 'DMDTP',
  'dmdtp': 'DMDTP',
  'dimethylthiophosphate': 'DMTP',
  'dmtp': 'DMTP',

  // ==================== PARABENS ====================
  'butylparaben': 'B_PARA',
  'ethylparaben': 'E_PARA',
  'methylparaben': 'M_PARA',
  'propylparaben': 'P_PARA',

  // ==================== PHTHALATES ====================
  'mono-(2-ethyl-5-hydroxyhexyl) phthalate': 'MEHHP',
  'mehhp': 'MEHHP',
  'mono-(2-ethyl-5-oxohexyl) phthalate': 'MEOHP',
  'meohp': 'MEOHP',
  'mono-2-ethylhexyl phthalate': 'MEHP',
  'mehp': 'MEHP',
  'mono-ethyl phthalate': 'METP',
  'metp': 'METP',

  // ==================== VOCs ====================
  '2-hydroxyethyl mercapturic acid': '2HEMA',
  '2hema': '2HEMA',
  'hema': '2HEMA',
  '2-hydroxyisobutyric acid': '2HIB',
  '2hib': '2HIB',
  '2-methylhippuric acid': '2MHA',
  '2mha': '2MHA',
  '3-methylhippuric acid': '3MHA',
  '3mha': '3MHA',
  '4-methylhippuric acid': '4MHA',
  '4mha': '4MHA',
  'n-acetyl (2-cyanoethyl) cysteine': 'NACE',
  'nace': 'NACE',
  'n-acetyl (2,hydroxypropyl) cysteine': 'NAHP',
  'nahp': 'NAHP',
  'n-acetyl (3,4-dihydroxybutyl) cysteine': 'NADC',
  'nadc': 'NADC',
  'n-acetyl (propyl) cysteine': 'NAPR',
  'napr': 'NAPR',
  'n-acetyl phenyl cysteine': 'NAP',
  'nap': 'NAP',
  'phenyl glyoxylic acid': 'PGO',
  'pgo': 'PGO',

  // ==================== OTHER MARKERS ====================
  'diphenyl phosphate': 'DPP',
  'dpp': 'DPP',
  'n-acetyl-s-(2-carbamoylethyl)-cysteine': 'NASC',
  'nasc': 'NASC',
  'perchlorate': 'PERC',
  'perc': 'PERC',
  'tiglylglycine': 'TG',
  'tg': 'TG',

  // ==================== OXIDATIVE STRESS BIOMARKERS ====================
  // Lipid Peroxidation
  '8-iso-prostaglandin f2α': 'ISO_PGF2A',
  '8-iso-prostaglandin f2a': 'ISO_PGF2A',
  '8-isopgf2α': 'ISO_PGF2A',
  '8-isopgf2a': 'ISO_PGF2A',
  'iso-prostaglandin': 'ISO_PGF2A',
  '11-β-prostaglandin f2α': 'PGF2A_11B',
  '11-β-prostaglandin f2a': 'PGF2A_11B',
  '11-beta-prostaglandin f2α': 'PGF2A_11B',
  '11β-prostaglandin f2α': 'PGF2A_11B',
  '11-beta-prostaglandin': 'PGF2A_11B',
  '15(r)-prostaglandin f2α': 'PGF2A_15R',
  '15(r)-prostaglandin f2a': 'PGF2A_15R',
  '15r-prostaglandin f2α': 'PGF2A_15R',
  '15-r-prostaglandin': 'PGF2A_15R',
  'glutathione 4-hydroxynonenal': 'GS_HNE',
  'gs-hne': 'GS_HNE',
  'glutathione-hne': 'GS_HNE',
  'malondialdehyde': 'MDA',
  'mda': 'MDA',
  
  // DNA Damage
  '8-hydroxy-2-deoxyguanosine': '8OHDG',
  '8ohdg': '8OHDG',
  '8-hydroxy-2\'-deoxyguanosine': '8OHDG',
  '8-hydroxyguanine': '8OHG',
  '8ohg': '8OHG',
  '8-hydroxyguanosine': '8OHGS',
  '8ohgs': '8OHGS',
  
  // RNA Damage
  '8-nitroguanine': '8NITROG',
  '8nitrog': '8NITROG',
  '8-nitroguanosine': '8NITROGS',
  '8nitrogs': '8NITROGS',
  
  // Protein Oxidation
  '3-bromotyrosine': '3BTYR',
  '3btyr': '3BTYR',
  'bromotyrosine': '3BTYR',
  '3-chlorotyrosine': '3CLTYR',
  '3cltyr': '3CLTYR',
  'chlorotyrosine': '3CLTYR',
  'dityrosine': 'DITYR',
  'dityr': 'DITYR',
  'nitrotyrosine': 'NITYR',
  'nityr': 'NITYR',
  
  // Advanced Glycation Products
  'nε-(carboxymethyl)lysine': 'CML',
  'n-epsilon-(carboxymethyl)lysine': 'CML',
  'carboxymethyllysine': 'CML',
  'carboxymethyl lysine': 'CML',
  'cml': 'CML',
  'nε-carboxyethyllysine': 'CEL',
  'n-epsilon-carboxyethyllysine': 'CEL',
  'carboxyethyllysine': 'CEL',
  'carboxyethyl lysine': 'CEL',
  'cel': 'CEL',

  // ==================== METHYLATION SERUM MARKERS ====================
  'homocysteine': 'HOMOCYSTEINE',
  'hcy': 'HOMOCYSTEINE',
  'vitamin b12 serum': 'VIT_B12',
  'vitamin b12': 'VIT_B12',
  'b12': 'VIT_B12',
  'b12 serum': 'VIT_B12',
  'folate serum': 'FOLATE',
  'folate': 'FOLATE',
  'folic acid': 'FOLATE',
};

// ============================================================================
// SNP/GENETICS MAPPINGS - Maps rsIDs to gene names for validation
// ============================================================================

const SNP_GENE_MAP = {
  // Oxidative Stress SNPs
  'rs2234694': 'SOD1',
  'rs4880': 'SOD2',
  'rs1799895': 'SOD3',
  'rs8192287': 'SOD3',
  'rs1001179': 'CAT',
  'rs4756146': 'CAT',
  'rs7943316': 'CAT',
  'rs10911021': 'GLUL',
  'rs121909307': 'GSS',
  'rs1050450': 'GPX1',
  'rs1987628': 'GPX1',
  'rs2071566': 'GPX2',
  'rs4902346': 'GPX2',
  'rs713041': 'GPX4',
  'rs366631': 'GSTM1',
  'rs3754446': 'GSTM5',
  'rs1695': 'GSTP1',
  'rs2071746': 'HMOX1',
  'rs4485648': 'TrxR2',
  'rs7310505': 'TXNRD1',
  'rs1548357': 'TXNRD2',
  'rs4673': 'CYBA',
  'rs9932581': 'CYBA',
  'rs10789038': 'PRKAA2',
  'rs2796498': 'PRKAA2',
  'rs206812': 'XDH',
  'rs2073316': 'XDH',
  'rs1048943': 'CYP1A1',
  'rs916321': 'CYB5R3',
  'rs20417': 'COX-2',
  'rs3877899': 'SELENOP',
  'rs8190955': 'GSR',
  
  // Methylation SNPs
  'rs1801133': 'MTHFR',
  'rs1801131': 'MTHFR',
  'rs1801394': 'MTRR',
  'rs162036': 'MTRR',
  'rs1805087': 'MTR',
  'rs3851059': 'MAT1A',
  'rs1979277': 'SHMT1',
  'rs10948059': 'GNMT',
  'rs3733890': 'BHMT',
  'rs4680': 'COMT',
  'rs4633': 'COMT',
  'rs1799983': 'NOS3',
};

// ============================================================================
// PANEL DETECTION
// ============================================================================

function detectPanelType(markers) {
  const markerNames = markers.map(m => m.marker_name?.toLowerCase() || '').join(' ');
  
  const hasTox = markerNames.includes('aflatoxin') || markerNames.includes('ochratoxin') || 
                 markerNames.includes('mycotoxin') || markerNames.includes('pfos') ||
                 markerNames.includes('mercury') || markerNames.includes('arsenic');
  
  const hasOxStress = markerNames.includes('prostaglandin') || markerNames.includes('malondialdehyde') ||
                      markerNames.includes('hydroxyguanine') || markerNames.includes('nitroguanine') ||
                      markerNames.includes('bromotyrosine') || markerNames.includes('dityrosine');
  
  const hasMethylation = markerNames.includes('homocysteine') || markerNames.includes('folate') ||
                         markerNames.includes('mthfr') || markerNames.includes('comt');
  
  if (hasTox) return 'TOX';
  if (hasOxStress) return 'OX';
  if (hasMethylation) return 'METH';
  return 'VIB';
}

// ============================================================================
// MARKER NORMALIZATION
// ============================================================================

function normalizeMarkerName(rawName) {
  if (!rawName) return 'UNKNOWN';
  
  let cleaned = rawName.toLowerCase().trim();
  
  // Remove units and parenthetical content for matching
  cleaned = cleaned.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  cleaned = cleaned.replace(/\s*(ug\/g|ng\/g|µmol\/l|pg\/ml|ng\/ml)\s*/gi, '').trim();
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  // Direct lookup
  if (MARKER_MAP[cleaned]) {
    return MARKER_MAP[cleaned];
  }
  
  // Try without special characters
  const alphaOnly = cleaned.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (MARKER_MAP[alphaOnly]) {
    return MARKER_MAP[alphaOnly];
  }
  
  // Partial match - check if any key is contained in the name
  for (const [key, value] of Object.entries(MARKER_MAP)) {
    if (cleaned.includes(key) && key.length > 4) {
      return value;
    }
  }
  
  // Special handling for prostaglandins (commonly truncated)
  if (cleaned.includes('11') && (cleaned.includes('prostaglandin') || cleaned.includes('pgf'))) return 'PGF2A_11B';
  if (cleaned.includes('15') && (cleaned.includes('prostaglandin') || cleaned.includes('pgf'))) return 'PGF2A_15R';
  if (cleaned.includes('iso') && (cleaned.includes('prostaglandin') || cleaned.includes('pgf'))) return 'ISO_PGF2A';
  if (cleaned.includes('8-iso')) return 'ISO_PGF2A';
  
  // Special handling for oxidative markers
  if (cleaned.includes('carboxymethyl') && cleaned.includes('lysine')) return 'CML';
  if (cleaned.includes('carboxyethyl') && cleaned.includes('lysine')) return 'CEL';
  if (cleaned.includes('hydroxyguanosine')) return '8OHGS';
  if (cleaned.includes('nitroguanosine')) return '8NITROGS';
  if (cleaned.includes('deoxyguanosine')) return '8OHDG';
  
  console.log('[Vibrant Parser] Unmapped marker:', rawName);
  
  // Generate a reasonable abbreviation as fallback
  const words = rawName.replace(/[^a-zA-Z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 0);
  return words.map(w => w[0]).join('').toUpperCase().substring(0, 8) || 'UNK';
}

// ============================================================================
// JSON REPAIR UTILITIES
// ============================================================================

function repairJSON(jsonString) {
  let cleaned = jsonString.trim();
  
  // Remove markdown code blocks
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
  
  // Try to extract JSON object/array
  const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    cleaned = jsonMatch[1];
  }
  
  // Fix common issues
  cleaned = cleaned
    .replace(/,\s*}/g, '}')  // trailing commas in objects
    .replace(/,\s*]/g, ']')  // trailing commas in arrays
    .replace(/'/g, '"')       // single quotes to double
    .replace(/(\w+)(?=\s*:)/g, '"$1"') // unquoted keys
    .replace(/:\s*'([^']*)'/g, ': "$1"'); // single-quoted values
  
  return cleaned;
}

function tryParseJSON(text) {
  // Strategy 1: Direct parse
  try {
    return JSON.parse(text);
  } catch (e) {}
  
  // Strategy 2: Repair and parse
  try {
    return JSON.parse(repairJSON(text));
  } catch (e) {}
  
  // Strategy 3: Extract JSON from text
  const patterns = [
    /\{[\s\S]*"report_id"[\s\S]*\}/,
    /\{[\s\S]*"markers"[\s\S]*\}/,
    /\[[\s\S]*\{[\s\S]*"marker_name"[\s\S]*\}[\s\S]*\]/
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        return JSON.parse(repairJSON(match[0]));
      } catch (e) {}
    }
  }
  
  return null;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

exports.handler = async function (event) {
  console.log('[Vibrant Parser] Function started');
  
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body);
    const pdfBase64 = body.pdf;
    const patientId = body.patient_id || '';

    if (!pdfBase64) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'No PDF data provided' }),
      };
    }

    console.log(`[Vibrant Parser] Processing PDF for patient: ${patientId || '(no ID)'}`);

    const client = new Anthropic();

    // ========================================================================
    // EXTRACTION PROMPT - Handles biomarkers AND genetics
    // ========================================================================
    
    const prompt = `Extract ALL lab results from this Vibrant Wellness PDF. Return ONLY valid JSON.

The PDF contains:
1. BIOMARKERS - numeric test results (e.g., "Arsenic: 4.61")  
2. GENETICS/SNPs - genetic variants (e.g., "rs1801133 MTHFR C/C Normal")

Return this EXACT JSON structure:

{
  "report_id": "10-digit accession ID from header",
  "panel_type": "TOX" or "OX" or "METH",
  "markers": [
    {"marker_name": "exact name", "value": number, "units": "units", "reference": "range"}
  ],
  "genetics": [
    {"rsid": "rs1801133", "gene": "MTHFR", "mutation": "C/C", "risk": "Normal"}
  ]
}

RULES:
- Use 0 for "<LOD" or undetectable values
- Extract ALL SNPs from genetics tables (rsID starts with "rs")
- Return ONLY the JSON, no other text`;

    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',  // Using Haiku for speed (Pro plan 26s limit)
      max_tokens: 16000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: pdfBase64,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    const responseText = response.content[0].text;
    console.log('[Vibrant Parser] Response length:', responseText.length);

    // Parse the response
    const parsed = tryParseJSON(responseText);
    
    if (!parsed) {
      console.error('[Vibrant Parser] Failed to parse response');
      console.log('[Vibrant Parser] Raw response:', responseText.substring(0, 500));
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: 'Failed to parse Claude response',
          raw: responseText.substring(0, 1000)
        }),
      };
    }

    const reportId = parsed.report_id || 'UNKNOWN';
    const markers = parsed.markers || [];
    const genetics = parsed.genetics || [];
    const panelType = parsed.panel_type || detectPanelType(markers);

    console.log(`[Vibrant Parser] Report ID: ${reportId}`);
    console.log(`[Vibrant Parser] Panel type: ${panelType}`);
    console.log(`[Vibrant Parser] Extracted ${markers.length} biomarkers`);
    console.log(`[Vibrant Parser] Extracted ${genetics.length} SNPs`);

    // ========================================================================
    // PROCESS BIOMARKERS
    // ========================================================================
    
    const results = [];
    let idx = 1;

    for (const marker of markers) {
      const markerId = normalizeMarkerName(marker.marker_name);
      const value = typeof marker.value === 'number' ? marker.value : 
                    parseFloat(String(marker.value).replace(/[<>]/g, '')) || 0;

      results.push({
        result_id: `${reportId}-${panelType}-${String(idx).padStart(3, '0')}`,
        report_id: reportId,
        patient_id: patientId,
        marker_id_inbox: markerId,
        value: value,
        marker_type: 'biomarker'
      });
      idx++;
    }

    // ========================================================================
    // PROCESS GENETICS/SNPs
    // ========================================================================
    
    let snpIdx = 1;
    for (const snp of genetics) {
      const rsid = snp.rsid || snp.test_name || '';
      const gene = snp.gene || snp.gene_name || SNP_GENE_MAP[rsid] || '';
      const mutation = snp.mutation || snp.your_mutation || '';
      const risk = snp.risk || snp.your_risk || '';
      
      if (rsid && rsid.startsWith('rs')) {
        results.push({
          result_id: `${reportId}-${panelType}-SNP-${String(snpIdx).padStart(3, '0')}`,
          report_id: reportId,
          patient_id: patientId,
          marker_id_inbox: rsid,
          value: mutation,
          gene_name: gene,
          risk_level: risk,
          marker_type: 'snp'
        });
        snpIdx++;
      }
    }

    console.log(`[Vibrant Parser] Total results: ${results.length}`);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        report_id: reportId,
        panel_type: panelType,
        biomarker_count: markers.length,
        snp_count: genetics.length,
        total_count: results.length,
        results: results,
      }),
    };

  } catch (error) {
    console.error('[Vibrant Parser] Error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: 'Parser failed',
        message: error.message,
      }),
    };
  }
};
