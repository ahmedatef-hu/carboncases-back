const db = require('./config/database');

async function checkProducts() {
  try {
    const [products] = await db.query('SELECT * FROM products');
    
    console.log('=== Products in Database ===\n');
    
    products.forEach(p => {
      console.log(`ID: ${p.id}`);
      console.log(`Name: ${p.name}`);
      console.log(`Category: ${p.category}`);
      console.log(`Price: ${p.price}`);
      console.log(`Stock: ${p.stock}`);
      console.log(`Has MagSafe: ${p.has_magsafe_option}`);
      console.log(`Without MagSafe: ${p.price_without_magsafe}`);
      console.log(`With MagSafe: ${p.price_with_magsafe}`);
      console.log('---\n');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkProducts();
