-- Pet Story Feature - Row Level Security Setup
-- Version: 1.0
-- Date: 2024-01-20
-- Description: Sets up RLS policies for pet_diary_entries table
-- Note: Run this AFTER the main migration and AFTER confirming your schema structure

-- =======================================================================================
-- FIRST: CHECK YOUR SCHEMA STRUCTURE
-- =======================================================================================

-- Run these queries first to understand your current schema:
/*
-- Check the structure of your patients table:
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'patients' AND column_name IN ('id', 'owner_id');

-- Check the structure of auth.users or your user table:
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'auth';

-- Check if you have a user_profiles table:
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles';
*/

-- =======================================================================================
-- RLS POLICY SETUP OPTIONS
-- =======================================================================================

-- Enable RLS on pet_diary_entries if not already enabled
ALTER TABLE pet_diary_entries ENABLE ROW LEVEL SECURITY;

-- Remove any existing policy
DROP POLICY IF EXISTS pet_diary_owner_policy ON pet_diary_entries;

-- =======================================================================================
-- OPTION 1: Direct owner_id to auth.uid() comparison (most common with Supabase)
-- =======================================================================================

-- Use this if your patients.owner_id directly references auth.users.id (both UUIDs)
/*
CREATE POLICY pet_diary_owner_policy ON pet_diary_entries
  FOR ALL USING (
    patient_id IN (
      SELECT id FROM patients WHERE owner_id = auth.uid()
    )
  );
*/

-- =======================================================================================
-- OPTION 2: Cast both sides to text (if there are type mismatches)
-- =======================================================================================

-- Use this if you get type casting errors
/*
CREATE POLICY pet_diary_owner_policy ON pet_diary_entries
  FOR ALL USING (
    patient_id IN (
      SELECT id FROM patients WHERE owner_id::text = auth.uid()::text
    )
  );
*/

-- =======================================================================================
-- OPTION 3: Through user_profiles table (if using profile-based ownership)
-- =======================================================================================

-- Use this if your patients.owner_id references a user_profiles.id, and user_profiles.user_id references auth.users.id
/*
CREATE POLICY pet_diary_owner_policy ON pet_diary_entries
  FOR ALL USING (
    patient_id IN (
      SELECT p.id 
      FROM patients p
      INNER JOIN user_profiles up ON p.owner_id = up.id
      WHERE up.user_id = auth.uid()
    )
  );
*/

-- =======================================================================================
-- OPTION 4: Custom implementation based on your specific schema
-- =======================================================================================

-- Replace this with your actual schema requirements
-- This is a placeholder that allows all authenticated users access
-- YOU SHOULD REPLACE THIS WITH YOUR ACTUAL SECURITY REQUIREMENTS
CREATE POLICY pet_diary_owner_policy ON pet_diary_entries
  FOR ALL USING (
    -- Temporary policy: allows access to authenticated users
    -- REPLACE THIS WITH YOUR ACTUAL OWNERSHIP LOGIC
    auth.uid() IS NOT NULL
  );

-- =======================================================================================
-- TESTING YOUR RLS POLICY
-- =======================================================================================

-- After setting up your policy, test it with these queries:
/*
-- Test 1: Check if the policy exists
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'pet_diary_entries';

-- Test 2: Test access as an authenticated user
-- (This should only return entries for pets owned by the current user)
SELECT patient_id, title, entry_date 
FROM pet_diary_entries 
LIMIT 5;

-- Test 3: Check patient ownership
SELECT p.id, p.name, p.owner_id, up.user_id
FROM patients p
LEFT JOIN user_profiles up ON p.owner_id = up.id
LIMIT 5;
*/

-- =======================================================================================
-- IMPORTANT NOTES
-- =======================================================================================

/*
IMPORTANT: The current policy allows access to all authenticated users.
This is NOT SECURE for production use!

To set up proper RLS:

1. First understand your schema by running the schema check queries above
2. Uncomment and modify one of the policy options above based on your schema
3. Comment out or replace the temporary policy
4. Test thoroughly with the testing queries

Common schema patterns:

Pattern A: Direct ownership
- patients.owner_id = auth.users.id (both UUIDs)
- Use OPTION 1

Pattern B: Profile-based ownership  
- patients.owner_id = user_profiles.id
- user_profiles.user_id = auth.users.id
- Use OPTION 3

Pattern C: String-based IDs or type mismatches
- Use OPTION 2 with appropriate casting
*/

DO $$
BEGIN
    RAISE NOTICE '=== RLS SETUP COMPLETE ===';
    RAISE NOTICE 'WARNING: Current policy allows all authenticated users to access all diary entries!';
    RAISE NOTICE 'This is NOT secure for production. Please customize the policy based on your schema.';
    RAISE NOTICE 'See comments in this file for guidance on setting up proper security.';
END $$;