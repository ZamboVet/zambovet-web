-- Fix RLS policy for OTP verification table
-- Run this in Supabase Dashboard SQL Editor

-- Drop the restrictive policy and create a proper one for OTP operations
DROP POLICY IF EXISTS "Users can access their own OTP records" ON otp_verification;

-- Allow service role (API) to perform all operations on OTP table
CREATE POLICY "Allow service role full access" ON otp_verification
FOR ALL 
TO service_role
USING (TRUE)
WITH CHECK (TRUE);

-- Allow authenticated users to read their own OTP records (for verification)
CREATE POLICY "Users can verify their own OTP" ON otp_verification
FOR SELECT 
TO authenticated
USING (TRUE);

-- Grant explicit permissions to service role
GRANT ALL ON otp_verification TO service_role;
GRANT USAGE ON SEQUENCE otp_verification_id_seq TO service_role;