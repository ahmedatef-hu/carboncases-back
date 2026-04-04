-- ============================================
-- Enhanced Product System Schema
-- Multiple Images, Colors, and iPhone Models
-- ============================================

-- 1. Product Images Table
-- Stores multiple images per product
CREATE TABLE IF NOT EXISTS product_images (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_primary ON product_images(product_id, is_primary);

-- 2. Product Colors Table
-- Stores available colors for each product
CREATE TABLE IF NOT EXISTS product_colors (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  color_name VARCHAR(50) NOT NULL,
  color_hex VARCHAR(7),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(product_id, color_name)
);

CREATE INDEX idx_product_colors_product_id ON product_colors(product_id);

-- 3. Product Models Table (iPhone Models)
-- Stores compatible iPhone models for each product
CREATE TABLE IF NOT EXISTS product_models (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  model_name VARCHAR(100) NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(product_id, model_name)
);

CREATE INDEX idx_product_models_product_id ON product_models(product_id);

-- 4. Update Cart Items Table
-- Add columns for selected color and model
ALTER TABLE cart_items 
ADD COLUMN IF NOT EXISTS selected_color VARCHAR(50),
ADD COLUMN IF NOT EXISTS selected_model VARCHAR(100);

-- 5. Update Order Items Table
-- Add columns for selected color and model
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS selected_color VARCHAR(50),
ADD COLUMN IF NOT EXISTS selected_model VARCHAR(100);

-- ============================================
-- Sample Data for Testing
-- ============================================

-- Example: Add images for product ID 1
-- INSERT INTO product_images (product_id, image_url, display_order, is_primary) VALUES
-- (1, 'https://example.com/image1.jpg', 1, TRUE),
-- (1, 'https://example.com/image2.jpg', 2, FALSE),
-- (1, 'https://example.com/image3.jpg', 3, FALSE);

-- Example: Add colors for product ID 1
-- INSERT INTO product_colors (product_id, color_name, color_hex, display_order) VALUES
-- (1, 'Black', '#000000', 1),
-- (1, 'White', '#FFFFFF', 2),
-- (1, 'Red', '#FF0000', 3);

-- Example: Add iPhone models for product ID 1
-- INSERT INTO product_models (product_id, model_name, display_order) VALUES
-- (1, 'iPhone 15 Pro Max', 1),
-- (1, 'iPhone 15 Pro', 2),
-- (1, 'iPhone 15', 3),
-- (1, 'iPhone 14 Pro Max', 4),
-- (1, 'iPhone 14 Pro', 5);

-- ============================================
-- Useful Queries
-- ============================================

-- Get product with all images, colors, and models
-- SELECT 
--   p.*,
--   json_agg(DISTINCT jsonb_build_object('id', pi.id, 'url', pi.image_url, 'order', pi.display_order, 'isPrimary', pi.is_primary)) FILTER (WHERE pi.id IS NOT NULL) as images,
--   json_agg(DISTINCT jsonb_build_object('id', pc.id, 'name', pc.color_name, 'hex', pc.color_hex)) FILTER (WHERE pc.id IS NOT NULL) as colors,
--   json_agg(DISTINCT jsonb_build_object('id', pm.id, 'name', pm.model_name)) FILTER (WHERE pm.id IS NOT NULL) as models
-- FROM products p
-- LEFT JOIN product_images pi ON p.id = pi.product_id
-- LEFT JOIN product_colors pc ON p.id = pc.product_id
-- LEFT JOIN product_models pm ON p.id = pm.product_id
-- WHERE p.id = 1
-- GROUP BY p.id;

-- ============================================
-- Migration Notes
-- ============================================
-- 1. Run this script on your database
-- 2. Existing products will work without changes
-- 3. New products can use enhanced features
-- 4. Old image_url column in products table is kept for backward compatibility
