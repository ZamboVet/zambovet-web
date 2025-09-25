-- Pet Diary Feature Database Schema
-- This adds diary functionality to track daily notes, health observations, and activities for pets

-- Pet Diary Entries Table
CREATE TABLE IF NOT EXISTS pet_diary_entries (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    pet_owner_id INTEGER NOT NULL REFERENCES pet_owner_profiles(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    title VARCHAR(255),
    content TEXT,
    mood VARCHAR(50), -- happy, sad, playful, tired, anxious, normal, etc.
    activity_level VARCHAR(50), -- low, normal, high, very_active, lethargic
    appetite VARCHAR(50), -- normal, increased, decreased, no_appetite, picky
    behavior_notes TEXT,
    health_observations TEXT,
    symptoms TEXT,
    medication_given JSONB, -- {name, dosage, time, notes}
    feeding_notes TEXT,
    weight DECIMAL(5,2),
    temperature DECIMAL(4,1),
    is_vet_visit_related BOOLEAN DEFAULT FALSE,
    appointment_id INTEGER REFERENCES appointments(id),
    tags TEXT[], -- array of tags like 'medication', 'symptom', 'mood', 'feeding', 'exercise'
    photos TEXT[], -- array of photo URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pet Diary Photos Table (for detailed photo management)
CREATE TABLE IF NOT EXISTS pet_diary_photos (
    id SERIAL PRIMARY KEY,
    diary_entry_id INTEGER NOT NULL REFERENCES pet_diary_entries(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    caption TEXT,
    photo_type VARCHAR(50), -- 'general', 'symptom', 'medication', 'activity', 'food'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pet Health Metrics Table (for tracking regular measurements)
CREATE TABLE IF NOT EXISTS pet_health_metrics (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    weight DECIMAL(5,2),
    temperature DECIMAL(4,1),
    heart_rate INTEGER,
    respiratory_rate INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pet Medication Schedule Table
CREATE TABLE IF NOT EXISTS pet_medication_schedule (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(100), -- 'once daily', 'twice daily', 'every 8 hours', etc.
    start_date DATE NOT NULL,
    end_date DATE,
    instructions TEXT,
    prescribed_by VARCHAR(255), -- veterinarian name
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pet Diary Templates (predefined entry templates)
CREATE TABLE IF NOT EXISTS pet_diary_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_data JSONB, -- structure for quick entry creation
    category VARCHAR(50), -- 'health', 'medication', 'feeding', 'activity', 'general'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pet_diary_entries_patient_date ON pet_diary_entries(patient_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_pet_diary_entries_owner_date ON pet_diary_entries(pet_owner_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_pet_diary_entries_tags ON pet_diary_entries USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_pet_health_metrics_patient_date ON pet_health_metrics(patient_id, measurement_date DESC);
CREATE INDEX IF NOT EXISTS idx_pet_medication_schedule_patient_active ON pet_medication_schedule(patient_id, is_active);

-- Insert default diary templates
INSERT INTO pet_diary_templates (name, description, template_data, category) VALUES
('Daily Health Check', 'Quick daily health observation template', 
 '{"mood": "", "activity_level": "", "appetite": "", "health_observations": "", "behavior_notes": ""}', 
 'health'),
('Medication Log', 'Template for logging medication administration',
 '{"medication_given": {"name": "", "dosage": "", "time": "", "notes": ""}, "symptoms": "", "behavior_notes": ""}',
 'medication'),
('Feeding Log', 'Track feeding schedule and appetite',
 '{"appetite": "", "feeding_notes": "", "behavior_notes": ""}',
 'feeding'),
('Vet Visit Follow-up', 'Post-appointment observation template',
 '{"health_observations": "", "symptoms": "", "behavior_notes": "", "medication_given": {}, "is_vet_visit_related": true}',
 'health'),
('Activity Log', 'Track exercise and play activities',
 '{"activity_level": "", "behavior_notes": "", "mood": ""}',
 'activity');

-- RLS (Row Level Security) Policies
ALTER TABLE pet_diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_diary_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_medication_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_diary_templates ENABLE ROW LEVEL SECURITY;

-- Pet owners can only access their own pets' diary entries
CREATE POLICY "Pet owners can view their pets' diary entries" ON pet_diary_entries
    FOR SELECT USING (
        pet_owner_id IN (
            SELECT id FROM pet_owner_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Pet owners can insert diary entries for their pets" ON pet_diary_entries
    FOR INSERT WITH CHECK (
        pet_owner_id IN (
            SELECT id FROM pet_owner_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Pet owners can update their pets' diary entries" ON pet_diary_entries
    FOR UPDATE USING (
        pet_owner_id IN (
            SELECT id FROM pet_owner_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Pet owners can delete their pets' diary entries" ON pet_diary_entries
    FOR DELETE USING (
        pet_owner_id IN (
            SELECT id FROM pet_owner_profiles WHERE user_id = auth.uid()
        )
    );

-- Similar policies for other tables
CREATE POLICY "Pet owners can manage their pets' diary photos" ON pet_diary_photos
    FOR ALL USING (
        diary_entry_id IN (
            SELECT id FROM pet_diary_entries WHERE pet_owner_id IN (
                SELECT id FROM pet_owner_profiles WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Pet owners can manage their pets' health metrics" ON pet_health_metrics
    FOR ALL USING (
        patient_id IN (
            SELECT id FROM patients WHERE owner_id IN (
                SELECT id FROM pet_owner_profiles WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Pet owners can manage their pets' medication schedule" ON pet_medication_schedule
    FOR ALL USING (
        patient_id IN (
            SELECT id FROM patients WHERE owner_id IN (
                SELECT id FROM pet_owner_profiles WHERE user_id = auth.uid()
            )
        )
    );

-- Allow everyone to read templates
CREATE POLICY "Everyone can read diary templates" ON pet_diary_templates
    FOR SELECT USING (is_active = true);