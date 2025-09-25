# Pet Diary Photos Storage Setup Guide

This guide will help you set up the storage bucket for pet diary photos in your Supabase project.

## Overview

The pet diary feature needs a dedicated storage bucket to store photos uploaded by pet owners. Since storage policies require special permissions, this setup must be done through the Supabase Dashboard interface.

## Step-by-Step Setup

### Step 1: Access Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Log in with your Supabase account
3. Select your project: **pfhgslnozindfcgsofvl** (Zambovet)

### Step 2: Create the Storage Bucket

1. In the left sidebar, click on **Storage**
2. Click the **+ New bucket** button
3. Configure the bucket with these settings:
   - **Name**: `pet-diary-photos`
   - **Public**: `false` (unchecked)
   - **File size limit**: `5242880` (5MB in bytes)
   - **Allowed MIME types**: `image/jpeg,image/png,image/gif,image/webp`
4. Click **Create bucket**

### Step 3: Create Storage Policies

After creating the bucket, you need to set up Row Level Security (RLS) policies:

1. Still in the **Storage** section, click on your newly created `pet-diary-photos` bucket
2. Click on the **Policies** tab
3. Click **+ New policy**

#### Policy 1: Upload Photos
- **Policy name**: `Pet owners can upload diary photos`
- **Policy type**: `INSERT`
- **Target roles**: `authenticated`
- **USING expression**:
```sql
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
```

#### Policy 2: View Photos
- **Policy name**: `Pet owners can view diary photos`
- **Policy type**: `SELECT`
- **Target roles**: `authenticated`
- **USING expression**:
```sql
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
```

#### Policy 3: Update Photos
- **Policy name**: `Pet owners can update diary photos`
- **Policy type**: `UPDATE`
- **Target roles**: `authenticated`
- **USING expression**:
```sql
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
```

#### Policy 4: Delete Photos
- **Policy name**: `Pet owners can delete diary photos`
- **Policy type**: `DELETE`
- **Target roles**: `authenticated`
- **USING expression**:
```sql
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
```

### Step 4: Verify Setup

After creating all policies, verify your setup:

1. Go to **Storage** → `pet-diary-photos` bucket
2. Check that you see 4 policies listed in the Policies tab
3. The bucket should show as "Private" with RLS enabled

## How It Works

### File Organization
Photos are organized in the bucket using this structure:
```
pet-diary-photos/
├── {patient_id}/
│   ├── {timestamp}_0.jpg
│   ├── {timestamp}_1.png
│   └── {timestamp}_2.gif
```

### Security
- Only authenticated users can access the storage
- Pet owners can only upload/view/modify photos for their own pets
- Photos are organized by `patient_id` to ensure proper isolation
- Each pet's photos are stored in their own folder

### File Naming
- Format: `{timestamp}_{index}.{extension}`
- Example: `1672531200000_0.jpg`
- This prevents filename conflicts and maintains chronological order

## Testing

After setup, test the photo upload feature:

1. Log in to your application as a pet owner
2. Go to the pet diary section
3. Create a new diary entry
4. Try uploading an image
5. Verify the image appears in the entry after saving

## Troubleshooting

### Common Issues:

**Issue**: "Photo upload failed: Failed to upload"
- **Solution**: Check that the bucket name is exactly `pet-diary-photos`
- **Solution**: Verify all 4 storage policies are created correctly

**Issue**: "Access denied" errors
- **Solution**: Ensure the user is properly authenticated
- **Solution**: Check that the user has a `pet_owner_profile` record

**Issue**: Photos not displaying
- **Solution**: Verify the bucket is set to the correct privacy settings
- **Solution**: Check that the SELECT policy is working correctly

### Verification Queries

You can run these in the Supabase SQL Editor to verify your setup:

```sql
-- Check if bucket exists
SELECT * FROM storage.buckets WHERE name = 'pet-diary-photos';

-- Check storage policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- Test patient lookup (replace with actual user ID)
SELECT DISTINCT patient_id::text 
FROM patients 
WHERE owner_id IN (
  SELECT id 
  FROM pet_owner_profiles 
  WHERE user_id = '44907ccd-09ed-4ef8-9ae3-54ffda9e0106'
);
```

## File Size and Type Restrictions

- **Maximum file size**: 5MB per photo
- **Supported formats**: JPEG, PNG, GIF, WebP
- **Maximum photos per entry**: 6 photos
- **File validation**: Handled automatically by the upload component

Once this setup is complete, the photo upload feature will be fully functional in your pet diary application! 🐾📸