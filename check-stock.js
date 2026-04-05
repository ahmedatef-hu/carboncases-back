require('dotenv').config();
const db = require('./config/database');

async function checkStock() {
  try {
    console.log('🔍 Checking stock_quantity in products...\n');

    const [products] = await db.query(`
      SELECT id, name, category, stock_quantity, price, price_without_magsafe, price_with_magsafe
      FROM products 
      ORDER BY id DESC
      LIMIT 10
    `);

    console.log('📦 Latest Products:');
    console.log('='.repeat(80));
    products.forEach(p => {
      console.log(`ID: ${p.id}`);
      console.log(`Name: ${p.name}`);
      console.log(`Category: ${p.category}`);
      console.log(`Stock Quantity: ${p.stock_quantity}`);
      console.log(`Price: ${p.price}`);
      console.log(`Price Without MagSafe: ${p.price_without_magsafe}`);
      console.log(`Price With MagSafe: ${p.price_with_magsafe}`);
      console.log('-'.repeat(80));
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkStock();
