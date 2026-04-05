require('dotenv').config();
const db = require('./config/database');

async function checkImages() {
  try {
    console.log('🔍 Checking product images...\n');

    const [products] = await db.query(`
      SELECT id, name, image_url
      FROM products 
      ORDER BY id DESC
      LIMIT 5
    `);

    for (const product of products) {
      console.log(`\n📦 Product: ${product.name} (ID: ${product.id})`);
      console.log(`   Main image_url: ${product.image_url || 'NULL'}`);
      
      const [images] = await db.query(`
        SELECT id, image_url, is_primary, display_order
        FROM product_images 
        WHERE product_id = ?
        ORDER BY display_order ASC
      `, [product.id]);
      
      if (images.length > 0) {
        console.log(`   📸 Images in product_images table:`);
        images.forEach((img, idx) => {
          console.log(`      ${idx + 1}. ${img.is_primary ? '⭐' : '  '} ${img.image_url}`);
        });
      } else {
        console.log(`   ⚠️  No images in product_images table`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkImages();
