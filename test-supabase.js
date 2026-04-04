require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Testing Supabase Configuration...\n');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('📍 Supabase URL:', supabaseUrl);
console.log('🔑 Supabase Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NOT SET');

if (!supabaseKey || supabaseKey === 'YOUR_SUPABASE_ANON_KEY_HERE') {
  console.log('\n❌ ERROR: Supabase ANON_KEY not configured!');
  console.log('\n📋 Steps to fix:');
  console.log('1. Go to: https://supabase.com/dashboard/project/pbnbbtxugtoedovgvqst/settings/api');
  console.log('2. Copy the "anon public" key');
  console.log('3. Update backend/.env file with the correct key');
  console.log('4. Run this script again\n');
  process.exit(1);
}

try {
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('\n✅ Supabase client created successfully!');
  
  // Test storage bucket access
  console.log('\n🪣 Testing storage bucket access...');
  
  supabase.storage
    .from('images')
    .list('', { limit: 1 })
    .then(({ data, error }) => {
      if (error) {
        console.log('❌ Storage bucket error:', error.message);
        console.log('\n📋 Possible issues:');
        console.log('1. The "images" bucket does not exist');
        console.log('2. The bucket is not public');
        console.log('3. The API key does not have permission');
        console.log('\n🔧 To fix:');
        console.log('1. Go to: https://supabase.com/dashboard/project/pbnbbtxugtoedovgvqst/storage/buckets');
        console.log('2. Create a bucket named "images" if it doesn\'t exist');
        console.log('3. Make it public by clicking the bucket settings');
      } else {
        console.log('✅ Storage bucket "images" is accessible!');
        console.log(`📦 Found ${data.length} items in bucket`);
        console.log('\n🎉 Everything is working! You can now upload images.');
      }
    })
    .catch(err => {
      console.log('❌ Unexpected error:', err.message);
    });
    
} catch (error) {
  console.log('\n❌ Error creating Supabase client:', error.message);
}
