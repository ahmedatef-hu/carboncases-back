/**
 * Migration Script: Upload Local Images to Supabase Storage
 * 
 * This script helps migrate images from local storage to Supabase Storage.
 * It will:
 * 1. Find all products with local image URLs (e.g., /uploads/...)
 * 2. Upload those images to Supabase Storage
 * 3. Update the database with new Supabase URLs
 * 
 * Usage: node scripts/migrate-images-to-supabase.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../config/database');
const { uploadImage } = require('../config/supabaseStorage');

async function migrateImages() {
  console.log('🚀 Starting image migration to Supabase Storage...\n');

  try {
    // Get all products with local image URLs
    const [products] = await db.query(
      "SELECT id, name, image_url FROM products WHERE image_url LIKE '/uploads/%' OR image_url LIKE '%localhost%'"
    );

    if (products.length === 0) {
      console.log('✅ No products with local images found. Migration complete!');
      process.exit(0);
    }

    console.log(`📦 Found ${products.length} products with local images\n`);

    let successCount = 0;
    let failCount = 0;
    const uploadsDir = path.join(__dirname, '../uploads');

    for (const product of products) {
      try {
        console.log(`\n📸 Processing: ${product.name} (ID: ${product.id})`);
        console.log(`   Old URL: ${product.image_url}`);

        // Extract filename from URL
        let filename = product.image_url.split('/').pop();
        const filePath = path.join(uploadsDir, filename);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
          console.log(`   ⚠️  File not found: ${filePath}`);
          console.log(`   ℹ️  Skipping... (You'll need to re-upload this image manually)`);
          failCount++;
          continue;
        }

        // Read file
        const fileBuffer = fs.readFileSync(filePath);
        const fileExt = filename.split('.').pop();
        const contentType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;

        // Generate new filename
        const timestamp = Date.now();
        const randomNum = Math.round(Math.random() * 1E9);
        const newFilename = `product-${timestamp}-${randomNum}.${fileExt}`;

        // Upload to Supabase
        console.log(`   📤 Uploading to Supabase...`);
        const publicUrl = await uploadImage(fileBuffer, newFilename, contentType);

        // Update database
        await db.query(
          'UPDATE products SET image_url = ? WHERE id = ?',
          [publicUrl, product.id]
        );

        console.log(`   ✅ Success! New URL: ${publicUrl}`);
        successCount++;

      } catch (error) {
        console.error(`   ❌ Error processing ${product.name}:`, error.message);
        failCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Successfully migrated: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📦 Total processed: ${products.length}`);
    console.log('='.repeat(60));

    if (failCount > 0) {
      console.log('\n⚠️  Some images failed to migrate.');
      console.log('   You can re-upload them manually through the Admin Dashboard.');
    }

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateImages();
