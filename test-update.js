const db = require('./config/database');

async function testUpdate() {
  try {
    console.log('Testing product update...');
    
    // First, get current product data
    const [before] = await db.query('SELECT * FROM products WHERE id = 3');
    console.log('Before update:', before[0]);
    
    // Update the product
    const newPriceWithout = 149.99;
    const newPriceWith = 269.99;
    
    await db.query(
      'UPDATE products SET price_without_magsafe = ?, price_with_magsafe = ? WHERE id = ?',
      [newPriceWithout, newPriceWith, 3]
    );
    
    // Get updated product data
    const [after] = await db.query('SELECT * FROM products WHERE id = 3');
    console.log('After update:', after[0]);
    
    console.log('✅ Update successful!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testUpdate();
