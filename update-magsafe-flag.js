require('dotenv').config();
const db = require('./config/database');

async function updateMagSafeFlag() {
  try {
    console.log('🔄 Updating has_magsafe_option for Phone Covers...');

    // Update all Phone Covers to have has_magsafe_option = true
    const result = await db.query(`
      UPDATE products 
      SET has_magsafe_option = true 
      WHERE category = 'Phone Covers' 
      AND (has_magsafe_option IS NULL OR has_magsafe_option = false)
    `);

    console.log('✅ Updated products:', result);
    console.log('✅ All Phone Covers now have has_magsafe_option = true');

    // Show updated products
    const [products] = await db.query(`
      SELECT id, name, category, has_magsafe_option, price_without_magsafe, price_with_magsafe
      FROM products 
      WHERE category = 'Phone Covers'
    `);

    console.log('\n📦 Phone Cover Products:');
    products.forEach(p => {
      console.log(`  - ${p.name}: has_magsafe_option=${p.has_magsafe_option}, without=${p.price_without_magsafe}, with=${p.price_with_magsafe}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateMagSafeFlag();
