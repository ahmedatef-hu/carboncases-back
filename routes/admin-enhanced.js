const express = require('express');
const router = express.Router();
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateAdmin } = require('../middleware/auth');
const { uploadImage, deleteImage } = require('../config/supabaseStorage');

// Configure multer for multiple file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max per file
    files: 10 // Max 10 files
  },
  fileFilter: function (req, file, cb) {
    console.log('📁 File upload attempt:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    const allowedTypes = /jpeg|jpg|png|gif|webp/i;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    console.log('🔍 Validation:', { extname, mimetype });
    
    if (mimetype && extname) {
      console.log('✅ File accepted');
      return cb(null, true);
    } else {
      console.log('❌ File rejected');
      cb(new Error(`Only image files are allowed! Got: ${file.mimetype}`));
    }
  }
});

/**
 * Upload multiple images
 * POST /api/admin/upload-images
 */
router.post('/upload-images', authenticateAdmin, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    
    console.log(`📤 Uploading ${req.files.length} images to Supabase Storage...`);
    
    const uploadPromises = req.files.map(async (file) => {
      const timestamp = Date.now();
      const randomNum = Math.round(Math.random() * 1E9);
      const fileExt = file.originalname.split('.').pop();
      const fileName = `product-${timestamp}-${randomNum}.${fileExt}`;
      
      const publicUrl = await uploadImage(
        file.buffer,
        fileName,
        file.mimetype
      );
      
      return publicUrl;
    });
    
    const urls = await Promise.all(uploadPromises);
    
    console.log(`✅ ${urls.length} images uploaded successfully`);
    
    res.json({ 
      message: 'Images uploaded successfully',
      urls: urls
    });
  } catch (error) {
    console.error('❌ Error uploading images:', error);
    res.status(500).json({ 
      message: 'Error uploading images',
      error: error.message 
    });
  }
});

/**
 * Create product with images, colors, and models
 * POST /api/admin/products/enhanced
 */
router.post('/products/enhanced', authenticateAdmin, async (req, res) => {
  try {
    const { 
      name, 
      description, 
      price, 
      stock, 
      category,
      has_magsafe_option,
      price_without_magsafe,
      price_with_magsafe,
      images, // Array of image URLs
      colors, // Array of {name, hex}
      models  // Array of model names
    } = req.body;

    console.log('📦 Creating enhanced product:', { name, images: images?.length, colors: colors?.length, models: models?.length });

    // Start transaction
    await db.query('BEGIN');

    try {
      // 1. Create product
      const [productResult] = await db.query(
        `INSERT INTO products (
          name, description, price, stock, category,
          has_magsafe_option, price_without_magsafe, price_with_magsafe,
          image_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
        [
          name, 
          description, 
          price, 
          stock, 
          category,
          has_magsafe_option || false,
          price_without_magsafe || null,
          price_with_magsafe || null,
          images && images.length > 0 ? images[0] : null // First image as fallback
        ]
      );

      const productId = productResult[0].id;
      console.log('✅ Product created with ID:', productId);

      // 2. Insert images
      if (images && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          await db.query(
            'INSERT INTO product_images (product_id, image_url, display_order, is_primary) VALUES (?, ?, ?, ?)',
            [productId, images[i], i + 1, i === 0]
          );
        }
        console.log(`✅ ${images.length} images added`);
      }

      // 3. Insert colors
      if (colors && colors.length > 0) {
        for (let i = 0; i < colors.length; i++) {
          await db.query(
            'INSERT INTO product_colors (product_id, color_name, color_hex, display_order) VALUES (?, ?, ?, ?)',
            [productId, colors[i].name, colors[i].hex || null, i + 1]
          );
        }
        console.log(`✅ ${colors.length} colors added`);
      }

      // 4. Insert models
      if (models && models.length > 0) {
        for (let i = 0; i < models.length; i++) {
          await db.query(
            'INSERT INTO product_models (product_id, model_name, display_order) VALUES (?, ?, ?)',
            [productId, models[i], i + 1]
          );
        }
        console.log(`✅ ${models.length} models added`);
      }

      // Commit transaction
      await db.query('COMMIT');

      res.status(201).json({
        message: 'Product created successfully',
        productId: productId
      });

    } catch (error) {
      // Rollback on error
      await db.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('❌ Error creating product:', error);
    res.status(500).json({ 
      message: 'Error creating product',
      error: error.message 
    });
  }
});

/**
 * Update product with images, colors, and models
 * PUT /api/admin/products/enhanced/:id
 */
router.put('/products/enhanced/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      price, 
      stock, 
      category,
      has_magsafe_option,
      price_without_magsafe,
      price_with_magsafe,
      images, // Array of image URLs
      colors, // Array of {name, hex}
      models  // Array of model names
    } = req.body;

    console.log('📝 Updating enhanced product:', id);

    // Start transaction
    await db.query('BEGIN');

    try {
      // 1. Update product basic info
      await db.query(
        `UPDATE products SET 
          name = ?, 
          description = ?, 
          price = ?, 
          stock = ?, 
          category = ?,
          has_magsafe_option = ?,
          price_without_magsafe = ?,
          price_with_magsafe = ?,
          image_url = ?
        WHERE id = ?`,
        [
          name, 
          description, 
          price, 
          stock, 
          category,
          has_magsafe_option || false,
          price_without_magsafe || null,
          price_with_magsafe || null,
          images && images.length > 0 ? images[0] : null,
          id
        ]
      );

      // 2. Update images (delete old, insert new)
      if (images !== undefined) {
        // Get old images to delete from Supabase
        const [oldImages] = await db.query(
          'SELECT image_url FROM product_images WHERE product_id = ?',
          [id]
        );
        
        // Delete old images from database
        await db.query('DELETE FROM product_images WHERE product_id = ?', [id]);
        
        // Delete old images from Supabase (async, don't wait)
        oldImages.forEach(img => {
          if (img.image_url && img.image_url.includes('supabase.co')) {
            deleteImage(img.image_url).catch(err => console.error('Error deleting image:', err));
          }
        });
        
        // Insert new images
        if (images && images.length > 0) {
          for (let i = 0; i < images.length; i++) {
            await db.query(
              'INSERT INTO product_images (product_id, image_url, display_order, is_primary) VALUES (?, ?, ?, ?)',
              [id, images[i], i + 1, i === 0]
            );
          }
        }
        console.log(`✅ Images updated`);
      }

      // 3. Update colors
      if (colors !== undefined) {
        await db.query('DELETE FROM product_colors WHERE product_id = ?', [id]);
        
        if (colors && colors.length > 0) {
          for (let i = 0; i < colors.length; i++) {
            await db.query(
              'INSERT INTO product_colors (product_id, color_name, color_hex, display_order) VALUES (?, ?, ?, ?)',
              [id, colors[i].name, colors[i].hex || null, i + 1]
            );
          }
        }
        console.log(`✅ Colors updated`);
      }

      // 4. Update models
      if (models !== undefined) {
        await db.query('DELETE FROM product_models WHERE product_id = ?', [id]);
        
        if (models && models.length > 0) {
          for (let i = 0; i < models.length; i++) {
            await db.query(
              'INSERT INTO product_models (product_id, model_name, display_order) VALUES (?, ?, ?)',
              [id, models[i], i + 1]
            );
          }
        }
        console.log(`✅ Models updated`);
      }

      // Commit transaction
      await db.query('COMMIT');

      res.json({ message: 'Product updated successfully' });

    } catch (error) {
      // Rollback on error
      await db.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('❌ Error updating product:', error);
    res.status(500).json({ 
      message: 'Error updating product',
      error: error.message 
    });
  }
});

/**
 * Get product with full details (images, colors, models)
 * GET /api/admin/products/enhanced/:id
 */
router.get('/products/enhanced/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Get product
    const [products] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
    
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = products[0];

    // Get images
    const [images] = await db.query(
      'SELECT id, image_url, display_order, is_primary FROM product_images WHERE product_id = ? ORDER BY display_order ASC',
      [id]
    );

    // Get colors
    const [colors] = await db.query(
      'SELECT id, color_name, color_hex FROM product_colors WHERE product_id = ? ORDER BY display_order ASC',
      [id]
    );

    // Get models
    const [models] = await db.query(
      'SELECT id, model_name FROM product_models WHERE product_id = ? ORDER BY display_order ASC',
      [id]
    );

    res.json({
      ...product,
      images: images.map(img => img.image_url),
      colors: colors.map(c => ({ name: c.color_name, hex: c.color_hex })),
      models: models.map(m => m.model_name)
    });

  } catch (error) {
    console.error('❌ Error fetching product:', error);
    res.status(500).json({ 
      message: 'Error fetching product',
      error: error.message 
    });
  }
});

/**
 * Delete product image
 * DELETE /api/admin/products/:productId/images/:imageId
 */
router.delete('/products/:productId/images/:imageId', authenticateAdmin, async (req, res) => {
  try {
    const { productId, imageId } = req.params;

    // Get image URL
    const [images] = await db.query(
      'SELECT image_url FROM product_images WHERE id = ? AND product_id = ?',
      [imageId, productId]
    );

    if (images.length === 0) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Delete from database
    await db.query('DELETE FROM product_images WHERE id = ?', [imageId]);

    // Delete from Supabase
    if (images[0].image_url && images[0].image_url.includes('supabase.co')) {
      await deleteImage(images[0].image_url);
    }

    res.json({ message: 'Image deleted successfully' });

  } catch (error) {
    console.error('❌ Error deleting image:', error);
    res.status(500).json({ 
      message: 'Error deleting image',
      error: error.message 
    });
  }
});

module.exports = router;
