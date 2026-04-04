const fs = require('fs');
const path = require('path');

// Read the file
const filePath = path.join(__dirname, 'routes', 'admin-enhanced.js');
let content = fs.readFileSync(filePath, 'utf8');

// Replace all $1, $2, $3, etc. with ?
content = content.replace(/\$\d+/g, '?');

// Write back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed admin-enhanced.js queries');
