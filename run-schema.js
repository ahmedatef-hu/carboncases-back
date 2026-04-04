const fs = require('fs');
const path = require('path');
const db = require('./config/database');

async function runSchema() {
  try {
    console.log('📋 Running schema enhancements...');
    
    // Read SQL file
    const sqlPath = path.join(__dirname, 'database', 'schema-enhancements.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolon and filter out comments and empty lines
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length > 0) {
        console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}...`);
        console.log(statement.substring(0, 100) + '...');
        
        try {
          await db.query(statement);
          console.log('✅ Success');
        } catch (error) {
          // Ignore "already exists" errors
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log('⚠️  Already exists, skipping');
          } else {
            console.error('❌ Error:', error.message);
          }
        }
      }
    }
    
    console.log('\n✅ Schema enhancements completed!');
    
    // Verify tables exist
    console.log('\n🔍 Verifying tables...');
    const [tables] = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('product_images', 'product_colors', 'product_models')
      ORDER BY table_name
    `);
    
    console.log('📋 Tables found:', tables.map(t => t.table_name).join(', '));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running schema:', error);
    process.exit(1);
  }
}

runSchema();
