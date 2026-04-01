const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all products with optional filters
router.get('/', async (req, res) => {
  try {
    const { category, minPrice, maxPrice, sort } = req.query;
    
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    // Apply category filter
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    // Apply price range filter
    if (minPrice) {
      query += ' AND price >= ?';
      params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      query += ' AND price <= ?';
      params.push(parseFloat(maxPrice));
    }

    // Apply sorting
    if (sort === 'price_asc') {
      query += ' ORDER BY price ASC';
    } else if (sort === 'price_desc') {
      query += ' ORDER BY price DESC';
    } else if (sort === 'newest') {
      query += ' ORDER BY created_at DESC';
    } else {
      query += ' ORDER BY id DESC';
    }

    const [products] = await db.query(query, params);
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const [products] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(products[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product' });
  }
});

// Get product categories
router.get('/meta/categories', async (req, res) => {
  try {
    const [categories] = await db.query('SELECT DISTINCT category FROM products ORDER BY category');
    res.json(categories.map(c => c.category));
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

module.exports = router;
