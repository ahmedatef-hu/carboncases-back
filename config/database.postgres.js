const { Pool } = require('pg');

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Supabase
  }
});

// Test connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ PostgreSQL connection error:', err);
  } else {
    console.log('✅ Connected to Supabase PostgreSQL');
  }
});

// Wrapper to make it compatible with MySQL2 syntax
// Converts ? placeholders to $1, $2, etc.
const query = async (text, params) => {
  // Convert MySQL ? placeholders to PostgreSQL $1, $2, etc.
  let paramIndex = 1;
  const convertedText = text.replace(/\?/g, () => '$' + paramIndex++);
  
  const result = await pool.query(convertedText, params);
  
  // For INSERT queries, add insertId from RETURNING clause or use rowCount
  if (text.trim().toUpperCase().startsWith('INSERT') && result.rows.length > 0 && result.rows[0].id) {
    // If query has RETURNING id, use it
    result.rows.insertId = result.rows[0].id;
  } else if (text.trim().toUpperCase().startsWith('INSERT')) {
    // For INSERT without RETURNING, we can't get the ID
    // But we can indicate success with rowCount
    result.rows.insertId = null;
    result.rows.affectedRows = result.rowCount;
  }
  
  // Return in MySQL2 format [rows, fields]
  return [result.rows, result.fields];
};

module.exports = {
  query,
  pool
};
