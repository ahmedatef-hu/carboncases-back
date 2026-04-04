-- ============================================
-- CARBON CASES - RESTRUCTURED DATABASE SCHEMA
-- ============================================

-- Drop existing tables if restructuring
-- DROP TABLE IF EXISTS order_items CASCADE;
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP TABLE IF EXISTS cart_items CASCADE;
-- DROP TABLE IF EXISTS wishlist CASCADE;
-- DROP TABLE IF EXISTS product_models CASCADE;
-- DROP TABLE IF EXISTS product_colors CASCADE;
-- DROP TABLE IF EXISTS product_images CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;

-- ============================================
-- 1. PRODUCTS TABLE (RESTRUCTURED)
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Phone Covers', 'Wallets', 'AirPods Covers', 'Car Accessories')),
    
    -- Pricing (for Phone Covers with MagSafe options)
    price_without_magsafe DECIMAL(10, 2),
    price_with_magsafe DECIMAL(10, 2),
    
    -- Stock
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    
    -- Legacy fields (for backward compatibility)
    price DECIMAL(10, 2), -- Used for non-phone-cover products
    image_url TEXT, -- Fallback image
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- ============================================
-- 2. PRODUCT IMAGES (MULTIPLE IMAGES)
-- ============================================
CREATE TABLE IF NOT EXISTS product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 1,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_display_order ON product_images(product_id, display_order);

-- ============================================
-- 3. PRODUCT COLORS
-- ============================================
CREATE TABLE IF NOT EXISTS product_colors (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    color_name VARCHAR(100) NOT NULL,
    color_hex VARCHAR(7), -- e.g., #FF5733
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_colors_product_id ON product_colors(product_id);

-- ============================================
-- 4. PRODUCT MODELS
-- ============================================
CREATE TABLE IF NOT EXISTS product_models (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    model_name VARCHAR(100) NOT NULL,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_models_product_id ON product_models(product_id);

-- ============================================
-- 5. CART ITEMS (UPDATED)
-- ============================================
CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    
    -- User selections
    selected_color VARCHAR(100),
    selected_model VARCHAR(100),
    magsafe_option BOOLEAN DEFAULT FALSE, -- true = with MagSafe, false = without
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- ============================================
-- 6. ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Order details
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    
    -- Shipping info
    shipping_address TEXT NOT NULL,
    shipping_city VARCHAR(100),
    shipping_phone VARCHAR(20),
    
    -- Payment
    payment_method VARCHAR(50) DEFAULT 'cash_on_delivery',
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- ============================================
-- 7. ORDER ITEMS (UPDATED)
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE SET NULL,
    
    -- Product snapshot at time of purchase
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    price_at_purchase DECIMAL(10, 2) NOT NULL,
    
    -- User selections
    selected_color VARCHAR(100),
    selected_model VARCHAR(100),
    magsafe_option BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- ============================================
-- 8. WISHLIST
-- ============================================
CREATE TABLE IF NOT EXISTS wishlist (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON wishlist(product_id);

-- ============================================
-- MIGRATION: Update existing products table
-- ============================================
-- Add new columns if they don't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_without_magsafe DECIMAL(10, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_with_magsafe DECIMAL(10, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;

-- Update category values to match new enum
UPDATE products SET category = 'Phone Covers' WHERE category = 'phone-covers';
UPDATE products SET category = 'Wallets' WHERE category = 'wallets';
UPDATE products SET category = 'AirPods Covers' WHERE category = 'airpods-covers';
UPDATE products SET category = 'Car Accessories' WHERE category = 'car-accessories';

-- Migrate old has_magsafe_option to new structure
UPDATE products 
SET 
    price_without_magsafe = price,
    price_with_magsafe = price + 100
WHERE category = 'Phone Covers' AND price_without_magsafe IS NULL;

-- For non-phone-cover products, keep using the price field
UPDATE products 
SET price = COALESCE(price, price_without_magsafe, 0)
WHERE category != 'Phone Covers';

-- Update cart_items and order_items
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS magsafe_option BOOLEAN DEFAULT FALSE;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS magsafe_option BOOLEAN DEFAULT FALSE;

-- ============================================
-- DONE!
-- ============================================
