const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateUser } = require('../middleware/auth');

// Create new order
router.post('/', authenticateUser, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { items, shippingAddress } = req.body;
    const userId = req.userId;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Validate products and calculate total
    const productIds = items.map(item => item.productId);
    const [products] = await connection.query(
      'SELECT id, price, stock FROM products WHERE id IN (?)',
      [productIds]
    );

    let totalPrice = 0;
    const orderItems = [];

    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      
      if (!product) {
        await connection.rollback();
        return res.status(400).json({ message: `Product ${item.productId} not found` });
      }

      if (product.stock < item.quantity) {
        await connection.rollback();
        return res.status(400).json({ message: `Insufficient stock for product ${item.productId}` });
      }

      totalPrice += product.price * item.quantity;
      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price
      });
    }

    // Create order
    const [orderResult] = await connection.query(
      'INSERT INTO orders (user_id, total_price, status, shipping_address) VALUES (?, ?, ?, ?)',
      [userId, totalPrice, 'pending', shippingAddress]
    );

    const orderId = orderResult.insertId;

    // Insert order items and update stock
    for (const item of orderItems) {
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.productId, item.quantity, item.price]
      );

      await connection.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.productId]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: 'Order placed successfully',
      orderId,
      totalPrice: totalPrice.toFixed(2)
    });
  } catch (error) {
    await connection.rollback();
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Error creating order' });
  } finally {
    connection.release();
  }
});

// Get user's orders
router.get('/my-orders', authenticateUser, async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.*, 
        GROUP_CONCAT(
          JSON_OBJECT(
            'id', oi.id,
            'productId', oi.product_id,
            'productName', p.name,
            'quantity', oi.quantity,
            'price', oi.price,
            'imageUrl', p.image_url
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC`,
      [req.userId]
    );

    // Parse JSON items
    const ordersWithItems = orders.map(order => ({
      ...order,
      items: order.items ? JSON.parse(`[${order.items}]`) : []
    }));

    res.json(ordersWithItems);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Get single order details
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const [orders] = await db.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const [items] = await db.query(
      `SELECT oi.*, p.name as product_name, p.image_url 
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [req.params.id]
    );

    res.json({ ...orders[0], items });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order' });
  }
});

module.exports = router;
