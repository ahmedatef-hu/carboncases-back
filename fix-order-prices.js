const db = require('./config/database');

async function fixOrderPrices() {
  try {
    console.log('🔧 Starting to fix order prices...');

    // Get all order items without prices
    const [items] = await db.query(`
      SELECT oi.id, oi.product_id, oi.quantity, oi.price, oi.magsafe_variant,
             p.price as product_price, p.price_without_magsafe, p.price_with_magsafe,
             p.has_magsafe_option, p.name as product_name
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.price IS NULL OR oi.price = 0
    `);

    console.log(`📦 Found ${items.length} order items without prices`);

    for (const item of items) {
      let correctPrice = parseFloat(item.product_price);

      // Check if product has MagSafe option and variant is specified
      if (item.has_magsafe_option && item.magsafe_variant) {
        if (item.magsafe_variant === 'with_magsafe' && item.price_with_magsafe) {
          correctPrice = parseFloat(item.price_with_magsafe);
          console.log(`✅ Item ${item.id} (${item.product_name}): Using WITH MagSafe price = ${correctPrice}`);
        } else if (item.magsafe_variant === 'without_magsafe' && item.price_without_magsafe) {
          correctPrice = parseFloat(item.price_without_magsafe);
          console.log(`✅ Item ${item.id} (${item.product_name}): Using WITHOUT MagSafe price = ${correctPrice}`);
        } else {
          console.log(`✅ Item ${item.id} (${item.product_name}): Using base price = ${correctPrice}`);
        }
      } else {
        console.log(`✅ Item ${item.id} (${item.product_name}): Using base price = ${correctPrice}`);
      }

      // Update the order item with correct price
      await db.query(
        'UPDATE order_items SET price = ? WHERE id = ?',
        [correctPrice, item.id]
      );
    }

    // Now update order totals
    console.log('\n💰 Updating order totals...');
    
    const [orders] = await db.query('SELECT id FROM orders');
    
    for (const order of orders) {
      const [orderItems] = await db.query(
        'SELECT price, quantity FROM order_items WHERE order_id = ?',
        [order.id]
      );

      const total = orderItems.reduce((sum, item) => {
        return sum + (parseFloat(item.price || 0) * parseInt(item.quantity || 0));
      }, 0);

      await db.query(
        'UPDATE orders SET total_amount = ? WHERE id = ?',
        [total, order.id]
      );

      console.log(`✅ Order ${order.id}: Total = LE ${total.toFixed(2)}`);
    }

    console.log('\n✅ All prices fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing prices:', error);
    process.exit(1);
  }
}

fixOrderPrices();
