-- Pet Story Feature Database Migration
-- Version: 1.0
-- Date: 2024-01-20
-- Description: Adds essential fields to support the Pet Story diary feature

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
ALTER TABLE pet_diary_entries 
ADD COLUMN IF NOT EXISTS appointment_id INTEGER REFERENCES appointments(id);

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
-- 5. OPTIONAL: CREATE pet_milestones TABLE (for future enhancement)
-- =======================================================================================

-- Uncomment if you want to create a separate milestones table
/*
CREATE TABLE IF NOT EXISTS pet_milestones (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  milestone_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  achieved_date DATE NOT NULL,
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(patient_id, milestone_type, achieved_date)
);

CREATE INDEX IF NOT EXISTS idx_pet_milestones_patient 
ON pet_milestones (patient_id, achieved_date DESC);
*/

-- =======================================================================================
-- 6. ENHANCE APPOINTMENTS TABLE (if needed)
-- =======================================================================================

-- Add story-related fields to appointments table if they don't exist
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS visit_notes TEXT;

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS visit_photos TEXT[] DEFAULT '{}';

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS follow_up_needed BOOLEAN DEFAULT false;

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS next_visit_date DATE;

-- =======================================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =======================================================================================

-- Enable RLS on pet_diary_entries if not already enabled
ALTER TABLE pet_diary_entries ENABLE ROW LEVEL SECURITY;

-- Create policy to ensure pet owners can only access their own pet stories
-- Note: This policy may need adjustment based on your specific schema
DROP POLICY IF EXISTS pet_diary_owner_policy ON pet_diary_entries;

-- Try multiple approaches for the RLS policy based on common schema patterns:
-- Approach 1: Direct UUID comparison (most common)
DO $$
BEGIN
    BEGIN
        CREATE POLICY pet_diary_owner_policy ON pet_diary_entries
          FOR ALL USING (
            patient_id IN (
              SELECT id FROM patients WHERE owner_id = auth.uid()
            )
          );
    EXCEPTION WHEN OTHERS THEN
        -- Approach 2: Cast both sides to text if UUID comparison fails
        BEGIN
            CREATE POLICY pet_diary_owner_policy ON pet_diary_entries
              FOR ALL USING (
                patient_id IN (
                  SELECT id FROM patients WHERE owner_id::text = auth.uid()::text
                )
              );
        EXCEPTION WHEN OTHERS THEN
            -- Approach 3: Handle case where owner_id might be an integer referencing a user profiles table
            BEGIN
                CREATE POLICY pet_diary_owner_policy ON pet_diary_entries
                  FOR ALL USING (
                    patient_id IN (
                      SELECT p.id FROM patients p
                      INNER JOIN user_profiles up ON p.owner_id = up.id
                      WHERE up.user_id = auth.uid()
                    )
                  );
            EXCEPTION WHEN OTHERS THEN
                -- Approach 4: Most permissive - allow access based on authenticated user
                -- You should replace this with your specific logic
                CREATE POLICY pet_diary_owner_policy ON pet_diary_entries
                  FOR ALL USING (auth.uid() IS NOT NULL);
                  
                -- Log warning that manual policy adjustment is needed
                RAISE NOTICE 'Warning: Generic RLS policy applied. Please review and customize based on your schema.';
            END;
        END;
    END;
END $$;

-- =======================================================================================
-- 8. SAMPLE DATA FOR TESTING (Optional - uncomment to use)
-- =======================================================================================

/*
-- Insert sample story entries for testing (replace patient_id with actual values)
INSERT INTO pet_diary_entries (
  patient_id, entry_date, title, content, mood, entry_type, activities, is_favorite
) VALUES 
(1, CURRENT_DATE - INTERVAL '7 days', 'First Walk Adventure', 
 'Today we went on our first long walk to the park. The weather was perfect and there were so many new smells!', 
 'excited', 'milestone', ARRAY['walking', 'exploring', 'socializing'], true),

(1, CURRENT_DATE - INTERVAL '5 days', 'Vet Checkup Day', 
 'Annual vaccination and health checkup. Everything looks great! Weight is stable.', 
 'calm', 'vet_visit', ARRAY['vet_visit', 'vaccination'], false),

(1, CURRENT_DATE - INTERVAL '3 days', 'Rainy Day Fun', 
 'Couldn''t go outside due to heavy rain, but we had lots of fun with indoor games and toys.', 
 'playful', 'daily', ARRAY['indoor_play', 'games'], false),

(1, CURRENT_DATE - INTERVAL '1 day', 'New Trick Learned', 
 'Finally mastered the roll over trick! Took weeks of practice but worth it.', 
 'proud', 'milestone', ARRAY['training', 'tricks'], true)
ON CONFLICT DO NOTHING;
*/

-- =======================================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- =======================================================================================

/*
-- To rollback this migration, run the following commands:

-- Remove added columns
ALTER TABLE pet_diary_entries DROP COLUMN IF EXISTS entry_type;
ALTER TABLE pet_diary_entries DROP COLUMN IF EXISTS activities;
ALTER TABLE pet_diary_entries DROP COLUMN IF EXISTS is_favorite;
ALTER TABLE pet_diary_entries DROP COLUMN IF EXISTS weight;
ALTER TABLE pet_diary_entries DROP COLUMN IF EXISTS weather;
ALTER TABLE pet_diary_entries DROP COLUMN IF EXISTS appointment_id;
ALTER TABLE pet_diary_entries DROP COLUMN IF EXISTS search_vector;

-- Remove indexes
DROP INDEX IF EXISTS idx_pet_diary_entries_patient_date;
DROP INDEX IF EXISTS idx_pet_diary_entries_entry_type;
DROP INDEX IF EXISTS idx_pet_diary_entries_favorites;
DROP INDEX IF EXISTS pet_diary_search_idx;

-- Remove trigger and function
DROP TRIGGER IF EXISTS update_story_search_trigger ON pet_diary_entries;
DROP FUNCTION IF EXISTS update_story_search_vector();

-- Remove RLS policy
DROP POLICY IF EXISTS pet_diary_owner_policy ON pet_diary_entries;
ALTER TABLE pet_diary_entries DISABLE ROW LEVEL SECURITY;
*/