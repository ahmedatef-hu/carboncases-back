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
    
    const result = await pool.query(convertedText, params);
    
    // For INSERT queries with RETURNING, extract the ID
    if (text.trim().toUpperCase().includes('RETURNING') && result.rows.length > 0) {
      result.rows.insertId = result.rows[0].id;
    }
    
    // Return in MySQL2 format [rows, fields]
    return [result.rows, result.fields];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

module.exports = {
  query,
  pool
};
