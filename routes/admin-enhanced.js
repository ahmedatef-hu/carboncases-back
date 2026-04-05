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
    files: 15 // Max 15 files
  },
  fileFilter: function (req, file, cb) {
    console.log('📁 File upload attempt:', {
      originalname: file.originalname,
      mimetype: file.mimetype
    });
    
    // Accept any image type
    if (file.mimetype.startsWith('image/')) {
      console.log('✅ File accepted');
      return cb(null, true);
    } else {
      console.log('❌ File rejected - not an image');
      cb(new Error(`Only image files are allowed! Got: ${file.mimetype}`));
    }
  }
});

/**
 * Upload multiple images
 * POST /api/admin/upload-images
 */
router.post('/upload-images', authenticateAdmin, upload.array('images', 15), async (req, res) => {
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
      category,
      price_without_magsafe,
      price_with_magsafe,
      price,
      stock_quantity,
      images, // Array of image URLs
      colors, // Array of color names
      models  // Array of model names
    } = req.body;

    console.log('📦 Creating enhanced product:', { 
      name, 
      category, 
      stock_quantity,
      stock_quantity_type: typeof stock_quantity,
      images: images?.length, 
      colors: colors?.length, 
      models: models?.length 
    });
    console.log('📊 Full request body:', JSON.stringify(req.body, null, 2));

    // Start transaction
    await db.query('BEGIN');

    try {
      // 1. Create product
      let productQuery, productParams;
      
      if (category === 'Phone Covers') {
        // Phone Covers use MagSafe pricing
        productQuery = `INSERT INTO products (
          name, description, category,
          price_without_magsafe, price_with_magsafe,
          has_magsafe_option, stock_quantity, image_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`;
        
        productParams = [
          name, 
          description, 
          category,
          price_without_magsafe,
          price_with_magsafe,
          true, // has_magsafe_option = true for Phone Covers
          stock_quantity || 0,
          images && images.length > 0 ? images[0] : null
        ];
        
        console.log('📝 Phone Cover params:', productParams);
      } else {
        // Other categories use single price
        productQuery = `INSERT INTO products (
          name, description, category,
          price, stock_quantity, image_url
        ) VALUES (?, ?, ?, ?, ?, ?) RETURNING id`;
        
        productParams = [
          name, 
          description, 
          category,
          price,
          stock_quantity || 0,
          images && images.length > 0 ? images[0] : null
        ];
        
        console.log('📝 Other category params:', productParams);
      }

      const [productResult] = await db.query(productQuery, productParams);
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
          const colorName = typeof colors[i] === 'string' ? colors[i] : colors[i].name;
          const colorHex = typeof colors[i] === 'object' ? colors[i].hex : null;
          await db.query(
            'INSERT INTO product_colors (product_id, color_name, color_hex, display_order) VALUES (?, ?, ?, ?)',
            [productId, colorName, colorHex, i + 1]
          );
        }
        console.log(`✅ ${colors.length} colors added`);
      }

      // 4. Insert models
      if (models && models.length > 0) {
        for (let i = 0; i < models.length; i++) {
          const modelName = typeof models[i] === 'string' ? models[i] : models[i].model_name;
          await db.query(
            'INSERT INTO product_models (product_id, model_name, display_order) VALUES (?, ?, ?)',
            [productId, modelName, i + 1]
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
      stock_quantity, // Changed from stock
      category,
      has_magsafe_option,
      price_without_magsafe,
      price_with_magsafe,
      images, // Array of image URLs
      colors, // Array of {name, hex}
      models  // Array of model names
    } = req.body;

    console.log('📝 Updating enhanced product:', id);
    console.log('📊 Update data:', { 
      name, 
      category, 
      stock_quantity,
      stock_quantity_type: typeof stock_quantity 
    });

    // Start transaction
    await db.query('BEGIN');

    try {
      // 1. Update product basic info
      await db.query(
        `UPDATE products SET 
          name = ?, 
          description = ?, 
          price = ?, 
          stock_quantity = ?, 
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
          stock_quantity || 0, 
          category,
          has_magsafe_option || false,
          price_without_magsafe || null,
          price_with_magsafe || null,
          images && images.length > 0 ? images[0] : null,
          id
        ]
      );
      
      console.log('✅ Product basic info updated');

      // 2. Update images (delete old, insert new)
      if (images !== undefined) {
        // Get old images to delete from Supabase
        const [oldImages] = await db.query(
          'SELECT image_url FROM product_images WHERE product_id = ?',
          [id]
        );
        
        // Find images that are being removed (not in new images array)
        const imagesToDelete = oldImages.filter(
          oldImg => !images.includes(oldImg.image_url)
        );
        
        // Delete old images from database
        await db.query('DELETE FROM product_images WHERE product_id = ?', [id]);
        
        // Delete only removed images from Supabase (async, don't wait)
        imagesToDelete.forEach(img => {
          if (img.image_url && img.image_url.includes('supabase.co')) {
            console.log(`🗑️  Deleting removed image: ${img.image_url.substring(img.image_url.lastIndexOf('/') + 1)}`);
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
        console.log(`✅ Images updated (${images.length} images, ${imagesToDelete.length} deleted)`);
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
