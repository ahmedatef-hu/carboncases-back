const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateUser } = require('../middleware/auth');

// Get user's cart (stored in session/local storage on frontend)
// This endpoint validates product availability and prices
router.post('/validate', authenticateUser, async (req, res) => {
  try {
    const { items } = req.body; // Array of {productId, quantity}

    if (!items || items.length === 0) {
      return res.json({ valid: true, items: [] });
    }

    const productIds = items.map(item => item.productId);
    const [products] = await db.query(
      'SELECT id, name, price, stock FROM products WHERE id IN (?)',
      [productIds]
    );

    // Validate each item
    const validatedItems = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      
      if (!product) {
        return { ...item, valid: false, error: 'Product not found' };
      }
      
      if (product.stock < item.quantity) {
        return { ...item, valid: false, error: 'Insufficient stock', availableStock: product.stock };
      }

      return {
        ...item,
        valid: true,
        product: {
          id: product.id,
          name: product.name,
          price: product.price
        }
      };
    });

    const allValid = validatedItems.every(item => item.valid);
    const total = validatedItems
      .filter(item => item.valid)
      .reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    res.json({
      valid: allValid,
      items: validatedItems,
      total: total.toFixed(2)
    });
  } catch (error) {
    console.error('Cart validation error:', error);
    res.status(500).json({ message: 'Error validating cart' });
  }
});

module.exports = router;
