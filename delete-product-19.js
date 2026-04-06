require('dotenv').config();
const db = require('./config/database');

async function deleteProduct() {
  try {
    console.log('🗑️  Deleting product ID 19...\n');

    // Delete product images first
    await db.query('DELETE FROM product_images WHERE product_id = ?', [19]);
    console.log('✅ Deleted product images');

    // Delete product colors
    await db.query('DELETE FROM product_colors WHERE product_id = ?', [19]);
    console.log('✅ Deleted product colors');

    // Delete product models
    await db.query('DELETE FROM product_models WHERE product_id = ?', [19]);
    console.log('✅ Deleted product models');

    // Delete product
    await db.query('DELETE FROM products WHERE id = ?', [19]);
    console.log('✅ Deleted product');

    console.log('\n✅ Product 19 deleted successfully!');
    console.log('   You can now add it again with the correct price.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

deleteProduct();
