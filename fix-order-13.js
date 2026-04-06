const db = require('./config/database');

async function fixOrder13() {
  try {
    console.log('🔧 Fixing Order #13...\n');

    // Fix each item - use price_without_magsafe as default since variant is null
    const fixes = [
      { id: 14, product_id: 17, price: 3000.00, quantity: 3 }, // Full Forged - without MagSafe
      { id: 15, product_id: 15, price: 2300.00, quantity: 1 }, // V2 colored - without MagSafe
      { id: 16, product_id: 14, price: 2300.00, quantity: 1 }  // V2 - without MagSafe
    ];

    for (const fix of fixes) {
      await db.query(
        'UPDATE order_items SET price = ? WHERE id = ?',
        [fix.price, fix.id]
      );
      console.log(`✅ Fixed item ${fix.id}: price = LE ${fix.price}`);
    }

    // Calculate total
    const total = fixes.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    console.log(`\n💰 Total: LE ${total.toFixed(2)}`);

    // Update order total
    await db.query(
      'UPDATE orders SET total_amount = ? WHERE id = 13',
      [total]
    );

    console.log('✅ Order #13 fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixOrder13();
