-- ============================================
-- COMPLETE DATABASE SCHEMA FOR CARBON CASES
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  google_id VARCHAR(255) UNIQUE,
  profile_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- ============================================
-- 2. ADMIN TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admin (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_email ON admin(email);

-- ============================================
-- 3. EMAIL VERIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS email_verifications (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_email_verifications_code ON email_verifications(code);

-- ============================================
-- 4. PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2), -- Nullable for Phone Covers
  stock INTEGER, -- Nullable, use stock_quantity instead
  category VARCHAR(100),
  image_url TEXT,
  has_magsafe_option BOOLEAN DEFAULT FALSE,
  price_without_magsafe DECIMAL(10, 2),
  price_with_magsafe DECIMAL(10, 2),
  stock_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

-- ============================================
-- 5. PRODUCT IMAGES TABLE
-- Multiple images per product
-- ============================================
CREATE TABLE IF NOT EXISTS product_images (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON product_images(product_id, is_primary);

-- ============================================
-- 6. PRODUCT COLORS TABLE
-- Available colors for each product
-- ============================================
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

CREATE INDEX IF NOT EXISTS idx_product_colors_product_id ON product_colors(product_id);

-- ============================================
-- 7. PRODUCT MODELS TABLE
-- Compatible iPhone models for each product
-- ============================================
CREATE TABLE IF NOT EXISTS product_models (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  model_name VARCHAR(100) NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(product_id, model_name)
);

CREATE INDEX IF NOT EXISTS idx_product_models_product_id ON product_models(product_id);

-- ============================================
-- 8. CART ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER DEFAULT 1,
  magsafe_variant VARCHAR(20),
  selected_color VARCHAR(50),
  selected_model VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- ============================================
-- 9. ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  shipping_address TEXT,
  phone VARCHAR(20),
  payment_method VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- ============================================
-- 10. ORDER ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  magsafe_variant VARCHAR(20),
  selected_color VARCHAR(50),
  selected_model VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- ============================================
-- 11. WISHLIST TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS wishlist (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON wishlist(product_id);

-- ============================================
-- INSERT DEFAULT ADMIN USER
-- Password: admin123 (hashed with bcrypt)
-- ============================================
INSERT INTO admin (name, email, password, role) 
VALUES (
  'Admin', 
  'admin@carboncases.com', 
  '$2a$10$zbzUb7wlxUDtZXQiSk3Au.iJFZer85qMH6u2SLEl.Sa5/pjOMV7bK',
  'admin'
)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- VERIFICATION QUERY
-- Run this to verify all tables were created
-- ============================================
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- ORDER BY table_name;

-- ============================================
-- USEFUL QUERIES
-- ============================================

-- Get product with all details (images, colors, models)
-- SELECT 
--   p.*,
--   COALESCE(
--     json_agg(DISTINCT jsonb_build_object(
--       'id', pi.id, 
--       'url', pi.image_url, 
--       'order', pi.display_order, 
--       'isPrimary', pi.is_primary
--     )) FILTER (WHERE pi.id IS NOT NULL),
--     '[]'
--   ) as images,
--   COALESCE(
--     json_agg(DISTINCT jsonb_build_object(
--       'id', pc.id, 
--       'name', pc.color_name, 
--       'hex', pc.color_hex
--     )) FILTER (WHERE pc.id IS NOT NULL),
--     '[]'
--   ) as colors,
--   COALESCE(
--     json_agg(DISTINCT jsonb_build_object(
--       'id', pm.id, 
--       'name', pm.model_name
--     )) FILTER (WHERE pm.id IS NOT NULL),
--     '[]'
--   ) as models
-- FROM products p
-- LEFT JOIN product_images pi ON p.id = pi.product_id
-- LEFT JOIN product_colors pc ON p.id = pc.product_id
-- LEFT JOIN product_models pm ON p.id = pm.product_id
-- WHERE p.id = 1
-- GROUP BY p.id;

-- Get all orders with user details
-- SELECT 
--   o.*,
--   u.name as user_name,
--   u.email as user_email,
--   COUNT(oi.id) as items_count
-- FROM orders o
-- JOIN users u ON o.user_id = u.id
-- LEFT JOIN order_items oi ON o.id = oi.order_id
-- GROUP BY o.id, u.name, u.email
-- ORDER BY o.created_at DESC;

-- Get user's cart with product details
-- SELECT 
--   ci.*,
--   p.name as product_name,
--   p.price,
--   p.image_url,
--   p.has_magsafe_option,
--   p.price_without_magsafe,
--   p.price_with_magsafe
-- FROM cart_items ci
-- JOIN products p ON ci.product_id = p.id
-- WHERE ci.user_id = 1;

-- ============================================
-- NOTES
-- ============================================
-- 1. All tables use SERIAL for auto-increment IDs
-- 2. Foreign keys have ON DELETE CASCADE for automatic cleanup
-- 3. Indexes are created for frequently queried columns
-- 4. Default admin user is created with email: admin@carboncases.com
-- 5. Password for admin: admin123
-- 6. All timestamps use CURRENT_TIMESTAMP
-- 7. Product images, colors, and models are in separate tables for flexibility
-- 8. Cart and order items support MagSafe variants and color/model selection
