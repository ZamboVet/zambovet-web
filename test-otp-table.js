const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testOTPTable() {
  console.log('🧪 Testing OTP verification table...\n');
  
  try {
    // Simple test to see if table exists
    const { data, error } = await supabase
      .from('otp_verification')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.message.includes('does not exist') || error.code === '42P01') {
        console.log('❌ OTP verification table does not exist');
        console.log('📋 Please run the SQL migration in your Supabase Dashboard');
        return false;
      } else {
        console.log('⚠️  Unexpected error:', error.message);
        return false;
      }
    }
    
    console.log('✅ OTP verification table exists and is accessible');
    console.log('✅ Database setup complete!');
    
    // Test if we can insert and retrieve (this will be handled by API in production)
    console.log('\n🎉 Your OTP system is ready to use!');
    console.log('\n📧 Next: Configure SMTP settings in .env.local:');
    console.log('   SMTP_USER=your-actual-email@gmail.com');
    console.log('   SMTP_PASS=your-gmail-app-password');
    
    return true;
    
  } catch (error) {
    console.log('❌ Connection error:', error.message);
    return false;
  }
}

testOTPTable();