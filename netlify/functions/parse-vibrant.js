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
  'n-acetyl (3,4-dihydroxybutyl) cysteine': 'NADC',
  'n-acetyl-s-(3,4-dihydroxybutyl)-cysteine': 'NADC',
  'n-acetyl-s-(3,4-dihydroxybutyl)-l-cysteine': 'NADC',
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
  'n-acetyl-s-(2-carbamoylethyl)-cysteine': 'NASC',
  'n-acetyl (2-carbamoylethyl) cysteine': 'NASC',
  'n-acetyl-s-(2-carbamoylethyl)-l-cysteine': 'NASC',
  '2-hydroxyisobutyric acid': '2HIB',
  '2hib': '2HIB',
  '4-methylhippuric acid': '4MHA',
  '4mha': '4MHA',
  'n-acetyl (2,hydroxypropyl) cysteine': 'NAHP',
  'n-acetyl-s-(2-hydroxypropyl)-cysteine': 'NAHP',
  'nahp': 'NAHP',

  // ===== DOM_METABOLIC_TOXIN (1 marker) =====
  'tiglylglycine': 'TG',

  // ===== DOM_OXIDATIVE (16 markers) - Oxidative Stress Biomarkers =====
  // Lipid Peroxidation
  '8-iso-prostaglandin f2α': 'ISO_PGF2A',
  '8-iso-prostaglandin f2a': 'ISO_PGF2A',
  '8-isoprostane': 'ISO_PGF2A',
  'isoprostane': 'ISO_PGF2A',
  'iso_pgf2a': 'ISO_PGF2A',
  '11β-prostaglandin f2α': 'PGF2A_11B',
  '11b-prostaglandin f2a': 'PGF2A_11B',
  '11-beta-prostaglandin': 'PGF2A_11B',
  'pgf2a_11b': 'PGF2A_11B',
  '15(r)-prostaglandin f2α': 'PGF2A_15R',
  '15(r)-prostaglandin f2a': 'PGF2A_15R',
  '15r-prostaglandin': 'PGF2A_15R',
  'pgf2a_15r': 'PGF2A_15R',
  'glutathione-s-4-hydroxynonenal': 'GS_HNE',
  'gs-hne': 'GS_HNE',
  '4-hydroxynonenal': 'GS_HNE',
  'hydroxynonenal': 'GS_HNE',
  'gs_hne': 'GS_HNE',
  'malondialdehyde': 'MDA',
  'mda': 'MDA',
  
  // DNA/RNA Damage
  '8-hydroxy-2-deoxyguanosine': '8OHDG',
  '8-ohdg': '8OHDG',
  '8ohdg': '8OHDG',
  '8-hydroxyguanosine': '8OHG',
  '8-ohg': '8OHG',
  '8ohg': '8OHG',
  '8-hydroxyguanine sulfate': '8OHGS',
  '8-ohgs': '8OHGS',
  '8ohgs': '8OHGS',
  '8-nitroguanine': '8NITROG',
  '8-nitroguanine sulfate': '8NITROGS',
  '8nitrog': '8NITROG',
  '8nitrogs': '8NITROGS',
  
  // Protein Oxidation
  '3-bromotyrosine': '3BTYR',
  'bromotyrosine': '3BTYR',
  '3btyr': '3BTYR',
  '3-chlorotyrosine': '3CLTYR',
  'chlorotyrosine': '3CLTYR',
  '3cltyr': '3CLTYR',
  'dityrosine': 'DITYR',
  'di-tyrosine': 'DITYR',
  'dityr': 'DITYR',
  'nitrotyrosine': 'NITYR',
  '3-nitrotyrosine': 'NITYR',
  'nityr': 'NITYR',
  
  // Advanced Glycation End Products
  'nε-carboxymethyl-lysine': 'CML',
  'carboxymethyl-lysine': 'CML',
  'carboxymethyllysine': 'CML',
  'cml': 'CML',
  'nε-carboxyethyl-lysine': 'CEL',
  'carboxyethyl-lysine': 'CEL',
  'carboxyethyllysine': 'CEL',
  'cel': 'CEL',

  // ===== METHYLATION SERUM (map to EXISTING markers) =====
  'homocysteine': 'HCY',
  'hcy': 'HCY',
  'vitamin b12': 'VIT_B12',
  'vitamin b12 serum': 'VIT_B12',
  'b12': 'VIT_B12',
  'vit_b12': 'VIT_B12',
  'folate': 'FOLATE',
  'folate serum': 'FOLATE',
  'folic acid': 'FOLATE',
  
  // ===== FALLBACK CATCHES for Claude's abbreviated extractions =====
  '2_carbamoylethyl': 'NASC',
  '2-carbamoylethyl': 'NASC',
  'carbamoylethyl': 'NASC',
  'nasc': 'NASC',
  '4_chlorophenyl': 'DDA',
  '4-chlorophenyl': 'DDA',
  'chlorophenyl': 'DDA',
  '2_ethyl_5_hydroxyhexyl': 'MEHHP',
  '2-ethyl-5-hydroxyhexyl': 'MEHHP',
  'hydroxyhexyl': 'MEHHP',
  '2_ethyl_5_oxohexyl': 'MEOHP',
  '2-ethyl-5-oxohexyl': 'MEOHP',
  'oxohexyl': 'MEOHP',
  '2_cyanoethyl': 'NACE',
  '2-cyanoethyl': 'NACE',
  'cyanoethyl': 'NACE',
  'nadc': 'NADC',
  'nadb': 'NADC',
  '3_4_dihydroxybutyl': 'NADC',
  '3,4-dihydroxybutyl': 'NADC',
  'dihydroxybutyl': 'NADC',
  'propyl': 'NAPR'
};

// Genetics field mapping for patient_genetics table
const METHYLATION_GENES = [
  'MTHFR_677', 'MTHFR_1298', 'MTRR_A66G', 'MTRR_K350A', 
  'MAT1A', 'SHMT1', 'GNMT', 'BHMT', 'MTR', 
  'COMT_V158M', 'COMT_H62H', 'NOS3'
];

const OXIDATIVE_GENES = [
  'SOD1', 'SOD2_1', 'SOD2_2', 'SOD3',
  'CAT1', 'CAT2', 'CAT3',
  'GPX1', 'GPX2', 'GPX3', 'GPX4',
  'GSS', 'HMOX1', 'GSTM1', 'GSTM5', 'GSTP1',
  'TRXR2', 'CYBA1', 'CYBA2', 'PRKAA2',
  'XDH1', 'XDH2', 'TXNRD1', 'TXNRD2',
  'CYP1A1', 'COX2', 'SELENOP', 'GSR', 'CYB5R3', 'GLUL'
];

// Gene weights for scoring
const METHYLATION_GENE_WEIGHTS = {
  'MTHFR_677': 1.5, 'MTHFR_1298': 1.5,
  'COMT_V158M': 1.0, 'COMT_H62H': 1.0,
  'MTRR_A66G': 1.0, 'MTRR_K350A': 1.0,
  'MTR': 1.5, 'MAT1A': 1.5, 'SHMT1': 1.5,
  'BHMT': 1.0, 'GNMT': 1.0, 'NOS3': 1.0
};

const OXIDATIVE_GENE_WEIGHTS = {
  'GPX1': 0.625, 'GPX2': 0.625, 'GPX3': 0.625, 'GPX4': 0.625,
  'GSTM1': 0.833, 'GSTM5': 0.833, 'GSTP1': 0.833,
  'SOD1': 0.5, 'SOD2_1': 0.5, 'SOD2_2': 0.5, 'SOD3': 0.5,
  'CYBA1': 1.0, 'CYBA2': 1.0,
  'TRXR2': 0.5, 'TXNRD1': 0.5, 'TXNRD2': 0.5,
  'XDH1': 0.75, 'XDH2': 0.75,
  'CAT1': 0.5, 'CAT2': 0.5, 'CAT3': 0.5,
  'GSS': 1.0, 'HMOX1': 1.0, 'PRKAA2': 1.0,
  'CYP1A1': 1.0, 'COX2': 1.0, 'SELENOP': 1.0,
  'GSR': 1.0, 'CYB5R3': 1.0, 'GLUL': 1.0
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
  
  // ===== PATTERN MATCHING FOR PARTIAL/ABBREVIATED NAMES =====
  
  // Oxidative stress markers
  if (cleaned.includes('isoprostane') || cleaned.includes('8-iso')) {
    return 'ISO_PGF2A';
  }
  if (cleaned.includes('11β') || cleaned.includes('11b') || cleaned.includes('11-beta')) {
    return 'PGF2A_11B';
  }
  if (cleaned.includes('15(r)') || cleaned.includes('15r')) {
    return 'PGF2A_15R';
  }
  if (cleaned.includes('hydroxynonenal') || cleaned.includes('gs-hne') || cleaned.includes('4-hne')) {
    return 'GS_HNE';
  }
  if (cleaned.includes('malondialdehyde') || cleaned === 'mda') {
    return 'MDA';
  }
  if (cleaned.includes('8-hydroxy-2-deoxy') || cleaned.includes('8-ohdg') || cleaned === '8ohdg') {
    return '8OHDG';
  }
  if (cleaned.includes('bromotyrosine')) {
    return '3BTYR';
  }
  if (cleaned.includes('chlorotyrosine')) {
    return '3CLTYR';
  }
  if (cleaned.includes('dityrosine')) {
    return 'DITYR';
  }
  if (cleaned.includes('nitrotyrosine')) {
    return 'NITYR';
  }
  if (cleaned.includes('carboxymethyl') && cleaned.includes('lysine')) {
    return 'CML';
  }
  if (cleaned.includes('carboxyethyl') && cleaned.includes('lysine')) {
    return 'CEL';
  }
  
  // VOC N-Acetyl compounds (most problematic)
  if (cleaned.includes('carbamoylethyl') || cleaned.includes('carbamoyl') || cleaned.includes('2-carbamoyl')) {
    return 'NASC';
  }
  if (cleaned.includes('dihydroxybutyl') || cleaned.includes('3,4-dihydroxy') || cleaned === 'nadc' || cleaned === 'nadb') {
    return 'NADC';
  }
  if (cleaned.includes('cyanoethyl') || cleaned.includes('2-cyano')) {
    return 'NACE';
  }
  if (cleaned.includes('hydroxypropyl') || cleaned.includes('2-hydroxypropyl') || cleaned.includes('2,hydroxypropyl')) {
    return 'NAHP';
  }
  if (cleaned === 'propyl' || (cleaned.includes('propyl') && cleaned.includes('acetyl') && !cleaned.includes('hydroxy'))) {
    return 'NAPR';
  }
  if ((cleaned.includes('phenyl') && cleaned.includes('acetyl') && !cleaned.includes('glyoxylic')) || cleaned === 'nap') {
    return 'NAP';
  }
  
  // Phthalates - catch partial names
  if (cleaned.includes('2-ethyl-5-hydroxyhexyl') || cleaned.includes('2_ethyl_5_hydroxyhexyl') || cleaned.includes('hydroxyhexyl')) {
    return 'MEHHP';
  }
  if (cleaned.includes('2-ethyl-5-oxohexyl') || cleaned.includes('2_ethyl_5_oxohexyl') || cleaned.includes('oxohexyl')) {
    return 'MEOHP';
  }
  
  // Pesticides - catch partial names
  if (cleaned.includes('4-chlorophenyl') || cleaned.includes('chlorophenyl') || cleaned.includes('bis(4-chlorophenyl)')) {
    return 'DDA';
  }
  
  // Special handling for N-Acetyl-S compounds (tricky VOC markers)
  if (cleaned.includes('n-acetyl') || cleaned.includes('acetyl')) {
    if (cleaned.includes('carbamoylethyl') || cleaned.includes('carbamoyl')) {
      return 'NASC';
    }
    if (cleaned.includes('dihydroxybutyl') || cleaned.includes('3,4-dihydroxy')) {
      return 'NADC';
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

// Calculate genetic risk scores
function calculateGeneticScores(genetics) {
  const riskPoints = {
    'Normal': 0,
    'Heterozygous': 1,
    'Homozygous_Mutant': 2,
    'Partially_Elevated': 1,
    'Elevated': 2
  };

  // Methylation score
  let methylationWeightedScore = 0;
  let methylationMaxScore = 0;
  
  if (genetics.methylation && genetics.methylation.length > 0) {
    for (const snp of genetics.methylation) {
      const weight = METHYLATION_GENE_WEIGHTS[snp.gene] || 1.0;
      const points = riskPoints[snp.risk] || 0;
      methylationWeightedScore += points * weight;
      methylationMaxScore += 2 * weight; // max is 2 points per gene
    }
  }
  
  const methylationRiskScore = methylationMaxScore > 0 
    ? Math.round((methylationWeightedScore / methylationMaxScore) * 100) 
    : null;

  // Oxidative score
  let oxidativeWeightedScore = 0;
  let oxidativeMaxScore = 0;
  
  if (genetics.oxidative && genetics.oxidative.length > 0) {
    for (const snp of genetics.oxidative) {
      const weight = OXIDATIVE_GENE_WEIGHTS[snp.gene] || 1.0;
      const points = riskPoints[snp.risk] || 0;
      oxidativeWeightedScore += points * weight;
      oxidativeMaxScore += 2 * weight;
    }
  }
  
  const oxidativeRiskScore = oxidativeMaxScore > 0 
    ? Math.round((oxidativeWeightedScore / oxidativeMaxScore) * 100) 
    : null;

  // Combined score (average of both if both present)
  let combinedScore = null;
  if (methylationRiskScore !== null && oxidativeRiskScore !== null) {
    combinedScore = Math.round((methylationRiskScore + oxidativeRiskScore) / 2);
  } else if (methylationRiskScore !== null) {
    combinedScore = methylationRiskScore;
  } else if (oxidativeRiskScore !== null) {
    combinedScore = oxidativeRiskScore;
  }

  // Detox capacity multiplier: 1.0 (no risk) to 1.3 (high risk)
  const detoxCapacityMultiplier = combinedScore !== null 
    ? Math.round((1 + (combinedScore / 100) * 0.3) * 100) / 100
    : 1.0;

  return {
    methylation_risk_score: methylationRiskScore,
    oxidative_risk_score: oxidativeRiskScore,
    combined_genetic_score: combinedScore,
    detox_capacity_multiplier: detoxCapacityMultiplier
  };
}

// Format genetics for patient_genetics table
function formatGeneticsForAirtable(genetics, reportId, patientId, panelType) {
  const record = {
    genetics_id: `GEN-${reportId}`,
    patient_id: patientId,
    report_id: reportId,
    panel_type: panelType
  };

  // Add methylation SNPs
  if (genetics.methylation) {
    for (const snp of genetics.methylation) {
      if (METHYLATION_GENES.includes(snp.gene)) {
        record[snp.gene] = snp.risk; // Normal, Heterozygous, or Homozygous_Mutant
      }
    }
  }

  // Add oxidative SNPs
  if (genetics.oxidative) {
    for (const snp of genetics.oxidative) {
      if (OXIDATIVE_GENES.includes(snp.gene)) {
        record[snp.gene] = snp.risk; // Normal, Partially_Elevated, or Elevated
      }
    }
  }

  // Add calculated scores
  const scores = calculateGeneticScores(genetics);
  Object.assign(record, scores);

  return record;
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

    // Enhanced extraction prompt that handles all panel types
    const extractionPrompt = `Extract ALL test results from this Vibrant Wellness lab report PDF.

STEP 1: Identify which panels are present:
- Total Tox Panel (Heavy Metals, Mycotoxins, Environmental Toxins)
- PFAS Panel
- Methylation Panel (includes genetics AND serum markers)
- Oxidative Stress Panel (includes genetics AND biomarkers)

STEP 2: For each BIOMARKER/TEST RESULT, extract:
- marker_name: The COMPLETE name as shown
- value: Numeric result only (if "<LOD" or "ND" or "Not Detected", use 0)

STEP 3: For GENETICS (SNPs from Methylation and/or Oxidative panels), extract:
- gene: Gene name (e.g., "MTHFR C677T", "GPX4", "GSTM1")
- rsid: rs number if shown (e.g., "rs1801133")
- genotype: The allele result (e.g., "C/C", "C/T", "T/T")
- risk: Risk level as shown - use exactly: "Normal", "Heterozygous", "Homozygous_Mutant" for methylation; "Normal", "Partially_Elevated", "Elevated" for oxidative

Return ONLY valid JSON (no markdown, no code blocks):
{
  "panels_detected": ["Total_Tox", "PFAS", "Methylation", "Oxidative_Stress"],
  "markers": [
    {"marker_name": "Arsenic", "value": 12.5},
    {"marker_name": "Homocysteine", "value": 11.0},
    {"marker_name": "8-Hydroxy-2-deoxyguanosine", "value": 2.8},
    {"marker_name": "Malondialdehyde", "value": 0.15}
  ],
  "genetics": {
    "methylation": [
      {"gene": "MTHFR_677", "rsid": "rs1801133", "genotype": "C/C", "risk": "Normal"},
      {"gene": "MTHFR_1298", "rsid": "rs1801131", "genotype": "C/C", "risk": "Homozygous_Mutant"},
      {"gene": "MTRR_A66G", "rsid": "rs1801394", "genotype": "G/G", "risk": "Homozygous_Mutant"},
      {"gene": "MTRR_K350A", "rsid": "rs162036", "genotype": "A/A", "risk": "Normal"},
      {"gene": "MAT1A", "rsid": "rs4933327", "genotype": "T/T", "risk": "Homozygous_Mutant"},
      {"gene": "SHMT1", "rsid": "rs1979277", "genotype": "A/A", "risk": "Homozygous_Mutant"},
      {"gene": "GNMT", "rsid": "rs10948059", "genotype": "C/C", "risk": "Normal"},
      {"gene": "BHMT", "rsid": "rs3733890", "genotype": "G/G", "risk": "Normal"},
      {"gene": "MTR", "rsid": "rs1805087", "genotype": "A/A", "risk": "Normal"},
      {"gene": "COMT_V158M", "rsid": "rs4680", "genotype": "G/G", "risk": "Normal"},
      {"gene": "COMT_H62H", "rsid": "rs4633", "genotype": "C/C", "risk": "Normal"},
      {"gene": "NOS3", "rsid": "rs1799983", "genotype": "G/G", "risk": "Normal"}
    ],
    "oxidative": [
      {"gene": "GPX4", "rsid": "rs713041", "genotype": "T/T", "risk": "Elevated"},
      {"gene": "GSTM1", "rsid": "Deletion", "genotype": "Null/Null", "risk": "Elevated"},
      {"gene": "SOD2_1", "rsid": "rs4880", "genotype": "C/C", "risk": "Normal"}
    ]
  }
}

CRITICAL INSTRUCTIONS:
- Extract ALL markers from ALL pages
- Include both normal AND elevated results
- For genetics, map gene names to standardized format:
  * MTHFR C677T → MTHFR_677
  * MTHFR A1298C → MTHFR_1298
  * MTRR A66G → MTRR_A66G
  * MTRR K350A → MTRR_K350A
  * SOD2 rs4880 → SOD2_1
  * SOD2 rs2758331 → SOD2_2
  * CYBA rs4673 → CYBA1
  * CYBA rs1049255 → CYBA2
  * XDH rs206860 → XDH1
  * XDH rs17011368 → XDH2
- Use EXACT risk level strings as shown above
- If no genetics panels present, return empty genetics object: {"methylation": [], "oxidative": []}
- Value must be a number only (no units, no text)
- Do NOT skip any markers or SNPs`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 16000,
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
    console.log('[Vibrant Parser] Panels detected:', parsed.panels_detected || []);
    console.log('[Vibrant Parser] Extracted', parsed.markers?.length || 0, 'markers');
    console.log('[Vibrant Parser] Methylation SNPs:', parsed.genetics?.methylation?.length || 0);
    console.log('[Vibrant Parser] Oxidative SNPs:', parsed.genetics?.oxidative?.length || 0);

    // Filter out non-toxin validation markers
    const SKIP_MARKERS = new Set([
      'urine creatinine', 'urinary creatinine', 'creatinine', 'uc',
      'specific gravity', 'sg', 'ph', 'urine ph'
    ]);
    
    // Format markers for Airtable results table
    const airtableRecords = (parsed.markers || [])
      .filter(marker => {
        const name = marker.marker_name.toLowerCase().trim();
        return !SKIP_MARKERS.has(name);
      })
      .map((marker, index) => {
        const markerId = normalizeMarkerName(marker.marker_name);
        return {
          result_id: `${finalReportId}-${String(index + 1).padStart(3, '0')}`,
          report_id: finalReportId,
          patient_id: patientId || '',
          marker_id_inbox: markerId,
          value: parseFloat(marker.value) || 0
        };
      });

    // Determine panel type for genetics
    const hasMethodylation = parsed.genetics?.methylation?.length > 0;
    const hasOxidative = parsed.genetics?.oxidative?.length > 0;
    let panelType = 'None';
    if (hasMethodylation && hasOxidative) {
      panelType = 'Both';
    } else if (hasMethodylation) {
      panelType = 'Methylation';
    } else if (hasOxidative) {
      panelType = 'Oxidative_Stress';
    }

    // Format genetics for patient_genetics table
    let geneticsRecord = null;
    if (panelType !== 'None') {
      geneticsRecord = formatGeneticsForAirtable(
        parsed.genetics,
        finalReportId,
        patientId || '',
        panelType
      );
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        report_id: finalReportId,
        patient_id: patientId || '',
        panels_detected: parsed.panels_detected || [],
        
        // Results for results table (existing flow)
        marker_count: airtableRecords.length,
        results: airtableRecords,
        
        // Genetics for patient_genetics table (new)
        has_genetics: panelType !== 'None',
        panel_type: panelType,
        genetics: geneticsRecord,
        
        // Raw genetics for debugging/display
        genetics_raw: {
          methylation_snps: parsed.genetics?.methylation || [],
          oxidative_snps: parsed.genetics?.oxidative || []
        }
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
