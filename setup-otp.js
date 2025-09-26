const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('🚀 Setting up OTP Verification System...\n');

// Check environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Environment Check:');
console.log('✓ Supabase URL:', supabaseUrl ? 'Found' : '❌ Missing');
console.log('✓ Supabase Anon Key:', supabaseAnonKey ? 'Found' : '❌ Missing');
console.log('✓ SMTP Host:', process.env.SMTP_HOST || '❌ Missing');
console.log('✓ SMTP User:', process.env.SMTP_USER || '❌ Missing');
console.log('✓ SMTP Pass:', process.env.SMTP_PASS ? 'Found' : '❌ Missing');
console.log('');

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Missing Supabase configuration in .env.local');
  console.log('Please add:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your-project-url');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkOTPTable() {
  try {
    console.log('🔍 Checking if OTP verification table exists...');
    
    // Try to query the table
    const { data, error } = await supabase
      .from('otp_verification')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST204' || error.message.includes('does not exist')) {
        console.log('❌ OTP verification table does not exist');
        return false;
      } else {
        console.log('⚠️  Error checking table:', error.message);
        return false;
      }
    } else {
      console.log('✅ OTP verification table exists and is accessible');
      return true;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

async function testOTPAPI() {
  try {
    console.log('🧪 Testing OTP API endpoints...');
    
    // Test the send-otp endpoint with a test request
    const testData = {
      email: 'test@example.com',
      userData: {
        email: 'test@example.com',
        fullName: 'Test User',
        phone: '1234567890',
        address: 'Test Address'
      }
    };
    
    const response = await fetch('http://localhost:3000/api/auth/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ OTP API is working correctly');
      console.log('📧 Test OTP would be sent to:', testData.email);
      return true;
    } else {
      console.log('❌ OTP API Error:', result.error);
      
      if (result.error.includes('relation "otp_verification" does not exist')) {
        console.log('\n🔧 The OTP verification table needs to be created.');
        console.log('Please follow these steps:');
        console.log('1. Go to your Supabase Dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Run the SQL from: database/migrations/create_otp_verification_table.sql');
      }
      
      return false;
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Cannot connect to localhost:3000');
      console.log('Please start your development server with: npm run dev');
    } else {
      console.log('❌ Network error:', error.message);
    }
    return false;
  }
}

async function main() {
  const tableExists = await checkOTPTable();
  
  if (!tableExists) {
    console.log('\n📋 Next Steps:');
    console.log('1. Open your Supabase Dashboard');
    console.log('2. Go to SQL Editor');
    console.log('3. Copy and run the SQL from: database/migrations/create_otp_verification_table.sql');
    console.log('4. Run this script again to verify');
    console.log('\n📄 SQL File Location:');
    console.log('   C:\\System Made by your truly\\zambovet-web-main\\database\\migrations\\create_otp_verification_table.sql');
    return;
  }
  
  // Test API if table exists
  await testOTPAPI();
  
  console.log('\n🎉 Setup Summary:');
  console.log('✅ Database table: Ready');
  console.log(process.env.SMTP_HOST ? '✅' : '❌', 'SMTP configuration:', process.env.SMTP_HOST ? 'Configured' : 'Missing');
  console.log('\n💡 To complete setup, add SMTP settings to .env.local:');
  console.log('SMTP_HOST=smtp.gmail.com');
  console.log('SMTP_PORT=587');
  console.log('SMTP_USER=your-email@gmail.com');
  console.log('SMTP_PASS=your-app-password');
}

main().catch(console.error);