-- Pet Story Feature Database Migration - Simple Version
-- Version: 1.0-simple
-- Date: 2024-01-20
-- Description: Adds essential fields to support the Pet Story diary feature (without RLS policies)

-- =======================================================================================
-- 1. ENHANCE EXISTING pet_diary_entries TABLE
-- =======================================================================================

-- Add story-specific columns to existing pet_diary_entries table
ALTER TABLE pet_diary_entries 
ADD COLUMN IF NOT EXISTS entry_type VARCHAR(20) DEFAULT 'daily'
    CHECK (entry_type IN ('daily', 'milestone', 'vet_visit', 'special'));

ALTER TABLE pet_diary_entries 
ADD COLUMN IF NOT EXISTS activities TEXT[] DEFAULT '{}';

ALTER TABLE pet_diary_entries 
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

ALTER TABLE pet_diary_entries 
ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2);

ALTER TABLE pet_diary_entries 
ADD COLUMN IF NOT EXISTS weather VARCHAR(50);

-- Link diary entries to appointments for automatic story creation
-- Note: This assumes an 'appointments' table exists. Comment out if not applicable.
-- ALTER TABLE pet_diary_entries 
-- ADD COLUMN IF NOT EXISTS appointment_id INTEGER REFERENCES appointments(id);

-- Add search support
ALTER TABLE pet_diary_entries 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- =======================================================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =======================================================================================

-- Index for patient-based story queries with date ordering
CREATE INDEX IF NOT EXISTS idx_pet_diary_entries_patient_date 
ON pet_diary_entries (patient_id, entry_date DESC);

-- Index for entry type filtering
CREATE INDEX IF NOT EXISTS idx_pet_diary_entries_entry_type 
ON pet_diary_entries (entry_type);

-- Partial index for favorites (only indexes true values)
CREATE INDEX IF NOT EXISTS idx_pet_diary_entries_favorites 
ON pet_diary_entries (patient_id, is_favorite) 
WHERE is_favorite = true;

-- Full-text search index
CREATE INDEX IF NOT EXISTS pet_diary_search_idx 
ON pet_diary_entries USING GIN(search_vector);

-- =======================================================================================
-- 3. UPDATE EXISTING DATA
-- =======================================================================================

-- Update existing entries to have proper entry types based on existing flags
UPDATE pet_diary_entries 
SET entry_type = 'vet_visit' 
WHERE is_vet_visit_related = true AND entry_type = 'daily';

-- Set default values for new boolean fields
UPDATE pet_diary_entries 
SET is_favorite = false 
WHERE is_favorite IS NULL;

-- Initialize empty activities array for existing entries
UPDATE pet_diary_entries 
SET activities = '{}' 
WHERE activities IS NULL;

-- =======================================================================================
-- 4. CREATE SEARCH FUNCTIONALITY
-- =======================================================================================

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_story_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    COALESCE(NEW.title, '') || ' ' || 
    COALESCE(NEW.content, '') || ' ' ||
    COALESCE(NEW.health_observations, '') || ' ' ||
    COALESCE(array_to_string(NEW.activities, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update search vector on insert/update
DROP TRIGGER IF EXISTS update_story_search_trigger ON pet_diary_entries;
CREATE TRIGGER update_story_search_trigger
  BEFORE INSERT OR UPDATE ON pet_diary_entries
  FOR EACH ROW EXECUTE FUNCTION update_story_search_vector();

-- Update search vectors for existing entries
UPDATE pet_diary_entries 
SET search_vector = to_tsvector('english', 
  COALESCE(title, '') || ' ' || 
  COALESCE(content, '') || ' ' ||
  COALESCE(health_observations, '') || ' ' ||
  COALESCE(array_to_string(activities, ' '), '')
)
WHERE search_vector IS NULL;

-- =======================================================================================
-- 5. ENHANCE APPOINTMENTS TABLE (if needed)
-- =======================================================================================

-- Uncomment these lines if you have an appointments table and want to enhance it:
/*
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS visit_notes TEXT;

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS visit_photos TEXT[] DEFAULT '{}';

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS follow_up_needed BOOLEAN DEFAULT false;

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS next_visit_date DATE;
*/

-- =======================================================================================
-- SUCCESS MESSAGE
-- =======================================================================================

DO $$
BEGIN
    RAISE NOTICE 'Pet Story features have been successfully added to the database!';
    RAISE NOTICE 'Note: Row Level Security (RLS) policies were not applied in this simple version.';
    RAISE NOTICE 'Run the RLS setup separately if needed after confirming your schema structure.';
END $$;