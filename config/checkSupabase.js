require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking Supabase database...\n');

    // Check products
    const productsResult = await client.query('SELECT COUNT(*) FROM products');
    console.log(`📦 Products: ${productsResult.rows[0].count} items`);
    
    const products = await client.query('SELECT id, name, price, stock FROM products ORDER BY id');
    console.log('\n📋 Products List:');
    products.rows.forEach(p => {
      console.log(`  ${p.id}. ${p.name} - $${p.price} (Stock: ${p.stock})`);
    });

    // Check users
    const usersResult = await client.query('SELECT COUNT(*) FROM users');
    console.log(`\n👥 Users: ${usersResult.rows[0].count} users`);

    // Check admin
    const adminResult = await client.query('SELECT COUNT(*) FROM admin');
    console.log(`👨‍💼 Admins: ${adminResult.rows[0].count} admin(s)`);

    // Check orders
    const ordersResult = await client.query('SELECT COUNT(*) FROM orders');
    console.log(`📦 Orders: ${ordersResult.rows[0].count} orders`);

    console.log('\n✅ Database check completed!');

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkDatabase();
