const db = require('./config/database');

async function checkOrder13() {
  try {
    console.log('🔍 Checking Order #13...\n');

    // Get order details
    const [orders] = await db.query('SELECT * FROM orders WHERE id = 13');
    console.log('📦 Order:', orders[0]);

    // Get order items
    const [items] = await db.query(`
      SELECT oi.*, p.name as product_name, p.price as product_price,
             p.price_without_magsafe, p.price_with_magsafe, p.has_magsafe_option
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = 13
    `);

    console.log('\n📦 Order Items:');
    items.forEach((item, index) => {
      console.log(`\nItem ${index + 1}:`);
      console.log(`  - ID: ${item.id}`);
      console.log(`  - Product ID: ${item.product_id}`);
      console.log(`  - Product Name: ${item.product_name || 'NOT FOUND'}`);
      console.log(`  - Quantity: ${item.quantity}`);
      console.log(`  - Price in order_items: ${item.price}`);
      console.log(`  - Product base price: ${item.product_price}`);
      console.log(`  - Has MagSafe: ${item.has_magsafe_option}`);
      console.log(`  - MagSafe variant: ${item.magsafe_variant}`);
      console.log(`  - Price without MagSafe: ${item.price_without_magsafe}`);
      console.log(`  - Price with MagSafe: ${item.price_with_magsafe}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkOrder13();
