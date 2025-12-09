// parse-vibrant.js - Vibrant Wellness PDF Parser v3.2
// Two-pass extraction for Total Tox to handle all 100+ markers within timeout limits

const Anthropic = require("@anthropic-ai/sdk").default;

// ============================================================================
// BIOMARKER MAPPINGS
// ============================================================================

const MARKER_MAP = {
  // MYCOTOXINS
  'aflatoxin b1': 'AFB1', 'aflatoxin b2': 'AFB2', 'aflatoxin g1': 'AFG1', 'aflatoxin g2': 'AFG2', 'aflatoxin m1': 'AFM1',
  'ochratoxin a': 'OTA', 'gliotoxin': 'GLIO', 'mycophenolic acid': 'MPA', 'sterigmatocystin': 'STC', 'zearalenone': 'ZEN',
  'citrinin': 'CTN', 'dihydrocitrinone': 'DHC', 'chaetoglobosin a': 'CHA', 'enniatin b1': 'ENN_B1',
  'enniatin b': 'ENN_B', 'enniatin a1': 'ENN_A1',
  'fumonisins b1': 'F_B1', 'fumonisin b1': 'F_B1', 'fumonisins b2': 'F_B2', 'fumonisin b2': 'F_B2', 
  'fumonisins b3': 'F_B3', 'fumonisin b3': 'F_B3',
  'patulin': 'PAT', 'deoxynivalenol': 'DON', 'nivalenol': 'NIV', 'diacetoxyscirpenol': 'DAS', 't-2 toxin': 'T2_TOX',
  'roridin a': 'ROR_A', 'roridin e': 'ROR_E', 'roridin l-2': 'ROR_L2', 'roridin l2': 'ROR_L2',
  'satratoxin g': 'SAT_G', 'satratoxin h': 'SAT_H',
  'verrucarin a': 'VER_A', 'verrucarin j': 'VER_J',
  'verrucarol': 'VERRUCAROL',
  
  // HEAVY METALS
  'aluminum': 'ALU', 'antimony': 'ANT', 'arsenic': 'ARS', 'barium': 'BAR', 'beryllium': 'BER', 'bismuth': 'BIS',
  'cadmium': 'CAD', 'cesium': 'CES', 'gadolinium': 'GAD', 'lead': 'LEAD', 'mercury': 'MERC', 'nickel': 'NICK',
  'palladium': 'PALL', 'platinum': 'PLAT', 'tellurium': 'TELL', 'thallium': 'THAL', 'thorium': 'THOR',
  'tin': 'TIN', 'tungsten': 'TUNG', 'uranium': 'URAN',
  
  // PFAS
  'genx': 'GENX', 'genx/hpfo-da': 'GENX',
  '9-chlorohexadecafluoro-3-oxanonane-1-sulfonate': '9CL_PFAS',
  'dodecafluoro-3h-4,8-dioxanoate': 'NADONA', 'nadona': 'NADONA',
  'perfluoro-[1,2-13c2] octanoic acid': 'M2PFOA', 'm2pfoa': 'M2PFOA',
  'perfluoro-1-[1,2,3,4-13c4] octanesulfonic acid': 'C13_PFOS',
  'perfluoro-1-heptane sulfonic acid': 'PFHPS', 'pfhps': 'PFHPS',
  'perfluoro-n-[1,2-13c2] decanoic acid': 'MPFDA', 'mpfda': 'MPFDA',
  'perfluoro-n-[1,2-13c2] hexanoic acid': 'C13_PFHXA',
  'perfluorobutanoic acid': 'PFBA', 'pfba': 'PFBA',
  'perfluorodecanoic acid': 'PFDEA', 'pfdea': 'PFDEA',
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
  
  // ENVIRONMENTAL PHENOLS
  '4-nonylphenol': '4_NON', 'bisphenol a': 'BPA', 'bpa': 'BPA', 'triclosan': 'TCS', 'tcs': 'TCS',
  
  // HERBICIDES/PESTICIDES
  '2,4-dichlorophenoxyacetic acid': '2_4_D', '2,4-d': '2_4_D',
  'atrazine': 'ATRA', 'atrazine mercapturate': 'ATRA_M', 'glyphosate': 'GLYP',
  '2,2-bis(4-chlorophenyl) acetic acid': 'DDA', 'dda': 'DDA',
  '3-phenoxybenzoic acid': '3PBA', '3pba': '3PBA',
  'diethyl phosphate': 'DEP', 'dep': 'DEP',
  'diethyldithiophosphate': 'DEDTP', 'dedtp': 'DEDTP',
  'diethylthiophosphate': 'DETP', 'detp': 'DETP',
  'dimethyl phosphate': 'DMP', 'dmp': 'DMP',
  'dimethyldithiophosphate': 'DMDTP', 'dmdtp': 'DMDTP',
  'dimethylthiophosphate': 'DMTP', 'dmtp': 'DMTP',
  
  // PARABENS
  'butylparaben': 'B_PARA', 'ethylparaben': 'E_PARA', 'methylparaben': 'M_PARA', 'propylparaben': 'P_PARA',
  
  // PHTHALATES
  'mono-(2-ethyl-5-hydroxyhexyl) phthalate': 'MEHHP', 'mehhp': 'MEHHP',
  'mono-(2-ethyl-5-oxohexyl) phthalate': 'MEOHP', 'meohp': 'MEOHP',
  'mono-2-ethylhexyl phthalate': 'MEHP', 'mehp': 'MEHP',
  'mono-ethyl phthalate': 'METP', 'metp': 'METP',
  
  // VOCs
  '2-hydroxyethyl mercapturic acid': '2HEMA', '2hema': '2HEMA', 'hema': '2HEMA',
  '2-hydroxyisobutyric acid': '2HIB', '2hib': '2HIB',
  '2-methylhippuric acid': '2MHA', '2mha': '2MHA',
  '3-methylhippuric acid': '3MHA', '3mha': '3MHA',
  '4-methylhippuric acid': '4MHA', '4mha': '4MHA',
  'n-acetyl (2-cyanoethyl) cysteine': 'NACE', 'nace': 'NACE',
  'n-acetyl (2,hydroxypropyl) cysteine': 'NAHP', 'nahp': 'NAHP',
  'n-acetyl (3,4-dihydroxybutyl) cysteine': 'NADC', 'nadc': 'NADC',
  'n-acetyl (propyl) cysteine': 'NAPR', 'napr': 'NAPR',
  'n-acetyl phenyl cysteine': 'NAP', 'nap': 'NAP',
  'phenyl glyoxylic acid': 'PGO', 'pgo': 'PGO',
  
  // OTHER
  'diphenyl phosphate': 'DPP', 'dpp': 'DPP',
  'n-acetyl-s-(2-carbamoylethyl)-cysteine': 'NASC', 'nasc': 'NASC',
  'perchlorate': 'PERC', 'perc': 'PERC',
  'tiglylglycine': 'TG', 'tg': 'TG',
  
  // OXIDATIVE STRESS BIOMARKERS
  '8-iso-prostaglandin f2α': 'ISO_PGF2A', '8-iso-prostaglandin f2a': 'ISO_PGF2A',
  'iso-prostaglandin': 'ISO_PGF2A', '8-iso': 'ISO_PGF2A',
  '11-β-prostaglandin f2α': 'PGF2A_11B', '11-β-prostaglandin f2a': 'PGF2A_11B',
  '11-beta-prostaglandin': 'PGF2A_11B',
  '15(r)-prostaglandin f2α': 'PGF2A_15R', '15(r)-prostaglandin f2a': 'PGF2A_15R',
  '15-r-prostaglandin': 'PGF2A_15R',
  'glutathione 4-hydroxynonenal': 'GS_HNE', 'gs-hne': 'GS_HNE',
  'malondialdehyde': 'MDA', 'mda': 'MDA',
  '8-hydroxy-2-deoxyguanosine': '8OHDG', '8ohdg': '8OHDG',
  '8-hydroxyguanine': '8OHG', '8ohg': '8OHG',
  '8-hydroxyguanosine': '8OHGS', '8ohgs': '8OHGS',
  '8-nitroguanine': '8NITROG', '8nitrog': '8NITROG',
  '8-nitroguanosine': '8NITROGS', '8nitrogs': '8NITROGS',
  '3-bromotyrosine': '3BTYR', '3btyr': '3BTYR', 'bromotyrosine': '3BTYR',
  '3-chlorotyrosine': '3CLTYR', '3cltyr': '3CLTYR', 'chlorotyrosine': '3CLTYR',
  'dityrosine': 'DITYR', 'dityr': 'DITYR',
  'nitrotyrosine': 'NITYR', 'nityr': 'NITYR',
  'nε-(carboxymethyl)lysine': 'CML', 'carboxymethyllysine': 'CML', 'cml': 'CML',
  'nε-carboxyethyllysine': 'CEL', 'carboxyethyllysine': 'CEL', 'cel': 'CEL',
  
  // METHYLATION
  'homocysteine': 'HOMOCYSTEINE', 'hcy': 'HOMOCYSTEINE',
  'vitamin b12 serum': 'VIT_B12', 'vitamin b12': 'VIT_B12', 'b12': 'VIT_B12',
  'folate serum': 'FOLATE', 'folate': 'FOLATE',
};

// SNP mappings
const SNP_GENE_MAP = {
  'rs2234694': 'SOD1', 'rs4880': 'SOD2', 'rs1799895': 'SOD3', 'rs8192287': 'SOD3',
  'rs1001179': 'CAT', 'rs4756146': 'CAT', 'rs7943316': 'CAT',
  'rs10911021': 'GLUL', 'rs121909307': 'GSS',
  'rs1050450': 'GPX1', 'rs1987628': 'GPX1', 'rs2071566': 'GPX2', 'rs4902346': 'GPX2', 'rs713041': 'GPX4',
  'rs366631': 'GSTM1', 'rs3754446': 'GSTM5', 'rs1695': 'GSTP1',
  'rs2071746': 'HMOX1', 'rs4485648': 'TrxR2', 'rs7310505': 'TXNRD1', 'rs1548357': 'TXNRD2',
  'rs4673': 'CYBA', 'rs9932581': 'CYBA', 'rs10789038': 'PRKAA2', 'rs2796498': 'PRKAA2',
  'rs206812': 'XDH', 'rs2073316': 'XDH', 'rs1048943': 'CYP1A1', 'rs916321': 'CYB5R3',
  'rs20417': 'COX-2', 'rs3877899': 'SELENOP', 'rs8190955': 'GSR',
  'rs1801133': 'MTHFR', 'rs1801131': 'MTHFR', 'rs1801394': 'MTRR', 'rs162036': 'MTRR',
  'rs1805087': 'MTR', 'rs3851059': 'MAT1A', 'rs1979277': 'SHMT1', 'rs10948059': 'GNMT',
  'rs3733890': 'BHMT', 'rs4680': 'COMT', 'rs4633': 'COMT', 'rs1799983': 'NOS3',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function normalizeMarkerName(rawName) {
  if (!rawName) return 'UNKNOWN';
  let cleaned = rawName.toLowerCase().trim();
  cleaned = cleaned.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  cleaned = cleaned.replace(/\s*(ug\/g|ng\/g|µmol\/l|pg\/ml|ng\/ml)\s*/gi, '').trim();
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  if (MARKER_MAP[cleaned]) return MARKER_MAP[cleaned];
  
  const alphaOnly = cleaned.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (MARKER_MAP[alphaOnly]) return MARKER_MAP[alphaOnly];
  
  for (const [key, value] of Object.entries(MARKER_MAP)) {
    if (cleaned.includes(key) && key.length > 4) return value;
  }
  
  // Special handling
  if (cleaned.includes('11') && (cleaned.includes('prostaglandin') || cleaned.includes('pgf'))) return 'PGF2A_11B';
  if (cleaned.includes('15') && (cleaned.includes('prostaglandin') || cleaned.includes('pgf'))) return 'PGF2A_15R';
  if (cleaned.includes('iso') && (cleaned.includes('prostaglandin') || cleaned.includes('pgf'))) return 'ISO_PGF2A';
  if (cleaned.includes('carboxymethyl') && cleaned.includes('lysine')) return 'CML';
  if (cleaned.includes('carboxyethyl') && cleaned.includes('lysine')) return 'CEL';
  
  console.log('[Vibrant Parser] Unmapped marker:', rawName);
  const words = rawName.replace(/[^a-zA-Z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 0);
  return words.map(w => w[0]).join('').toUpperCase().substring(0, 8) || 'UNK';
}

function tryParseJSON(text) {
  try { return JSON.parse(text); } catch (e) {}
  try {
    let cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    const match = cleaned.match(/(\{[\s\S]*\})/);
    if (match) {
      let json = match[1].replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
      return JSON.parse(json);
    }
  } catch (e) {}
  return null;
}

function detectPanelType(text) {
  const lower = text.toLowerCase();
  if (lower.includes('mycotoxin') || lower.includes('aflatoxin') || lower.includes('heavy metal') || 
      lower.includes('pfas') || lower.includes('total tox')) return 'TOX';
  if (lower.includes('oxidative') || lower.includes('prostaglandin') || lower.includes('lipid peroxidation')) return 'OX';
  if (lower.includes('methylation') || lower.includes('homocysteine') || lower.includes('mthfr')) return 'METH';
  return 'VIB';
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

exports.handler = async function (event) {
  console.log('[Vibrant Parser] Function started');
  
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

    console.log(`[Vibrant Parser] Processing PDF for patient: ${patientId || '(no ID)'}`);

    const client = new Anthropic();
    
    // ========================================================================
    // FIRST PASS - Detect panel type and extract first batch
    // ========================================================================
    
    const firstPassPrompt = `Analyze this Vibrant Wellness PDF and extract lab results.

First, identify the panel type:
- "TOX" = Total Tox Burden (has mycotoxins, heavy metals, PFAS, environmental toxins)
- "OX" = Oxidative Stress (has prostaglandins, DNA damage markers, protein oxidation)
- "METH" = Methylation (has homocysteine, B12, folate, MTHFR genetics)

Then extract ALL biomarkers and genetics.

For TOX panels, extract these categories in this pass:
- ALL Mycotoxins (Aflatoxins B1/B2/G1/G2/M1, Ochratoxin A, Gliotoxin, Citrinin, Fumonisins, Trichothecenes like T-2, Roridins, Satratoxins, Verrucarins, etc.)
- ALL Heavy Metals (Aluminum, Antimony, Arsenic, Barium, Beryllium, Bismuth, Cadmium, Cesium, Gadolinium, Lead, Mercury, Nickel, Palladium, Platinum, Tellurium, Thallium, Thorium, Tin, Tungsten, Uranium)
- ALL PFAS compounds

Return JSON:
{
  "report_id": "accession ID",
  "panel_type": "TOX" or "OX" or "METH",
  "markers": [{"marker_name": "exact name", "value": number, "units": "units", "reference": "range"}],
  "genetics": [{"rsid": "rs...", "gene": "GENE", "mutation": "X/X", "risk": "Normal/Elevated"}]
}

Use 0 for "<LOD" values. Return ONLY valid JSON.`;

    console.log('[Vibrant Parser] Starting first pass extraction...');
    
    const firstResponse = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 8192,
      messages: [{
        role: 'user',
        content: [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } },
          { type: 'text', text: firstPassPrompt }
        ]
      }]
    });

    const firstParsed = tryParseJSON(firstResponse.content[0].text);
    
    if (!firstParsed) {
      console.error('[Vibrant Parser] First pass parse failed');
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Failed to parse first pass response' })
      };
    }

    const reportId = firstParsed.report_id || 'UNKNOWN';
    const panelType = firstParsed.panel_type || 'VIB';
    let allMarkers = firstParsed.markers || [];
    let allGenetics = firstParsed.genetics || [];

    console.log(`[Vibrant Parser] First pass - Report ID: ${reportId}, Panel: ${panelType}`);
    console.log(`[Vibrant Parser] First pass - Got ${allMarkers.length} markers, ${allGenetics.length} SNPs`);

    // ========================================================================
    // SECOND PASS - Only for TOX panels, get remaining categories
    // ========================================================================
    
    if (panelType === 'TOX' && allMarkers.length < 80) {
      console.log('[Vibrant Parser] TOX panel detected with incomplete data, running second pass...');
      
      const secondPassPrompt = `This is the SAME Vibrant Wellness Total Tox PDF. I need you to extract the REMAINING markers that were not in the first batch.

Extract ONLY these categories (skip mycotoxins, heavy metals, and PFAS - already extracted):
- Environmental Phenols (4-Nonylphenol, BPA, Triclosan)
- Herbicides & Pesticides (2,4-D, Atrazine, Glyphosate, DDA, 3-PBA, all phosphates DEP/DETP/DMP/DMTP etc.)
- Phthalates (MEHHP, MEOHP, MEHP, METP)
- Parabens (Methyl, Ethyl, Propyl, Butyl)
- VOCs (2-HEMA, 2-HIB, 2-MHA, 3-MHA, 4-MHA, NACE, NAHP, NADC, NAPR, NAP, PGO)
- Other (Perchlorate, Tiglylglycine, DPP, NASC)

Return JSON with same structure:
{
  "markers": [{"marker_name": "exact name", "value": number, "units": "units", "reference": "range"}]
}

Use 0 for "<LOD" values. Return ONLY the JSON for these additional markers.`;

      const secondResponse = await client.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 8192,
        messages: [{
          role: 'user',
          content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } },
            { type: 'text', text: secondPassPrompt }
          ]
        }]
      });

      const secondParsed = tryParseJSON(secondResponse.content[0].text);
      
      if (secondParsed && secondParsed.markers) {
        console.log(`[Vibrant Parser] Second pass - Got ${secondParsed.markers.length} additional markers`);
        allMarkers = [...allMarkers, ...secondParsed.markers];
      }
    }

    console.log(`[Vibrant Parser] Total markers after all passes: ${allMarkers.length}`);
    console.log(`[Vibrant Parser] Total SNPs: ${allGenetics.length}`);

    // ========================================================================
    // PROCESS RESULTS
    // ========================================================================
    
    const results = [];
    const seenMarkers = new Set();
    let idx = 1;

    // Process biomarkers (deduplicate)
    for (const marker of allMarkers) {
      const markerId = normalizeMarkerName(marker.marker_name);
      
      // Skip duplicates
      if (seenMarkers.has(markerId)) continue;
      seenMarkers.add(markerId);
      
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

    // Process genetics
    let snpIdx = 1;
    for (const snp of allGenetics) {
      const rsid = snp.rsid || '';
      if (rsid && rsid.startsWith('rs')) {
        results.push({
          result_id: `${reportId}-${panelType}-SNP-${String(snpIdx).padStart(3, '0')}`,
          report_id: reportId,
          patient_id: patientId,
          marker_id_inbox: rsid,
          value: snp.mutation || '',
          gene_name: snp.gene || SNP_GENE_MAP[rsid] || '',
          risk_level: snp.risk || '',
          marker_type: 'snp'
        });
        snpIdx++;
      }
    }

    const biomarkerCount = results.filter(r => r.marker_type === 'biomarker').length;
    const snpCount = results.filter(r => r.marker_type === 'snp').length;

    console.log(`[Vibrant Parser] Final results: ${results.length} (${biomarkerCount} biomarkers, ${snpCount} SNPs)`);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        report_id: reportId,
        panel_type: panelType,
        biomarker_count: biomarkerCount,
        snp_count: snpCount,
        total_count: results.length,
        results: results
      })
    };

  } catch (error) {
    console.error('[Vibrant Parser] Error:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Parser failed', message: error.message })
    };
  }
};
