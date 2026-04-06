require('dotenv').config();
const db = require('./config/database');

async function fixProductPrice() {
  try {
    console.log('🔧 Fixing product prices...\n');

    // Get all products without price but with has_magsafe_option = false or null
    const [products] = await db.query(`
      SELECT id, name, price, price_without_magsafe, has_magsafe_option 
      FROM products 
      WHERE (price IS NULL OR price = 0) 
      AND (has_magsafe_option = false OR has_magsafe_option IS NULL)
      AND price_without_magsafe IS NOT NULL
    `);

    if (products.length === 0) {
      console.log('✅ No products need fixing');
      process.exit(0);
    }

    console.log(`Found ${products.length} product(s) to fix:\n`);

    for (const product of products) {
      console.log(`📦 Product: ${product.name}`);
      console.log(`   Current price: ${product.price}`);
      console.log(`   Price without MagSafe: ${product.price_without_magsafe}`);
      console.log(`   Has MagSafe option: ${product.has_magsafe_option}`);

      // If product has price_without_magsafe but no price, copy it to price
      if (product.price_without_magsafe && (!product.price || product.price === 0)) {
        await db.query(
          'UPDATE products SET price = ? WHERE id = ?',
          [product.price_without_magsafe, product.id]
        );
        console.log(`   ✅ Updated price to: ${product.price_without_magsafe}\n`);
      }
    }

    console.log('✅ All products fixed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixProductPrice();
