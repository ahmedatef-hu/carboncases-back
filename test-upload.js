require('dotenv').config();
const { uploadImage } = require('./config/supabaseStorage');
const fs = require('fs');

async function testUpload() {
  try {
    console.log('🧪 Testing image upload...\n');
    
    // Create a simple test buffer
    const testBuffer = Buffer.from('test image data');
    const fileName = `test-${Date.now()}.txt`;
    
    console.log('📤 Uploading test file:', fileName);
    const url = await uploadImage(testBuffer, fileName, 'text/plain');
    
    console.log('✅ Upload successful!');
    console.log('📍 URL:', url);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testUpload();
