require('dotenv').config();
const db = require('./config/database');

async function checkProduct() {
  try {
    console.log('🔍 Checking latest product...\n');

    // Get the latest product
    const [products] = await db.query(`
      SELECT * FROM products 
      ORDER BY created_at DESC 
      LIMIT 1
    `);

    if (products.length === 0) {
      console.log('❌ No products found');
      process.exit(0);
    }

    const product = products[0];
    console.log('📦 Latest Product:');
    console.log('   ID:', product.id);
    console.log('   Name:', product.name);
    console.log('   Category:', product.category);
    console.log('   Price:', product.price);
    console.log('   Has MagSafe Option:', product.has_magsafe_option);
    console.log('   Price Without MagSafe:', product.price_without_magsafe);
    console.log('   Price With MagSafe:', product.price_with_magsafe);
    console.log('   Stock:', product.stock_quantity);
    console.log('   Created:', product.created_at);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkProduct();
