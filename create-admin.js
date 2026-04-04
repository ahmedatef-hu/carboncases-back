const bcrypt = require('bcryptjs');
const db = require('./config/database');

async function createAdmin() {
  try {
    console.log('🔧 Creating admin user...');
    
    // Check if admin table exists
    const [tables] = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'admin'
    `);
    
    if (tables.length === 0) {
      console.log('📋 Creating admin table...');
      await db.query(`
        CREATE TABLE admin (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'admin',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Admin table created');
    } else {
      console.log('✅ Admin table already exists');
    }
    
    // Check if admin user exists
    const [existingAdmin] = await db.query(
      'SELECT id FROM admin WHERE email = ?',
      ['admin@carboncases.com']
    );
    
    if (existingAdmin.length > 0) {
      console.log('⚠️  Admin user already exists');
      
      // Update password
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.query(
        'UPDATE admin SET password = ? WHERE email = ?',
        [hashedPassword, 'admin@carboncases.com']
      );
      console.log('✅ Admin password updated');
    } else {
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.query(
        'INSERT INTO admin (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Admin', 'admin@carboncases.com', hashedPassword, 'admin']
      );
      console.log('✅ Admin user created');
    }
    
    console.log('\n📧 Admin Email: admin@carboncases.com');
    console.log('🔑 Admin Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
