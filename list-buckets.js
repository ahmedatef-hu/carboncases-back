require('dotenv').config();
const { supabase } = require('./config/supabaseStorage');

async function listBuckets() {
  try {
    console.log('🔍 Listing Supabase Storage buckets...\n');

    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }

    if (data && data.length > 0) {
      console.log('📦 Available buckets:');
      data.forEach((bucket, idx) => {
        console.log(`  ${idx + 1}. "${bucket.name}" (ID: ${bucket.id})`);
        console.log(`     Public: ${bucket.public}`);
        console.log(`     Created: ${bucket.created_at}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No buckets found');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listBuckets();
