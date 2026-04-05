const fs = require('fs');

// Read the file
let lines = fs.readFileSync('routes/admin.js', 'utf8').split('\n');

// Find the line with "}); console.error" and remove it and the next 3 lines
let newLines = [];
let skip = 0;

for (let i = 0; i < lines.length; i++) {
  if (skip > 0) {
    skip--;
    continue;
  }
  
  if (lines[i].includes('}); console.error(\'Error fetching stats:\'')) {
    // Skip this line and the next 3 lines
    skip = 3;
    continue;
  }
  
  newLines.push(lines[i]);
}

// Write back
fs.writeFileSync('routes/admin.js', newLines.join('\n'), 'utf8');

console.log('✅ Fixed admin.js - removed', lines.length - newLines.length, 'lines');
