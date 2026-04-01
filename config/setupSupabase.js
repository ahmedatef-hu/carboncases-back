require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting Supabase database setup...\n');

    // Create tables
    console.log('📋 Creating tables...');
    
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255),
        phone VARCHAR(20),
        address TEXT,
        google_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');

    // Admin table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Admin table created');

    // Products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        stock INT DEFAULT 0,
        category VARCHAR(50),
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Products table created');

    // Orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        shipping_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Orders table created');

    // Order items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Order items table created');

    // Wishlist table
    await client.query(`
      CREATE TABLE IF NOT EXISTS wishlist (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE (user_id, product_id)
      )
    `);
    console.log('✅ Wishlist table created');

    // Email verifications table
    await client.query(`
      CREATE TABLE IF NOT EXISTS email_verifications (
        id SERIAL PRIMARY KEY,
        email VARCHAR(100) NOT NULL,
        code VARCHAR(6) NOT NULL,
        verified BOOLEAN DEFAULT FALSE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Email verifications table created');

    // Insert admin user
    console.log('\n👤 Creating admin user...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    await client.query(`
      INSERT INTO admin (name, email, password, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, ['Admin User', 'admin@carboncases.com', adminPassword, 'admin']);
    console.log('✅ Admin user created');

    // Insert sample products
    console.log('\n📦 Creating sample products...');
    const products = [
      ['Carbon Fiber iPhone 15 Pro Case', 'Ultra-slim carbon fiber case with aramid fiber construction.', 49.99, 150, 'phone-covers', 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800'],
      ['Carbon Fiber iPhone 15 Pro Max Case', 'Premium carbon fiber case designed for iPhone 15 Pro Max.', 54.99, 120, 'phone-covers', 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800'],
      ['Minimalist Carbon Fiber Wallet', 'RFID-blocking carbon fiber wallet with aluminum money clip.', 79.99, 200, 'wallets', 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800'],
      ['Carbon Fiber AirPods Pro 2 Case', 'Protective carbon fiber case for AirPods Pro 2nd generation.', 29.99, 300, 'airpods-covers', 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=800'],
      ['Carbon Fiber License Plate Frame', 'Real carbon fiber license plate frame with stainless steel hardware.', 44.99, 180, 'car-accessories', 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800']
    ];

    for (const product of products) {
      await client.query(`
        INSERT INTO products (name, description, price, stock, category, image_url)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, product);
    }
    console.log('✅ Sample products created');

    console.log('\n✅ Database setup completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin: admin@carboncases.com / admin123');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

setupDatabase();
