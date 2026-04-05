const fs = require('fs');

// Read the file
let content = fs.readFileSync('routes/admin.js', 'utf8');

// Find and remove the duplicate lines after the stats endpoint
// The pattern is: }); console.error('Error fetching stats:', error);
//     res.status(500).json({ message: 'Error fetching statistics' });
//   }
// }); });

const badPattern = /\}\); console\.error\('Error fetching stats:', error\);\s+res\.status\(500\)\.json\(\{ message: 'Error fetching statistics' \}\);\s+\}\s+\}\); \}\);/g;

content = content.replace(badPattern, '});');

// Write back
fs.writeFileSync('routes/admin.js', content, 'utf8');

console.log('✅ Fixed admin.js');
