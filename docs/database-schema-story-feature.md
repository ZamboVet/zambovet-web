# Pet Story Feature - Database Schema Design

## Overview
This document outlines the database schema considerations for the "Story of My Life" pet diary feature integration within the existing ZamboVet system.

## Current Schema Analysis

### Existing Tables Used
The story feature currently integrates with these existing tables:

#### `patients` (Pet Profile Table)
- Contains basic pet information (id, name, species, breed, etc.)
- Used as the main pet entity for story association
- No modifications needed for basic story functionality

#### `pet_diary_entries` (Existing Diary Entries)
Current structure likely includes:
- `id` - Primary key
- `patient_id` - Foreign key to patients table
- `entry_date` - Date of the diary entry
- `title` - Entry title
- `content` - Main content/description
- `mood` - Pet's mood for the day
- `photos` - Array/JSON field for photo URLs
- `created_at` - Timestamp
- `is_vet_visit_related` - Boolean flag
- `health_observations` - Health-related notes
- `symptoms` - Symptom descriptions

## Recommended Schema Enhancements

### 1. Enhanced `pet_diary_entries` Table

Add these fields to support full story functionality:

```sql
-- Story-specific enhancements
ALTER TABLE pet_diary_entries ADD COLUMN entry_type VARCHAR(20) DEFAULT 'daily' 
  CHECK (entry_type IN ('daily', 'milestone', 'vet_visit', 'special'));

ALTER TABLE pet_diary_entries ADD COLUMN activities TEXT[]; -- Array of activities
ALTER TABLE pet_diary_entries ADD COLUMN is_favorite BOOLEAN DEFAULT false;
ALTER TABLE pet_diary_entries ADD COLUMN weight DECIMAL(5,2); -- Pet weight at entry date
ALTER TABLE pet_diary_entries ADD COLUMN weather VARCHAR(50); -- Weather conditions

-- Enhanced photo metadata (if using JSON structure)
-- photos field could be enhanced to store more metadata:
-- [{"url": "...", "caption": "...", "is_cover": false, "uploaded_at": "..."}]

-- Indexing for better performance
CREATE INDEX idx_pet_diary_entries_patient_date ON pet_diary_entries (patient_id, entry_date DESC);
CREATE INDEX idx_pet_diary_entries_entry_type ON pet_diary_entries (entry_type);
CREATE INDEX idx_pet_diary_entries_favorites ON pet_diary_entries (patient_id, is_favorite) WHERE is_favorite = true;
```

### 2. New `pet_milestones` Table (Optional Enhancement)

For more structured milestone tracking:

```sql
CREATE TABLE pet_milestones (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  milestone_type VARCHAR(50) NOT NULL, -- 'first_walk', 'first_birthday', 'learned_trick', etc.
  title VARCHAR(255) NOT NULL,
  description TEXT,
  achieved_date DATE NOT NULL,
  photos TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(patient_id, milestone_type, achieved_date)
);

CREATE INDEX idx_pet_milestones_patient ON pet_milestones (patient_id, achieved_date DESC);
```

### 3. Enhanced Vet Visit Integration

Ensure the existing appointments/visits table supports story integration:

```sql
-- If not already present, add to appointments/visits table:
ALTER TABLE appointments ADD COLUMN visit_notes TEXT;
ALTER TABLE appointments ADD COLUMN visit_photos TEXT[];
ALTER TABLE appointments ADD COLUMN follow_up_needed BOOLEAN DEFAULT false;
ALTER TABLE appointments ADD COLUMN next_visit_date DATE;

-- Link diary entries to appointments for automatic story creation
ALTER TABLE pet_diary_entries ADD COLUMN appointment_id INTEGER REFERENCES appointments(id);
```

### 4. Photo Storage Optimization

For better photo management:

```sql
-- Optional: Separate photo table for better organization
CREATE TABLE pet_photos (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
  diary_entry_id INTEGER REFERENCES pet_diary_entries(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  file_size INTEGER,
  file_type VARCHAR(10),
  is_cover_photo BOOLEAN DEFAULT false,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pet_photos_patient ON pet_photos (patient_id, uploaded_at DESC);
```

## Data Migration Considerations

### Existing Data Transformation
```sql
-- Update existing entries to have proper entry types
UPDATE pet_diary_entries 
SET entry_type = 'vet_visit' 
WHERE is_vet_visit_related = true;

-- Set default values for new fields
UPDATE pet_diary_entries 
SET is_favorite = false 
WHERE is_favorite IS NULL;
```

## Security & Privacy

### Row Level Security (RLS)
```sql
-- Ensure pet owners can only access their own pet stories
ALTER TABLE pet_diary_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY pet_diary_owner_policy ON pet_diary_entries
  FOR ALL USING (
    patient_id IN (
      SELECT id FROM patients WHERE owner_id = auth.uid()
    )
  );
```

## Performance Considerations

### 1. Pagination Support
- Large story collections need efficient pagination
- Use cursor-based pagination with `created_at` or `entry_date`

### 2. Photo Storage
- Consider using Supabase Storage for photos
- Implement image compression and resizing
- Use CDN for faster photo loading

### 3. Search Functionality
```sql
-- Full-text search on story content
ALTER TABLE pet_diary_entries ADD COLUMN search_vector tsvector;

CREATE INDEX pet_diary_search_idx ON pet_diary_entries 
  USING GIN(search_vector);

-- Trigger to update search vector
CREATE OR REPLACE FUNCTION update_story_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    COALESCE(NEW.title, '') || ' ' || 
    COALESCE(NEW.content, '') || ' ' ||
    COALESCE(NEW.health_observations, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_story_search_trigger
  BEFORE INSERT OR UPDATE ON pet_diary_entries
  FOR EACH ROW EXECUTE FUNCTION update_story_search_vector();
```

## Backup and Data Retention

### Story Archive Strategy
```sql
-- Archive old entries (older than 5 years) to separate table
CREATE TABLE pet_diary_entries_archive (LIKE pet_diary_entries INCLUDING ALL);

-- Monthly cleanup job consideration
-- Move entries older than 5 years to archive table
```

## API Considerations

### Batch Operations
- Support bulk story entry creation
- Efficient yearbook data aggregation queries

### Caching Strategy
- Cache frequently accessed pet stories
- Use Redis for session-based story editing

## Testing Data

### Sample Data Setup
```sql
-- Sample story entries for testing
INSERT INTO pet_diary_entries (
  patient_id, entry_date, title, content, mood, entry_type, activities, is_favorite
) VALUES 
(1, '2024-01-15', 'First Walk in the Park', 'Bella loved her first walk in the central park!', 'happy', 'milestone', ARRAY['walking', 'socializing'], true),
(1, '2024-01-16', 'Vet Checkup', 'Annual vaccination and health checkup went well.', 'calm', 'vet_visit', ARRAY['vet_visit'], false),
(1, '2024-01-17', 'Rainy Day Indoor Fun', 'Played with new toys inside due to rain.', 'playful', 'daily', ARRAY['playing', 'indoor'], false);
```

## Implementation Notes

1. **Phase 1**: Add basic story fields to existing `pet_diary_entries`
2. **Phase 2**: Implement photo management enhancements
3. **Phase 3**: Add milestone tracking and advanced search
4. **Phase 4**: Performance optimization and caching

## Monitoring and Analytics

### Story Feature Metrics
- Track story creation frequency
- Monitor photo upload sizes and counts
- Measure yearbook generation usage
- User engagement with timeline vs calendar views

This schema design ensures scalability, performance, and maintainability while preserving existing functionality and data integrity.