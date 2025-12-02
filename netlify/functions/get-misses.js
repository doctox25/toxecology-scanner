// netlify/functions/get-misses.js
// Export unfound barcodes for manual research or AI processing

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const status = event.queryStringParameters?.status || 'pending';
  const limit = Math.min(parseInt(event.queryStringParameters?.limit) || 100, 500);
  const format = event.queryStringParameters?.format || 'json';
  const minScans = parseInt(event.queryStringParameters?.min_scans) || 1;

  try {
    let formula = `AND({status}="${status}",{scan_count}>=${minScans})`;
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/scan_misses?filterByFormula=${encodeURIComponent(formula)}&sort[0][field]=scan_count&sort[0][direction]=desc&maxRecords=${limit}`;
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` }
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }
    
    const misses = (data.records || []).map(r => ({
      barcode: r.fields.barcode,
      scan_count: r.fields.scan_count || 1,
      first_scanned: r.fields.first_scanned,
      last_scanned: r.fields.last_scanned,
      category_hint: r.fields.category_hint || 'Unknown',
      record_id: r.id,
    }));

    // CSV format for Fiverr workers
    if (format === 'csv') {
      const csvHeader = 'barcode,scan_count,first_scanned,last_scanned,category_hint,product_name,brand,category,sub_category,ingredients,notes';
      const csvRows = misses.map(m => 
        `${m.barcode},${m.scan_count},${m.first_scanned || ''},${m.last_scanned || ''},${m.category_hint},,,,,,`
      );
      const csv = [csvHeader, ...csvRows].join('\n');
      
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="scan_misses_${new Date().toISOString().split('T')[0]}.csv"`,
        },
        body: csv,
      };
    }

    // JSON format (default)
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        status,
        count: misses.length,
        misses,
      }),
    };
    
  } catch (error) {
    console.error('Error fetching misses:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};
