# Storage Policy Quick Reference

Copy and paste these exact expressions when creating policies in Supabase Dashboard.

## How to Create Policies

1. Go to: https://supabase.com/dashboard/project/pfhgslnozindfcgsofvl/storage/buckets
2. Click on the `pet-diary-photos` bucket
3. Click on the **Policies** tab
4. Click **+ New policy**
5. For each policy below:
   - Set the **Policy name** as shown
   - Set the **Policy type** as shown  
   - Set **Target roles** to `authenticated`
   - Copy the **USING expression** exactly

---

## Policy 1: Upload Photos

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

---

## Policy 2: View Photos

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

---

## Policy 3: Update Photos

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

---

## Policy 4: Delete Photos

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

---

## Verification

After creating all 4 policies, you should see them listed in the Policies tab. Then run:

```powershell
.\test_storage_setup.ps1
```

This will verify that everything is working correctly!