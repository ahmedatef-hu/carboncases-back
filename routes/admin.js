const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateAdmin } = require('../middleware/auth');

// Get dashboard statistics
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    // Total sales
    const [salesResult] = await db.query(
      "SELECT SUM(total_price) as total_sales, COUNT(*) as total_orders FROM orders WHERE status != 'canceled'"
    );

    // Top selling products
    const [topProducts] = await db.query(
      `SELECT p.id, p.name, p.image_url, SUM(oi.quantity) as total_sold, SUM(oi.quantity * oi.price) as revenue
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN orders o ON oi.order_id = o.id
       WHERE o.status != 'canceled'
       GROUP BY p.id
       ORDER BY total_sold DESC
       LIMIT 5`
    );

    // Low stock alerts
    const [lowStock] = await db.query(
      'SELECT id, name, stock FROM products WHERE stock < 50 ORDER BY stock ASC'
    );

    // Recent orders
    const [recentOrders] = await db.query(
      `SELECT o.*, u.name as user_name, u.email as user_email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC
       LIMIT 10`
    );

    // Total users
    const [usersCount] = await db.query('SELECT COUNT(*) as total_users FROM users');

    res.json({
      totalSales: salesResult[0].total_sales || 0,
      totalOrders: salesResult[0].total_orders || 0,
      totalUsers: usersCount[0].total_users || 0,
      topProducts,
      lowStock,
      recentOrders
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Error fetching statistics' });
  }
});

// Get all products (admin view)
router.get('/products', authenticateAdmin, async (req, res) => {
  try {
    const [products] = await db.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// Create product
router.post('/products', authenticateAdmin, [
  body('name').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('price').isFloat({ min: 0 }),
  body('stock').isInt({ min: 0 }),
  body('category').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, price, stock, category, image_url } = req.body;

    const [result] = await db.query(
      'INSERT INTO products (name, description, price, stock, category, image_url) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description, price, stock, category, image_url || null]
    );

    res.status(201).json({
      message: 'Product created successfully',
      productId: result.insertId
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Error creating product' });
  }
});

// Update product
router.put('/products/:id', authenticateAdmin, async (req, res) => {
  try {
    const { name, description, price, stock, category, image_url } = req.body;
    const updates = [];
    const params = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (description) {
      updates.push('description = ?');
      params.push(description);
    }
    if (price !== undefined) {
      updates.push('price = ?');
      params.push(price);
    }
    if (stock !== undefined) {
      updates.push('stock = ?');
      params.push(stock);
    }
    if (category) {
      updates.push('category = ?');
      params.push(category);
    }
    if (image_url !== undefined) {
      updates.push('image_url = ?');
      params.push(image_url);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    params.push(req.params.id);

    await db.query(
      `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product' });
  }
});

// Delete product
router.delete('/products/:id', authenticateAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product' });
  }
});

// Get all orders
router.get('/orders', authenticateAdmin, async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`
    );

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Update order status
router.put('/orders/:id', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'shipped', 'completed', 'canceled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ message: 'Error updating order' });
  }
});

// Get all users
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, name, email, phone, address, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Delete user
router.delete('/users/:id', authenticateAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

module.exports = router;
