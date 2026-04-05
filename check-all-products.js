require('dotenv').config();
const db = require('./config/database');

async function checkAllProducts() {
  try {
    const [products] = await db.query(`
      SELECT id, name, image_url 
      FROM products 
      ORDER BY id DESC
    `);

    console.log('\n📦 All Products:\n');
    products.forEach(p => {
      console.log(`  ${p.id}. ${p.name}`);
      console.log(`     image_url: ${p.image_url || 'NULL'}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAllProducts();
