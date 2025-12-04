const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

// Marker mapping for matching Vibrant names to our marker_ids
const MARKER_ALIASES = {
  'aflatoxin b1': 'AFB1',
  'arsenic': 'ARS',
  'lead': 'LEAD',
  'cadmium': 'CAD',
  'gliotoxin': 'GLIO',
  'mercury': 'MERC',
  'bisphenol a': 'BPA',
  'bpa': 'BPA',
  'triclosan': 'TCS',
  'glyphosate': 'GLYP',
  'ochratoxin a': 'OTA',
  'pfos': 'PFOS',
  'pfoa': 'PFOA',
  'methylparaben': 'M_PARA',
  'propylparaben': 'P_PAR',
  'ethylparaben': 'E_PARA',
  // Add more as needed
};

function normalizeMarkerName(name) {
  const lower = name.toLowerCase().trim();
  return MARKER_ALIASES[lower] || name.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
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

    console.log('[Vibrant Parser] Processing PDF for patient:', patientId);

    // Send to Claude for extraction
    const extractionPrompt = `Extract all lab test results from this Vibrant Wellness lab report PDF.

For EACH marker/test result, extract:
- marker_name: The exact name of the marker/test
- value: The numeric result value (number only, no units)
- units: The unit of measurement (µg/g, ng/g, etc.)
- reference_low: Low end of reference range (if shown)
- reference_high: High end of reference range (if shown)
- status: "Normal", "Elevated", "High", or "Low" if indicated

Return ONLY valid JSON array (no markdown, no explanation):
[
  {"marker_name": "Arsenic", "value": 12.5, "units": "µg/g", "reference_low": 0, "reference_high": 11.9, "status": "Elevated"},
  {"marker_name": "Lead", "value": 0.3, "units": "µg/g", "reference_low": 0, "reference_high": 0.52, "status": "Normal"}
]

Important:
- Extract ALL markers from ALL pages
- Include both in-range and out-of-range results
- Use exact numeric values (not ranges)
- If a value shows "<LOD" or "ND", use 0 as the value
- Categories include: Heavy Metals, Mycotoxins, PFAS, Phthalates, Parabens, VOCs, Pesticides`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
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
    
    let results;
    try {
      results = JSON.parse(extractedText);
    } catch (parseError) {
      console.error('[Vibrant Parser] JSON parse error:', parseError);
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to parse Claude response', raw: extractedText }) };
    }

    console.log('[Vibrant Parser] Extracted', results.length, 'markers');

    // Format for Airtable
    const airtableRecords = results.map((result, index) => ({
      result_id: `${reportId}-${String(index + 1).padStart(3, '0')}`,
      report_id: reportId,
      patient_id: patientId,
      marker_id: normalizeMarkerName(result.marker_name),
      marker_name_raw: result.marker_name,
      value: result.value,
      units: result.units,
      ref_low: result.reference_low,
      ref_high: result.reference_high,
      status: result.status,
      qualifier: result.value === 0 ? '<LOD' : null
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        count: results.length,
        results: airtableRecords,
        raw: results
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
