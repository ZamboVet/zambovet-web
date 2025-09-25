import { createClient } from '@supabase/supabase-js'

// These should match your .env.local values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-project-url'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testDatabase() {
  console.log('Testing database connection...')
  
  try {
    // Test 1: Check if pet_diary_entries table exists
    console.log('1. Testing pet_diary_entries table...')
    const { data, error } = await supabase
      .from('pet_diary_entries')
      .select('id')
      .limit(1)

    if (error) {
      console.error('Error accessing pet_diary_entries table:', error.message)
      if (error.message.includes('relation "public.pet_diary_entries" does not exist')) {
        console.error('❌ The pet_diary_entries table does not exist!')
        console.log('Please run the SQL schema file: src/sql/pet_diary_schema.sql')
        return
      }
    } else {
      console.log('✅ pet_diary_entries table exists and is accessible')
    }

    // Test 2: Check if pet_owner_profiles table exists
    console.log('2. Testing pet_owner_profiles table...')
    const { data: profileData, error: profileError } = await supabase
      .from('pet_owner_profiles')
      .select('id')
      .limit(1)

    if (profileError) {
      console.error('Error accessing pet_owner_profiles table:', profileError.message)
    } else {
      console.log('✅ pet_owner_profiles table exists')
    }

    // Test 3: Check if patients table exists
    console.log('3. Testing patients table...')
    const { data: patientsData, error: patientsError } = await supabase
      .from('patients')
      .select('id')
      .limit(1)

    if (patientsError) {
      console.error('Error accessing patients table:', patientsError.message)
    } else {
      console.log('✅ patients table exists')
    }

    console.log('Database test completed.')
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

testDatabase()