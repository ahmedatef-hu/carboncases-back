const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function checkAdmin() {
  try {
    console.log('🔍 Checking admin user...');
    
    // Check if admin exists
    const [admins] = await db.query('SELECT * FROM admin WHERE email = ?', ['admin@carboncases.com']);
    
    if (admins.length === 0) {
      console.log('❌ Admin user not found!');
      console.log('📝 Creating admin user...');
      
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.query(
        'INSERT INTO admin (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Admin', 'admin@carboncases.com', hashedPassword, 'admin']
      );
      
      console.log('✅ Admin user created');
    } else {
      console.log('✅ Admin user found:', {
        id: admins[0].id,
        name: admins[0].name,
        email: admins[0].email,
        role: admins[0].role
      });
      
      // Test password
      const isValid = await bcrypt.compare('admin123', admins[0].password);
      console.log('🔑 Password test:', isValid ? '✅ Valid' : '❌ Invalid');
      
      if (!isValid) {
        console.log('📝 Updating password...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await db.query(
          'UPDATE admin SET password = ? WHERE email = ?',
          [hashedPassword, 'admin@carboncases.com']
        );
        console.log('✅ Password updated');
      }
    }
    
    console.log('\n📧 Admin Email: admin@carboncases.com');
    console.log('🔑 Admin Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAdmin();
