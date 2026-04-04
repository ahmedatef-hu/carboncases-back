require('dotenv').config();
const db = require('./config/database');

async function fixPriceColumn() {
  try {
    console.log('🔧 Fixing price column to allow NULL...\n');

    // Make price column nullable
    await db.query('ALTER TABLE products ALTER COLUMN price DROP NOT NULL');
    console.log('✅ Price column is now nullable');

    // Also make stock nullable (use stock_quantity instead)
    await db.query('ALTER TABLE products ALTER COLUMN stock DROP NOT NULL');
    console.log('✅ Stock column is now nullable');

    console.log('\n✅ Done! You can now create Phone Covers without a price field.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixPriceColumn();
