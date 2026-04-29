const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateUser } = require('../middleware/auth');

// Create new order
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;
    const userId = req.userId;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Validate products and calculate total
    const productIds = items.map(item => item.productId);
    
    // Query products - works for both MySQL (IN) and PostgreSQL (= ANY)
    const placeholders = productIds.map(() => '?').join(',');
    const [products] = await db.query(
      `SELECT id, price, stock, has_magsafe_option, price_without_magsafe, price_with_magsafe 
       FROM products WHERE id IN (${placeholders})`,
      productIds
    );

    console.log('📦 Products fetched for order:', products);

    let totalPrice = 0;
    const orderItems = [];

    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      
      if (!product) {
        return res.status(400).json({ message: `Product ${item.productId} not found` });
      }

      // Stock validation removed - allow orders even if stock is 0

      // Determine price based on variant
      let itemPrice = parseFloat(product.price);
      
      console.log(`🔍 Product ${product.id}:`, {
        has_magsafe: product.has_magsafe_option,
        variant: item.variant,
        price_without: product.price_without_magsafe,
        price_with: product.price_with_magsafe,
        base_price: product.price
      });
      
      if (item.variant && product.has_magsafe_option) {
        if (item.variant === 'with_magsafe') {
          itemPrice = parseFloat(product.price_with_magsafe);
          console.log(`✅ Using WITH MagSafe price: ${itemPrice}`);
        } else {
          itemPrice = parseFloat(product.price_without_magsafe);
          console.log(`✅ Using WITHOUT MagSafe price: ${itemPrice}`);
        }
      } else {
        console.log(`✅ Using base price: ${itemPrice}`);
      }

      const itemTotal = itemPrice * item.quantity;
      console.log(`💰 Item total: ${itemPrice} x ${item.quantity} = ${itemTotal}`);
      
      totalPrice += itemTotal;
      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: itemPrice,
        variant: item.variant || null,
        selectedColor: item.selectedColor || null,
        selectedModel: item.selectedModel || null
      });
    }

    console.log(`💵 Total order price: ${totalPrice}`);

    // Create order
    const [orderResult] = await db.query(
      'INSERT INTO orders (user_id, total_amount, status, shipping_address) VALUES (?, ?, ?, ?)',
      [userId, totalPrice, 'pending', shippingAddress]
    );

    const orderId = orderResult.insertId || orderResult[0]?.id;

    // Insert order items (stock update removed)
    for (const item of orderItems) {
      await db.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price, magsafe_variant, selected_color, selected_model) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [orderId, item.productId, item.quantity, item.price, item.variant, item.selectedColor, item.selectedModel]
      );

      // Stock update removed - stock won't decrease automatically
    }

    res.status(201).json({
      message: 'Order placed successfully',
      orderId,
      totalPrice: totalPrice.toFixed(2)
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: 'Error creating order' });
  }
});

// Get user's orders
router.get('/my-orders', authenticateUser, async (req, res) => {
  try {
    // Get orders
    const [orders] = await db.query(
      `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
      [req.userId]
    );

    // Get items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const [items] = await db.query(
          `SELECT oi.id, oi.product_id as "productId", oi.quantity, oi.price,
                  oi.magsafe_variant as variant,
                  p.name as "productName", p.image_url as "imageUrl"
           FROM order_items oi
           JOIN products p ON oi.product_id = p.id
           WHERE oi.order_id = ?`,
          [order.id]
        );
        return { ...order, items };
      })
    );

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
      `SELECT oi.*, p.name as product_name, p.image_url, 
              oi.magsafe_variant as variant,
              oi.selected_color,
              oi.selected_model
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
