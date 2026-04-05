require('dotenv').config();
const https = require('https');

const imageUrl = 'https://pbnbbtxugtoedovgvqst.supabase.co/storage/v1/object/public/Carbon%20casses%20img/product-1775326046880-590320608.jpeg';

console.log('🔍 Testing image URL...');
console.log('URL:', imageUrl);

https.get(imageUrl, (res) => {
  console.log('\n📊 Response:');
  console.log('Status Code:', res.statusCode);
  console.log('Content-Type:', res.headers['content-type']);
  console.log('Content-Length:', res.headers['content-length']);
  
  if (res.statusCode === 200) {
    console.log('\n✅ Image is accessible!');
  } else {
    console.log('\n❌ Image is NOT accessible!');
  }
  
  process.exit(0);
}).on('error', (err) => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
