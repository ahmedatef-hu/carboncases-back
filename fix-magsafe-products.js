const db = require('./config/database');

async function fixMagSafeProducts() {
  try {
    console.log('🔧 Fixing MagSafe products...\n');
    
    // Get all phone covers
    const [phoneCovers] = await db.query(
      "SELECT * FROM products WHERE category = 'phone-covers' ORDER BY id"
    );
    
    console.log(`Found ${phoneCovers.length} phone cover products:\n`);
    
    for (const product of phoneCovers) {
      console.log(`Product ID ${product.id}: ${product.name}`);
      console.log(`  Current: has_magsafe=${product.has_magsafe_option}, without=${product.price_without_magsafe}, with=${product.price_with_magsafe}`);
      
      // If MagSafe prices are not set, set them
      if (!product.price_without_magsafe || !product.price_with_magsafe) {
        const basePrice = parseFloat(product.price) || 50;
        const priceWithout = basePrice;
        const priceWith = basePrice + 100;
        
        await db.query(
          `UPDATE products 
           SET has_magsafe_option = ?, 
               price_without_magsafe = ?, 
               price_with_magsafe = ? 
           WHERE id = ?`,
          [true, priceWithout, priceWith, product.id]
        );
        
        console.log(`  ✅ Updated: without=${priceWithout}, with=${priceWith}`);
      } else {
        // Make sure has_magsafe_option is true
        await db.query(
          'UPDATE products SET has_magsafe_option = ? WHERE id = ?',
          [true, product.id]
        );
        console.log(`  ✅ Already has MagSafe prices`);
      }
      console.log('');
    }
    
    // Show final state
    console.log('\n📊 Final state of all phone covers:');
    const [updated] = await db.query(
      "SELECT id, name, price, has_magsafe_option, price_without_magsafe, price_with_magsafe FROM products WHERE category = 'phone-covers' ORDER BY id"
    );
    console.table(updated);
    
    console.log('\n✅ All phone covers updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixMagSafeProducts();
