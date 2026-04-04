const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function updateAdmin() {
  try {
    console.log('🔧 Updating admin credentials...');
    
    const newEmail = 'admin@example.com';
    const newPassword = 'Admin@2024';
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update admin
    await db.query(
      'UPDATE admin SET email = ?, password = ? WHERE id = 1',
      [newEmail, hashedPassword]
    );
    
    console.log('✅ Admin credentials updated successfully!');
    console.log('\n📧 New Admin Email:', newEmail);
    console.log('🔑 New Admin Password:', newPassword);
    console.log('\n⚠️  Please save these credentials!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateAdmin();
