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
  // Return in MySQL2 format [rows, fields]
  return [result.rows, result.fields];
};

module.exports = {
  query,
  pool
};
