const axios = require('axios');

async function testAPIUpdate() {
  try {
    console.log('Testing API update endpoint...\n');
    
    const productId = 2; // iPhone 15 Pro Max
    const updateData = {
      name: 'Carbon Fiber iPhone 15 Pro Max Case',
      price: 54.99,
      stock: 120,
      price_without_magsafe: 400,
      price_with_magsafe: 564,
      has_magsafe_option: true
    };
    
    console.log('Sending PUT request to:', `http://localhost:5000/api/admin/products/${productId}`);
    console.log('Data:', JSON.stringify(updateData, null, 2));
    
    const response = await axios.put(
      `http://localhost:5000/api/admin/products/${productId}`,
      updateData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('\n✅ Response:', response.data);
    
    // Verify the update
    const db = require('./config/database');
    const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [productId]);
    console.log('\n📊 Product after update:');
    console.log(rows[0]);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

testAPIUpdate();
