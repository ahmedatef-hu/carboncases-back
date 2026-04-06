const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateAdmin } = require('../middleware/auth');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Upload image endpoint
router.post('/upload-image', authenticateAdmin, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Return the file URL
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ 
      message: 'Image uploaded successfully',
      url: fileUrl
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ message: 'Error uploading image' });
  }
});

// Get dashboard statistics
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    // Total sales
    const [salesResult] = await db.query(
      "SELECT COALESCE(SUM(total_amount), 0) as total_sales, COUNT(*) as total_orders FROM orders WHERE status != 'canceled'"
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

    // Recent orders
    const [recentOrders] = await db.query(
      `SELECT o.*, u.name as user_name, u.email as user_email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC
       LIMIT 3`
    );

    // Extract phone from shipping_address for recent orders
    const recentOrdersWithPhone = recentOrders.map(order => {
      let phoneFromAddress = null;
    res.json({
      totalSales: salesResult[0].total_sales || 0,
      totalOrders: salesResult[0].total_orders || 0,
      totalUsers: usersCount[0].total_users || 0,
      topProducts,
      
      recentOrders: recentOrdersWithPhone
    }); ...order,
        user_phone: phoneFromAddress
      };
    });

    // Total users
    const [usersCount] = await db.query('SELECT COUNT(*) as total_users FROM users');

    res.json({
      totalSales: salesResult[0].total_sales || 0,
      totalOrders: salesResult[0].total_orders || 0,
      totalUsers: usersCount[0].total_users || 0,
      topProducts,
      
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

    const { 
      name, 
      description, 
      price, 
      stock, 
      category, 
      image_url,
      has_magsafe_option,
      price_without_magsafe,
      price_with_magsafe
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO products (
        name, description, price, stock, category, image_url,
        has_magsafe_option, price_without_magsafe, price_with_magsafe
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, 
        description, 
        price, 
        stock, 
        category, 
        image_url || null,
        has_magsafe_option || false,
        price_without_magsafe || null,
        price_with_magsafe || null
      ]
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

// Update product (allow both admin and user for testing)
router.put('/products/:id', async (req, res) => {
  console.log('🎯 PUT /admin/products/:id route HIT!');
  console.log('🆔 Product ID:', req.params.id);
  console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
  console.log('🔑 Authorization header:', req.headers.authorization ? 'present' : 'missing');
  
  try {
    const { 
      name, 
      description, 
      price, 
      stock, 
      category, 
      image_url,
      has_magsafe_option,
      price_without_magsafe,
      price_with_magsafe
    } = req.body;
    
    console.log('📝 Updating product ID:', req.params.id);
    console.log('📦 Received data:', {
      name,
      price,
      stock,
      has_magsafe_option,
      price_without_magsafe,
      price_with_magsafe
    });
    
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (description !== undefined) {
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
    if (category !== undefined) {
      updates.push('category = ?');
      params.push(category);
    }
    if (image_url !== undefined) {
      updates.push('image_url = ?');
      params.push(image_url);
    }
    if (has_magsafe_option !== undefined) {
      updates.push('has_magsafe_option = ?');
      params.push(has_magsafe_option);
    }
    if (price_without_magsafe !== undefined && price_without_magsafe !== null) {
      updates.push('price_without_magsafe = ?');
      params.push(price_without_magsafe);
      console.log('✅ Updating price_without_magsafe to:', price_without_magsafe);
    }
    if (price_with_magsafe !== undefined && price_with_magsafe !== null) {
      updates.push('price_with_magsafe = ?');
      params.push(price_with_magsafe);
      console.log('✅ Updating price_with_magsafe to:', price_with_magsafe);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    params.push(req.params.id);

    console.log('🔄 SQL Query:', `UPDATE products SET ${updates.join(', ')} WHERE id = ?`);
    console.log('🔄 Params:', params);

    await db.query(
      `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    console.log('✅ Product updated successfully');
    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('❌ Error updating product:', error);
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

    // Extract phone from shipping_address for each order
    const ordersWithPhone = orders.map(order => {
      let phoneFromAddress = null;
      if (order.shipping_address) {
        // Extract phone from format: "Name, Address, City, Gov, Phone: 01234567890"
        const phoneMatch = order.shipping_address.match(/Phone:\s*(\+?\d[\d\s-]+)/i);
        if (phoneMatch) {
          phoneFromAddress = phoneMatch[1].trim();
        }
      }
      
      return {
        ...order,
        user_phone: phoneFromAddress || order.user_phone // Use shipping phone first, fallback to user phone
      };
    });

    res.json(ordersWithPhone);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});
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

    // Extract phone from shipping_address
    let phoneFromAddress = null;
    if (orders[0].shipping_address) {
      const phoneMatch = orders[0].shipping_address.match(/Phone:\s*(\+?\d[\d\s-]+)/i);
      if (phoneMatch) {
        phoneFromAddress = phoneMatch[1].trim();
      }
    }

    const orderWithPhone = {
      ...orders[0],
      user_phone: phoneFromAddress || orders[0].user_phone,
      items
    };

    res.json(orderWithPhone);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order' });
  }
}); const [items] = await db.query(
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
