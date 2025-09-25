-- Pet Diary Photos Storage Bucket Setup
-- This script creates storage policies for the pet diary photos bucket
-- IMPORTANT: First create the bucket 'pet-diary-photos' via Supabase Dashboard before running this script

-- Step 1: Go to Supabase Dashboard > Storage > Create a new bucket
-- Bucket name: pet-diary-photos
-- Public: false (we'll control access via policies)
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/gif, image/webp

-- Step 2: Run this SQL script to create storage policies

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow pet owners to upload photos for their diary entries
CREATE POLICY "Pet owners can upload diary photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'pet-diary-photos' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] IN (
      SELECT DISTINCT patient_id::text 
      FROM patients 
      WHERE owner_id IN (
        SELECT id 
        FROM pet_owner_profiles 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Allow pet owners to view photos for their own pets
CREATE POLICY "Pet owners can view diary photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'pet-diary-photos' AND
    (storage.foldername(name))[1] IN (
      SELECT DISTINCT patient_id::text 
      FROM patients 
      WHERE owner_id IN (
        SELECT id 
        FROM pet_owner_profiles 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Allow pet owners to update photos for their own pets
CREATE POLICY "Pet owners can update diary photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'pet-diary-photos' AND
    (storage.foldername(name))[1] IN (
      SELECT DISTINCT patient_id::text 
      FROM patients 
      WHERE owner_id IN (
        SELECT id 
        FROM pet_owner_profiles 
        WHERE user_id = auth.uid()
      )
    )
  ) WITH CHECK (
    bucket_id = 'pet-diary-photos' AND
    (storage.foldername(name))[1] IN (
      SELECT DISTINCT patient_id::text 
      FROM patients 
      WHERE owner_id IN (
        SELECT id 
        FROM pet_owner_profiles 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Allow pet owners to delete photos for their own pets
CREATE POLICY "Pet owners can delete diary photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'pet-diary-photos' AND
    (storage.foldername(name))[1] IN (
      SELECT DISTINCT patient_id::text 
      FROM patients 
      WHERE owner_id IN (
        SELECT id 
        FROM pet_owner_profiles 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Create index for better performance on patients table if not exists
CREATE INDEX IF NOT EXISTS idx_patients_owner_user_lookup ON patients(owner_id) WHERE is_active = true;

-- VERIFICATION QUERIES:
-- After running this script, you can verify the policies were created with:
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- FILE ORGANIZATION:
-- Photos will be organized as: pet-diary-photos/{patient_id}/{timestamp}_{index}.{extension}
-- Example: pet-diary-photos/1/1672531200000_0.jpg
-- This ensures each pet's photos are in separate folders and prevents filename conflicts
