# Test Storage Bucket Setup
# Run this script after completing the dashboard setup to verify everything is working

Write-Host "Testing Pet Diary Photos Storage Setup..." -ForegroundColor Green

# Test 1: Check if bucket exists
Write-Host "`n1. Checking if bucket exists..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "https://pfhgslnozindfcgsofvl.supabase.co/storage/v1/bucket/pet-diary-photos" -Headers @{
        "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmaGdzbG5vemluZGZjZ3NvZnZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTA3NTM1MCwiZXhwIjoyMDY2NjUxMzUwfQ._Axke5xFawml-Isc0MzZ4rsDsY-lcwG2HTLUg2jk0gA"
        "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmaGdzbG5vemluZGZjZ3NvZnZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTA3NTM1MCwiZXhwIjoyMDY2NjUxMzUwfQ._Axke5xFawml-Isc0MzZ4rsDsY-lcwG2HTLUg2jk0gA"
    } -Method Get
    Write-Host "✅ Bucket 'pet-diary-photos' exists!" -ForegroundColor Green
    Write-Host "   - Bucket ID: $($response.id)" -ForegroundColor Gray
    Write-Host "   - Public: $($response.public)" -ForegroundColor Gray
    Write-Host "   - File size limit: $($response.file_size_limit) bytes" -ForegroundColor Gray
} catch {
    Write-Host "❌ Bucket 'pet-diary-photos' not found or not accessible" -ForegroundColor Red
    Write-Host "   Please create the bucket via Supabase Dashboard first" -ForegroundColor Red
    exit 1
}

# Test 2: Check storage policies
Write-Host "`n2. Checking storage policies..." -ForegroundColor Yellow

try {
    $policies = Invoke-RestMethod -Uri "https://pfhgslnozindfcgsofvl.supabase.co/rest/v1/pg_policies?select=*&schemaname=eq.storage&tablename=eq.objects" -Headers @{
        "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmaGdzbG5vemluZGZjZ3NvZnZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTA3NTM1MCwiZXhwIjoyMDY2NjUxMzUwfQ._Axke5xFawml-Isc0MzZ4rsDsY-lcwG2HTLUg2jk0gA"
        "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmaGdzbG5vemluZGZjZ3NvZnZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTA3NTM1MCwiZXhwIjoyMDY2NjUxMzUwfQ._Axke5xFawml-Isc0MzZ4rsDsY-lcwG2HTLUg2jk0gA"
    } -Method Get

    $diaryPolicies = $policies | Where-Object { $_.policyname -like "*diary*" }
    
    if ($diaryPolicies.Count -ge 4) {
        Write-Host "✅ Found $($diaryPolicies.Count) diary-related storage policies" -ForegroundColor Green
        foreach ($policy in $diaryPolicies) {
            Write-Host "   - $($policy.policyname) ($($policy.cmd))" -ForegroundColor Gray
        }
    } else {
        Write-Host "⚠️  Only found $($diaryPolicies.Count) diary policies (expected 4)" -ForegroundColor Yellow
        Write-Host "   Please check that all storage policies are created correctly" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Could not check storage policies" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Check patient data for testing
Write-Host "`n3. Checking available test data..." -ForegroundColor Yellow

try {
    $patients = Invoke-RestMethod -Uri "https://pfhgslnozindfcgsofvl.supabase.co/rest/v1/patients?select=id,name,owner_id&limit=5" -Headers @{
        "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmaGdzbG5vemluZGZjZ3NvZnZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTA3NTM1MCwiZXhwIjoyMDY2NjUxMzUwfQ._Axke5xFawml-Isc0MzZ4rsDsY-lcwG2HTLUg2jk0gA"
        "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmaGdzbG5vemluZGZjZ3NvZnZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTA3NTM1MCwiZXhwIjoyMDY2NjUxMzUwfQ._Axke5xFawml-Isc0MzZ4rsDsY-lcwG2HTLUg2jk0gA"
    } -Method Get

    Write-Host "✅ Found $($patients.Count) test patients available" -ForegroundColor Green
    foreach ($patient in $patients) {
        Write-Host "   - Patient ID: $($patient.id), Name: $($patient.name), Owner: $($patient.owner_id)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Could not fetch patient data" -ForegroundColor Red
}

# Test 4: Verify storage bucket accessibility
Write-Host "`n4. Testing bucket accessibility..." -ForegroundColor Yellow

try {
    $bucketList = Invoke-RestMethod -Uri "https://pfhgslnozindfcgsofvl.supabase.co/storage/v1/bucket" -Headers @{
        "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmaGdzbG5vemluZGZjZ3NvZnZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTA3NTM1MCwiZXhwIjoyMDY2NjUxMzUwfQ._Axke5xFawml-Isc0MzZ4rsDsY-lcwG2HTLUg2jk0gA"
        "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmaGdzbG5vemluZGZjZ3NvZnZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTA3NTM1MCwiZXhwIjoyMDY2NjUxMzUwfQ._Axke5xFawml-Isc0MzZ4rsDsY-lcwG2HTLUg2jk0gA"
    } -Method Get

    $petDiaryBucket = $bucketList | Where-Object { $_.name -eq "pet-diary-photos" }
    
    if ($petDiaryBucket) {
        Write-Host "✅ Storage bucket is properly configured" -ForegroundColor Green
        Write-Host "   - Public: $($petDiaryBucket.public)" -ForegroundColor Gray
        Write-Host "   - Created: $($petDiaryBucket.created_at)" -ForegroundColor Gray
    } else {
        Write-Host "❌ pet-diary-photos bucket not found in bucket list" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Could not access storage buckets" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host "Storage Setup Test Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. If all tests passed ✅, your storage is ready!" -ForegroundColor White
Write-Host "2. Start your development server: npm run dev" -ForegroundColor White
Write-Host "3. Log in as a pet owner and test photo uploads" -ForegroundColor White
Write-Host "4. Create a diary entry and try uploading photos" -ForegroundColor White
Write-Host ""
Write-Host "If any tests failed ❌:" -ForegroundColor Yellow
Write-Host "- Review the STORAGE_SETUP_GUIDE.md file" -ForegroundColor White
Write-Host "- Check your Supabase Dashboard settings" -ForegroundColor White
Write-Host "- Ensure all storage policies are created" -ForegroundColor White