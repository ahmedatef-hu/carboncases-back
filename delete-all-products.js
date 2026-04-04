const db = require('./config/database');

async function deleteAllProducts() {
  try {
    console.log('🗑️  Deleting all products...\n');
    
    // First, show current products
    const [products] = await db.query('SELECT id, name, category FROM products ORDER BY id');
    console.log(`Found ${products.length} products:\n`);
    products.forEach(p => {
      console.log(`  - ID ${p.id}: ${p.name} (${p.category})`);
    });
    
    console.log('\n🔥 Deleting all products...');
    
    // Delete all products
    await db.query('DELETE FROM products');
    
    console.log('✅ All products deleted successfully!\n');
    
    // Verify deletion
    const [remaining] = await db.query('SELECT COUNT(*) as count FROM products');
    console.log(`📊 Products remaining: ${remaining[0].count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

deleteAllProducts();
