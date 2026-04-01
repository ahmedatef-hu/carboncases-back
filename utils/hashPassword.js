// Utility script to generate hashed passwords for admin users
const bcrypt = require('bcryptjs');

const password = process.argv[2] || 'admin123';

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
    return;
  }
  console.log('Password:', password);
  console.log('Hashed:', hash);
  console.log('\nUse this hash in your SQL INSERT statement for admin table');
});

// Usage: node backend/utils/hashPassword.js yourpassword
