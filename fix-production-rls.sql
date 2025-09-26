-- Fix RLS and permissions for production deployment
-- Run this in your Supabase Dashboard SQL Editor

-- 1. Ensure otp_verification table exists and has proper RLS
CREATE TABLE IF NOT EXISTS otp_verification (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_data JSONB, -- Store temporary signup data
    CONSTRAINT otp_verification_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT otp_verification_code_check CHECK (otp_code ~ '^[0-9]{6}$')
);

-- Create indices for otp_verification
CREATE INDEX IF NOT EXISTS idx_otp_verification_email_otp ON otp_verification(email, otp_code);
CREATE INDEX IF NOT EXISTS idx_otp_verification_expires_at ON otp_verification(expires_at);

-- Enable RLS on otp_verification
ALTER TABLE otp_verification ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for otp_verification
DROP POLICY IF EXISTS "Users can access their own OTP records" ON otp_verification;
DROP POLICY IF EXISTS "Allow service role full access" ON otp_verification;
DROP POLICY IF EXISTS "Users can verify their own OTP" ON otp_verification;

-- Allow service role (API) to perform all operations on OTP table
CREATE POLICY "Service role full access to otp_verification" ON otp_verification
FOR ALL 
TO service_role
USING (TRUE)
WITH CHECK (TRUE);

-- Grant explicit permissions to service role for otp_verification
GRANT ALL ON otp_verification TO service_role;
GRANT USAGE ON SEQUENCE otp_verification_id_seq TO service_role;

-- 2. Fix profiles table RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON profiles;

-- Allow users to read their own profiles
CREATE POLICY "Users can read own profile" ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow users to update their own profiles
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow service role full access to profiles (for API operations)
CREATE POLICY "Service role full access to profiles" ON profiles
FOR ALL
TO service_role
USING (TRUE)
WITH CHECK (TRUE);

-- Allow anon users to read profiles for public information (limited fields)
CREATE POLICY "Public read access to basic profile info" ON profiles
FOR SELECT
TO anon
USING (is_active = TRUE);

-- 3. Fix landing_page_settings table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'landing_page_settings') THEN
        -- Enable RLS
        ALTER TABLE landing_page_settings ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies
        DROP POLICY IF EXISTS "Public read access" ON landing_page_settings;
        DROP POLICY IF EXISTS "Service role full access" ON landing_page_settings;
        
        -- Allow public read access
        CREATE POLICY "Public read access to landing settings" ON landing_page_settings
        FOR SELECT
        TO anon, authenticated
        USING (TRUE);
        
        -- Allow service role full access
        CREATE POLICY "Service role full access to landing settings" ON landing_page_settings
        FOR ALL
        TO service_role
        USING (TRUE)
        WITH CHECK (TRUE);
    END IF;
END $$;

-- 4. Fix pet_owner_profiles table RLS
DROP POLICY IF EXISTS "Users can manage own pet owner profile" ON pet_owner_profiles;
DROP POLICY IF EXISTS "Service role can manage pet owner profiles" ON pet_owner_profiles;

-- Allow users to manage their own pet owner profiles
CREATE POLICY "Users can manage own pet owner profile" ON pet_owner_profiles
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow service role full access
CREATE POLICY "Service role full access to pet owner profiles" ON pet_owner_profiles
FOR ALL
TO service_role
USING (TRUE)
WITH CHECK (TRUE);

-- 5. Fix veterinarians table RLS
DROP POLICY IF EXISTS "Public read access to veterinarians" ON veterinarians;
DROP POLICY IF EXISTS "Veterinarians can update own profile" ON veterinarians;
DROP POLICY IF EXISTS "Service role can manage veterinarians" ON veterinarians;

-- Allow public read access to active veterinarians
CREATE POLICY "Public read access to active veterinarians" ON veterinarians
FOR SELECT
TO anon, authenticated
USING (is_available = TRUE);

-- Allow veterinarians to update their own profiles
CREATE POLICY "Veterinarians can update own profile" ON veterinarians
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow service role full access
CREATE POLICY "Service role full access to veterinarians" ON veterinarians
FOR ALL
TO service_role
USING (TRUE)
WITH CHECK (TRUE);

-- Grant necessary permissions to service_role
GRANT ALL ON profiles TO service_role;
GRANT ALL ON pet_owner_profiles TO service_role;
GRANT ALL ON veterinarians TO service_role;

-- Grant permissions to authenticated users for their own data
GRANT SELECT, UPDATE ON profiles TO authenticated;
GRANT ALL ON pet_owner_profiles TO authenticated;
GRANT SELECT, UPDATE ON veterinarians TO authenticated;

-- Grant public read access where appropriate
GRANT SELECT ON profiles TO anon;
GRANT SELECT ON veterinarians TO anon;

-- If landing_page_settings exists, grant permissions
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'landing_page_settings') THEN
        GRANT SELECT ON landing_page_settings TO anon, authenticated;
        GRANT ALL ON landing_page_settings TO service_role;
    END IF;
END $$;

-- Clean up expired OTP codes function
CREATE OR REPLACE FUNCTION cleanup_expired_otp_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM otp_verification 
    WHERE expires_at < NOW() 
    OR (is_verified = TRUE AND created_at < NOW() - INTERVAL '1 hour');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on cleanup function
GRANT EXECUTE ON FUNCTION cleanup_expired_otp_codes() TO service_role;

-- Verify the setup
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename IN ('otp_verification', 'profiles', 'pet_owner_profiles', 'veterinarians', 'landing_page_settings')
  AND schemaname = 'public';

-- Show policies for verification
SELECT 
    pol.polname as "Policy Name",
    pol.polcmd as "Command",
    pol.polroles::regrole[] as "Roles",
    pg_get_expr(pol.polqual, pol.polrelid) as "Using",
    pg_get_expr(pol.polwithcheck, pol.polrelid) as "With Check"
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
WHERE pc.relname IN ('otp_verification', 'profiles')
ORDER BY pc.relname, pol.polname;