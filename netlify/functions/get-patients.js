const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID_SCORING || 'appXXXXXXXXX'; // Your Scoring base ID

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const query = event.queryStringParameters?.q || '';
    
    // Build Airtable filter formula
    // Search by first_name, last_name, or patient_id
    let filterFormula = '';
    if (query && query.length >= 2) {
      const searchTerm = query.toUpperCase();
      filterFormula = `OR(
        FIND("${searchTerm}", UPPER({first_name})),
        FIND("${searchTerm}", UPPER({last_name})),
        FIND("${searchTerm}", UPPER({patient_id}))
      )`;
    }

    // Fetch from Airtable
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/patients`);
    url.searchParams.append('maxRecords', '50');
    url.searchParams.append('fields[]', 'patient_id');
    url.searchParams.append('fields[]', 'first_name');
    url.searchParams.append('fields[]', 'last_name');
    url.searchParams.append('fields[]', 'dob');
    url.searchParams.append('fields[]', 'biological_sex');
    
    if (filterFormula) {
      url.searchParams.append('filterByFormula', filterFormula);
    }
    
    url.searchParams.append('sort[0][field]', 'last_name');
    url.searchParams.append('sort[0][direction]', 'asc');

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Get Patients] Airtable error:', response.status, errorText);
      return { 
        statusCode: 500, 
        headers, 
        body: JSON.stringify({ error: 'Airtable API failed', details: errorText }) 
      };
    }

    const data = await response.json();
    
    // Format for dropdown
    const patients = data.records.map(record => ({
      patient_id: record.fields.patient_id || '',
      first_name: record.fields.first_name || '',
      last_name: record.fields.last_name || '',
      dob: record.fields.dob || '',
      biological_sex: record.fields.biological_sex || '',
      display: `${record.fields.last_name || ''}, ${record.fields.first_name || ''} (${record.fields.patient_id || 'No ID'})${record.fields.dob ? ' - DOB: ' + record.fields.dob : ''}`
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        count: patients.length,
        patients: patients
      })
    };

  } catch (error) {
    console.error('[Get Patients] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server error', details: error.message })
    };
  }
};
