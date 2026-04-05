require('dotenv').config();
const db = require('./config/database');

async function updateStock() {
  try {
    const productId = process.argv[2] || 4; // Default to product ID 4
    const stockQuantity = process.argv[3] || 100; // Default to 100

    console.log(`🔄 Updating stock for product ${productId} to ${stockQuantity}...`);

    await db.query(`
      UPDATE products 
      SET stock_quantity = ? 
      WHERE id = ?
    `, [stockQuantity, productId]);

    console.log('✅ Stock updated successfully');

    // Verify
    const [products] = await db.query(`
      SELECT id, name, stock_quantity 
      FROM products 
      WHERE id = ?
    `, [productId]);

    if (products.length > 0) {
      console.log('\n📦 Product after update:');
      console.log(`  ID: ${products[0].id}`);
      console.log(`  Name: ${products[0].name}`);
      console.log(`  Stock Quantity: ${products[0].stock_quantity}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateStock();
