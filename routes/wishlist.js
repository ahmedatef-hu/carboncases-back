const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateUser } = require('../middleware/auth');

// Get user's wishlist
router.get('/', authenticateUser, async (req, res) => {
  try {
    const [wishlist] = await db.query(
      `SELECT w.id as wishlist_id, p.* 
       FROM wishlist w
       JOIN products p ON w.product_id = p.id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`,
      [req.userId]
    );

    res.json(wishlist);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ message: 'Error fetching wishlist' });
  }
});

// Add product to wishlist
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { productId } = req.body;

    // Check if product exists
    const [products] = await db.query('SELECT id FROM products WHERE id = ?', [productId]);
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Add to wishlist (ignore if already exists)
    await db.query(
      'INSERT IGNORE INTO wishlist (user_id, product_id) VALUES (?, ?)',
      [req.userId, productId]
    );

    res.status(201).json({ message: 'Added to wishlist' });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ message: 'Error adding to wishlist' });
  }
});

// Remove product from wishlist
router.delete('/:productId', authenticateUser, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM wishlist WHERE user_id = ? AND product_id = ?',
      [req.userId, req.params.productId]
    );

    res.json({ message: 'Removed from wishlist' });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ message: 'Error removing from wishlist' });
  }
});

module.exports = router;
