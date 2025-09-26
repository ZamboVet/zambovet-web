-- Create landing_page_settings table for CMS functionality
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS landing_page_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    settings JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Add constraint to ensure only one settings record exists
ALTER TABLE landing_page_settings 
ADD CONSTRAINT single_settings_record 
CHECK (id = 1);

-- Insert default settings
INSERT INTO landing_page_settings (id, settings) VALUES (
    1,
    '{
        "heroTitle": "Professional Pet Care Made Simple",
        "heroSubtitle": "Book veterinary appointments online, manage your pets health records, and connect with experienced veterinarians who care about your furry family members.",
        "heroButtonText": "Book Appointment",
        "heroLearnMoreText": "Learn More",
        "servicesTitle": "Our Services",
        "servicesSubtitle": "Comprehensive veterinary care tailored to your pets unique needs",
        "aboutTitle": "Why Choose ZamboVet?",
        "aboutSubtitle": "We combine modern technology with compassionate care to provide the best possible experience for you and your pets. Our platform makes veterinary care accessible, convenient, and stress-free.",
        "contactTitle": "Get In Touch",
        "contactSubtitle": "Have questions? Were here to help. Reach out to us anytime.",
        "contactPhone": "+639123456789",
        "contactEmail": "vetzambo@gmail.com",
        "contactAddress": "Lorem Ipsum, Zamboanga City",
        "companyName": "ZamboVet",
        "primaryColor": "#0032A0",
        "secondaryColor": "#b3c7e6",
        "accentColor": "#fffbde"
    }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_landing_page_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update timestamp on changes
CREATE TRIGGER update_landing_page_settings_timestamp_trigger
    BEFORE UPDATE ON landing_page_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_landing_page_settings_timestamp();

-- Enable Row Level Security (RLS)
ALTER TABLE landing_page_settings ENABLE ROW LEVEL SECURITY;

-- Create policy: Only admins can read/write settings
CREATE POLICY "Admins can read landing page settings" ON landing_page_settings
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_role = 'admin'
        )
    );

CREATE POLICY "Admins can update landing page settings" ON landing_page_settings
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_role = 'admin'
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON landing_page_settings TO authenticated;

-- Add helpful comment
COMMENT ON TABLE landing_page_settings IS 'Stores CMS settings for the landing page - allows admins to customize content and design';