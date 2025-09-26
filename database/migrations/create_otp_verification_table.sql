-- Create OTP verification table for temporary storage of OTP codes
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

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_otp_verification_email_otp ON otp_verification(email, otp_code);
CREATE INDEX IF NOT EXISTS idx_otp_verification_expires_at ON otp_verification(expires_at);

-- Create function to clean up expired OTP codes
CREATE OR REPLACE FUNCTION cleanup_expired_otp_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM otp_verification 
    WHERE expires_at < NOW() 
    OR (is_verified = TRUE AND created_at < NOW() - INTERVAL '1 hour');
END;
$$ LANGUAGE plpgsql;

-- Add RLS (Row Level Security) policies
ALTER TABLE otp_verification ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own OTP records (this will be handled by API)
CREATE POLICY "Users can access their own OTP records" ON otp_verification
FOR ALL USING (FALSE); -- Disable direct access, only through API

-- Grant permissions to service role (used by API)
-- Note: This would typically be done in your Supabase dashboard or via service role
-- GRANT ALL ON otp_verification TO service_role;
-- GRANT USAGE ON SEQUENCE otp_verification_id_seq TO service_role;