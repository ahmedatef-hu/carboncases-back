require('dotenv').config();
const db = require('./config/database');

async function testCreateProduct() {
  try {
    console.log('🧪 Testing product creation...\n');

    const productData = {
      name: 'Test Product',
      description: 'Test Description',
      category: 'Phone Covers',
      price: 100,
      has_magsafe_option: false,
      stock_quantity: 10,
      image_url: 'https://example.com/image.jpg'
    };

    console.log('📦 Product data:', productData);

    // Start transaction
    console.log('Starting transaction...');
    await db.query('START TRANSACTION');

    // Create product
    const productQuery = `INSERT INTO products (
      name, description, category,
      price, has_magsafe_option, stock_quantity, image_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    const productParams = [
      productData.name,
      productData.description,
      productData.category,
      productData.price,
      productData.has_magsafe_option,
      productData.stock_quantity,
      productData.image_url
    ];

    console.log('Executing query...');
    console.log('Query:', productQuery);
    console.log('Params:', productParams);

    const [result] = await db.query(productQuery, productParams);
    console.log('Result:', result);
    console.log('Insert ID:', result.insertId);

    // Commit
    await db.query('COMMIT');
    console.log('\n✅ Product created successfully with ID:', result.insertId);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Full error:', error);
    
    try {
      await db.query('ROLLBACK');
      console.log('Transaction rolled back');
    } catch (rollbackError) {
      console.error('Rollback error:', rollbackError);
    }
    
    process.exit(1);
  }
}

testCreateProduct();
