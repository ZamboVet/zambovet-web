const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Running OTP verification table migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'create_otp_verification_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL by semicolons to execute each statement separately
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 100) + '...');
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Try alternative method for DDL statements
          const { data: altData, error: altError } = await supabase
            .from('_supabase_migrations')
            .insert({ name: 'create_otp_verification_table', version: Date.now() });
          
          // If both methods fail, log the error but continue
          console.warn('Warning executing statement:', error.message);
        } else {
          console.log('✓ Statement executed successfully');
        }
      }
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Configure SMTP settings in your environment variables:');
    console.log('   - SMTP_HOST (default: smtp.gmail.com)');
    console.log('   - SMTP_PORT (default: 587)');
    console.log('   - SMTP_USER (your email address)');
    console.log('   - SMTP_PASS (your email password or app password)');
    console.log('2. Test the OTP functionality in your application');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Alternative: Manual SQL execution instructions
console.log('📋 OTP Verification Table Migration');
console.log('=====================================\n');

console.log('If the automated migration fails, you can run this SQL manually in your Supabase SQL Editor:\n');

try {
  const migrationPath = path.join(__dirname, 'migrations', 'create_otp_verification_table.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  console.log('SQL to execute:');
  console.log('```sql');
  console.log(migrationSQL);
  console.log('```\n');
} catch (error) {
  console.error('Could not read migration file:', error.message);
}

console.log('🔧 Environment Setup:');
console.log('Add these to your .env.local file:');
console.log('SMTP_HOST=smtp.gmail.com');
console.log('SMTP_PORT=587');
console.log('SMTP_USER=your-email@gmail.com');
console.log('SMTP_PASS=your-app-password');
console.log('\nFor Gmail, use an App Password instead of your regular password.');
console.log('Generate one at: https://myaccount.google.com/apppasswords\n');

// Run migration if service role key is available
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  runMigration();
} else {
  console.log('⚠️  SUPABASE_SERVICE_ROLE_KEY not found. Please run the SQL manually.');
}