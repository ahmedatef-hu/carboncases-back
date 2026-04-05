const db = require('./config/database');

async function checkDashboardData() {
  try {
    console.log('🔍 Checking dashboard data...\n');

    // Check orders
    const [orders] = await db.query('SELECT COUNT(*) as count, SUM(total_amount) as total FROM orders');
    console.log('📦 Orders:', orders[0]);

    // Check order items
    const [orderItems] = await db.query('SELECT COUNT(*) as count FROM order_items');
    console.log('📋 Order Items:', orderItems[0]);

    // Check products
    const [products] = await db.query('SELECT COUNT(*) as count FROM products');
    console.log('🛍️  Products:', products[0]);

    // Check users
    const [users] = await db.query('SELECT COUNT(*) as count FROM users');
    console.log('👥 Users:', users[0]);

    // Check low stock
    const [lowStock] = await db.query('SELECT COUNT(*) as count FROM products WHERE stock_quantity < 10');
    console.log('⚠️  Low Stock Products:', lowStock[0]);

    // Sample orders
    console.log('\n📋 Sample Orders:');
    const [sampleOrders] = await db.query('SELECT id, user_id, total_amount, status, created_at FROM orders LIMIT 5');
    console.table(sampleOrders);

    // Sample products
    console.log('\n🛍️  Sample Products:');
    const [sampleProducts] = await db.query('SELECT id, name, stock_quantity, price FROM products LIMIT 5');
    console.table(sampleProducts);

    // Top selling products query
    console.log('\n🏆 Testing Top Selling Products Query:');
    const [topProducts] = await db.query(`
      SELECT p.id, p.name, p.image_url, 
             SUM(oi.quantity) as total_sold, 
             SUM(oi.quantity * oi.price) as revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status != 'canceled'
      GROUP BY p.id, p.name, p.image_url
      ORDER BY total_sold DESC
      LIMIT 5
    `);
    console.table(topProducts);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkDashboardData();
