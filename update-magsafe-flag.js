const db = require('./config/database');

async function updateMagSafeFlag() {
  try {
    console.log('🔧 Updating MagSafe flags for existing products...');

    // Get all products
    const [products] = await db.query('SELECT id, name, price_without_magsafe, price_with_magsafe, has_magsafe_option FROM products');

    console.log(`📦 Found ${products.length} products`);

    for (const product of products) {
      // If product has both MagSafe prices, set has_magsafe_option to true
      if (product.price_without_magsafe && product.price_with_magsafe) {
        await db.query(
          'UPDATE products SET has_magsafe_option = ? WHERE id = ?',
          [true, product.id]
        );
        console.log(`✅ ${product.name}: Set has_magsafe_option = true`);
      } else {
        // Otherwise set to false
        await db.query(
          'UPDATE products SET has_magsafe_option = ? WHERE id = ?',
          [false, product.id]
        );
        console.log(`✅ ${product.name}: Set has_magsafe_option = false`);
      }
    }

    console.log('\n✅ All products updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateMagSafeFlag();
