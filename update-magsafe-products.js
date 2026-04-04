const db = require('./config/database');

async function updateMagSafeProducts() {
  try {
    console.log('Updating products with MagSafe options...');

    // Update all phone-covers products to have MagSafe options
    const [result] = await db.query(`
      UPDATE products 
      SET 
        has_magsafe_option = TRUE,
        price_without_magsafe = price,
        price_with_magsafe = price + 100
      WHERE category = 'phone-covers' 
        AND (has_magsafe_option IS NULL OR has_magsafe_option = FALSE)
    `);

    console.log(`Updated ${result.affectedRows} phone cover products with MagSafe options`);

    // Show all phone covers
    const [products] = await db.query(`
      SELECT id, name, category, price, has_magsafe_option, 
             price_without_magsafe, price_with_magsafe 
      FROM products 
      WHERE category = 'phone-covers'
    `);

    console.log('\nPhone Cover Products:');
    products.forEach(p => {
      console.log(`- ${p.name}: Without=${p.price_without_magsafe} LE, With=${p.price_with_magsafe} LE`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error updating products:', error);
    process.exit(1);
  }
}

updateMagSafeProducts();
