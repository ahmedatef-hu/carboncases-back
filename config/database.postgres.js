const { Pool } = require('pg');

// Create PostgreSQL connection pool with serverless-friendly settings
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Supabase
  },
  max: 1, // Limit connections for serverless
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Wrapper to make it compatible with MySQL2 syntax
// Converts ? placeholders to $1, $2, etc.
const query = async (text, params) => {
  try {
    // Convert MySQL ? placeholders to PostgreSQL $1, $2, etc.
    let paramIndex = 1;
    const convertedText = text.replace(/\?/g, () => `$${paramIndex++}`);
    
    // Check if it's an INSERT query and add RETURNING id if not present
    let finalText = convertedText;
    if (convertedText.trim().toUpperCase().startsWith('INSERT') && 
        !convertedText.toUpperCase().includes('RETURNING')) {
      finalText = convertedText + ' RETURNING id';
    }
    
    const result = await pool.query(finalText, params);
    
    // For INSERT queries, extract the ID
    if (finalText.toUpperCase().includes('RETURNING') && result.rows.length > 0) {
      // Create a result object that mimics MySQL2 format
      const mysqlResult = {
        insertId: result.rows[0].id,
        affectedRows: result.rowCount,
        ...result.rows[0]
      };
      return [[mysqlResult], result.fields];
    }
    
    // Return in MySQL2 format [rows, fields]
    return [result.rows, result.fields];
  } catch (error) {
    console.error('Database query error:', error);
    console.error('Query:', text);
    console.error('Params:', params);
    throw error;
  }
};

module.exports = {
  query,
  pool
};
