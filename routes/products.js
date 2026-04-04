const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * Get all products with basic info
 * For product listing pages
 */
router.get('/', async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice } = req.query;
    
    // Map URL-friendly category names to database category names
    const categoryMap = {
      'phone-covers': 'Phone Covers',
      'wallets': 'Wallets',
      'airpods-covers': 'AirPods Covers',
      'car-accessories': 'Car Accessories'
    };
    
    let query = `
      SELECT 
        p.*,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) as primary_image,
        (SELECT COUNT(*) FROM product_images WHERE product_id = p.id) as image_count
      FROM products p
      WHERE 1=1
    `;
    
    const params = [];

    if (category) {
      // Use mapped category name if available, otherwise use as-is
      const dbCategory = categoryMap[category.toLowerCase()] || category;
      query += ` AND p.category = ?`;
      params.push(dbCategory);
    }

    if (search) {
      query += ` AND (p.name ILIKE ? OR p.description ILIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (minPrice) {
      query += ` AND p.price >= ?`;
      params.push(minPrice);
    }

    if (maxPrice) {
      query += ` AND p.price <= ?`;
      params.push(maxPrice);
    }

    query += ' ORDER BY p.created_at DESC';

    const [products] = await db.query(query, params);
    
    // Use primary_image if available, fallback to image_url
    const productsWithImages = products.map(p => ({
      ...p,
      image_url: p.primary_image || p.image_url
    }));

    res.json(productsWithImages);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

/**
 * Get single product with full details
 * Includes: images, colors, models
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get product basic info
    const [products] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = products[0];

    // Get all images
    const [images] = await db.query(
      'SELECT id, image_url, display_order, is_primary FROM product_images WHERE product_id = ? ORDER BY display_order ASC, id ASC',
      [id]
    );

    // Get all colors
    const [colors] = await db.query(
      'SELECT id, color_name, color_hex, display_order FROM product_colors WHERE product_id = ? ORDER BY display_order ASC, id ASC',
      [id]
    );

    // Get all models
    const [models] = await db.query(
      'SELECT id, model_name, display_order FROM product_models WHERE product_id = ? ORDER BY display_order ASC, id ASC',
      [id]
    );

    // Combine all data
    const fullProduct = {
      ...product,
      images: images.length > 0 ? images : (product.image_url ? [{ image_url: product.image_url, is_primary: true }] : []),
      colors: colors,
      models: models
    };

    res.json(fullProduct);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product details' });
  }
});

/**
 * Get products by category
 */
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    // Map URL-friendly category names to database category names
    const categoryMap = {
      'phone-covers': 'Phone Covers',
      'wallets': 'Wallets',
      'airpods-covers': 'AirPods Covers',
      'car-accessories': 'Car Accessories'
    };
    
    // Use mapped category name if available, otherwise use as-is
    const dbCategory = categoryMap[category.toLowerCase()] || category;
    
    const [products] = await db.query(
      `SELECT 
        p.*,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) as primary_image
      FROM products p
      WHERE p.category = ?
      ORDER BY p.created_at DESC`,
      [dbCategory]
    );

    const productsWithImages = products.map(p => ({
      ...p,
      image_url: p.primary_image || p.image_url
    }));

    res.json(productsWithImages);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

module.exports = router;
