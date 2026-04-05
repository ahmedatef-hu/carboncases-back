require('dotenv').config();
const { supabase } = require('./config/supabaseStorage');

async function createBucket() {
  try {
    const bucketName = 'carbon-cases-images'; // بدون مسافات

    console.log(`🔨 Creating bucket: "${bucketName}"...\n`);

    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/jfif']
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Bucket already exists');
      } else {
        console.error('❌ Error creating bucket:', error);
        process.exit(1);
      }
    } else {
      console.log('✅ Bucket created successfully!');
      console.log('   Name:', bucketName);
      console.log('   Public: true');
    }

    // Set public policy
    console.log('\n📝 Setting public access policy...');
    
    // Note: You may need to set policies manually in Supabase dashboard
    console.log('\n⚠️  IMPORTANT: Go to Supabase Dashboard → Storage → Policies');
    console.log('   And add these policies for bucket "' + bucketName + '":');
    console.log('   1. SELECT policy: Allow public read access');
    console.log('   2. INSERT policy: Allow authenticated uploads');
    console.log('   3. DELETE policy: Allow authenticated deletes');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createBucket();
