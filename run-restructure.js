require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./config/database');

async function runRestructure() {
  try {
    console.log('🔄 Starting database restructure...\n');

    // Read SQL file
    const sqlPath = path.join(__dirname, 'database', 'restructure-schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split by semicolon and filter out empty statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments
      if (statement.startsWith('--')) continue;
      
      try {
        await db.query(statement);
        console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
      } catch (error) {
        // Ignore "already exists" errors
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate')) {
          console.log(`⚠️  Statement ${i + 1}/${statements.length} skipped (already exists)`);
        } else {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          console.error('Statement:', statement.substring(0, 100) + '...');
        }
      }
    }

    console.log('\n✅ Database restructure completed!');
    console.log('\n📊 Verifying tables...');

    // Verify tables
    const [tables] = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log('\n📋 Available tables:');
    tables.forEach(t => console.log(`   - ${t.table_name}`));

    // Check products structure
    const [columns] = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'products'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Products table structure:');
    columns.forEach(c => {
      console.log(`   - ${c.column_name} (${c.data_type}) ${c.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

runRestructure();
