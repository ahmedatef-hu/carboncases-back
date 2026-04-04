const db = require('./config/database');

async function createTables() {
  try {
    console.log('📋 Creating enhanced product tables...');
    
    // 1. Create product_images table
    console.log('\n🔄 Creating product_images table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL,
        image_url TEXT NOT NULL,
        display_order INTEGER DEFAULT 0,
        is_primary BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ product_images table created');
    
    // Create indexes
    await db.query('CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_product_images_primary ON product_images(product_id, is_primary)');
    console.log('✅ Indexes created');
    
    // 2. Create product_colors table
    console.log('\n🔄 Creating product_colors table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS product_colors (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL,
        color_name VARCHAR(50) NOT NULL,
        color_hex VARCHAR(7),
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE(product_id, color_name)
      )
    `);
    console.log('✅ product_colors table created');
    
    await db.query('CREATE INDEX IF NOT EXISTS idx_product_colors_product_id ON product_colors(product_id)');
    console.log('✅ Indexes created');
    
    // 3. Create product_models table
    console.log('\n🔄 Creating product_models table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS product_models (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL,
        model_name VARCHAR(100) NOT NULL,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE(product_id, model_name)
      )
    `);
    console.log('✅ product_models table created');
    
    await db.query('CREATE INDEX IF NOT EXISTS idx_product_models_product_id ON product_models(product_id)');
    console.log('✅ Indexes created');
    
    // 4. Update cart_items table
    console.log('\n🔄 Updating cart_items table...');
    try {
      await db.query('ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS selected_color VARCHAR(50)');
      await db.query('ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS selected_model VARCHAR(100)');
      console.log('✅ cart_items table updated');
    } catch (error) {
      console.log('⚠️  cart_items columns may already exist');
    }
    
    // 5. Update order_items table
    console.log('\n🔄 Updating order_items table...');
    try {
      await db.query('ALTER TABLE order_items ADD COLUMN IF NOT EXISTS selected_color VARCHAR(50)');
      await db.query('ALTER TABLE order_items ADD COLUMN IF NOT EXISTS selected_model VARCHAR(100)');
      console.log('✅ order_items table updated');
    } catch (error) {
      console.log('⚠️  order_items columns may already exist');
    }
    
    // Verify tables
    console.log('\n🔍 Verifying tables...');
    const [tables] = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('product_images', 'product_colors', 'product_models')
      ORDER BY table_name
    `);
    
    console.log('✅ Tables found:', tables.map(t => t.table_name).join(', '));
    
    console.log('\n✅ All tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    process.exit(1);
  }
}

createTables();
