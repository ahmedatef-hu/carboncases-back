// Database configuration - automatically uses PostgreSQL if DATABASE_URL is set
require('dotenv').config();

let db;

if (process.env.DATABASE_URL) {
  // Use PostgreSQL (Supabase)
  console.log('🔵 Using PostgreSQL (Supabase)');
  db = require('./database.postgres');
} else {
  // Use MySQL (Local)
  console.log('🔵 Using MySQL (Local)');
  const mysql = require('mysql2/promise');
  
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  db = pool;
}

module.exports = db;
