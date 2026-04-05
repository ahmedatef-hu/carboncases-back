const db = require('./config/database');

async function testStatsEndpoint() {
  try {
    console.log('🧪 Testing stats endpoint queries...\n');

    // Total sales and orders
    console.log('1️⃣ Testing Total Sales & Orders:');
    const [salesResult] = await db.query(
      "SELECT COALESCE(SUM(total_amount), 0) as total_sales, COUNT(*) as total_orders FROM orders WHERE status != 'canceled'"
    );
    console.log('Result:', salesResult[0]);
    console.log('✅ Total Sales:', parseFloat(salesResult[0].total_sales) || 0);
    console.log('✅ Total Orders:', parseInt(salesResult[0].total_orders) || 0);

    // Top selling products
    console.log('\n2️⃣ Testing Top Selling Products:');
    const [topProducts] = await db.query(
      `SELECT p.id, p.name, p.image_url, 
              SUM(oi.quantity) as total_sold, 
              SUM(oi.quantity * oi.price) as revenue
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.status != 'canceled'
       GROUP BY p.id, p.name, p.image_url
       ORDER BY total_sold DESC
       LIMIT 5`
    );
    console.log('✅ Top Products Count:', topProducts.length);
    console.table(topProducts);

    // Low stock alerts
    console.log('\n3️⃣ Testing Low Stock Alerts:');
    const [lowStock] = await db.query(
      'SELECT id, name, stock_quantity as stock FROM products WHERE stock_quantity < 10 ORDER BY stock_quantity ASC LIMIT 10'
    );
    console.log('✅ Low Stock Count:', lowStock.length);
    console.table(lowStock);

    // Recent orders
    console.log('\n4️⃣ Testing Recent Orders:');
    const [recentOrders] = await db.query(
      `SELECT o.id, o.total_amount as total_price, o.status, o.created_at,
              u.name as user_name, u.email as user_email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC
       LIMIT 10`
    );
    console.log('✅ Recent Orders Count:', recentOrders.length);
    console.table(recentOrders);

    // Total users
    console.log('\n5️⃣ Testing Total Users:');
    const [usersCount] = await db.query('SELECT COUNT(*) as total_users FROM users');
    console.log('✅ Total Users:', parseInt(usersCount[0].total_users) || 0);

    // Final response object
    console.log('\n📊 Final Response Object:');
    const response = {
      totalSales: parseFloat(salesResult[0].total_sales) || 0,
      totalOrders: parseInt(salesResult[0].total_orders) || 0,
      totalUsers: parseInt(usersCount[0].total_users) || 0,
      topProducts: topProducts || [],
      lowStock: lowStock || [],
      recentOrders: recentOrders || []
    };
    console.log(JSON.stringify(response, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testStatsEndpoint();
