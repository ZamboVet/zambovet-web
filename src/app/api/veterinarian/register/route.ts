import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendNotification } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  console.log('Veterinarian self-registration API called');
  
  try {
    const formData = await request.formData();
    
    // Extract form data
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;
    const specialization = formData.get('specialization') as string;
    const licenseNumber = formData.get('licenseNumber') as string;
    const yearsExperience = formData.get('yearsExperience') as string;
    const consultationFee = formData.get('consultationFee') as string;
    const businessPermit = formData.get('businessPermit') as File;
    const governmentId = formData.get('governmentId') as File;
    
    // Validate required fields
    if (!email || !password || !fullName || !phone || !licenseNumber || !businessPermit || !governmentId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }
    
    // Validate file types and sizes
    const validateFile = (file: File, fieldName: string) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      const maxSizeInMB = 5;
      
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`${fieldName} must be a valid image (JPEG, PNG) or PDF file`);
      }
      
      if (file.size > maxSizeInMB * 1024 * 1024) {
        throw new Error(`${fieldName} must be less than 5MB`);
      }
    };
    
    validateFile(businessPermit, 'Business Permit');
    validateFile(governmentId, 'Government ID');
    
    // Step 1: Create user account with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          user_role: 'veterinarian',
        }
      }
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      throw new Error('Failed to create user account: ' + authError.message);
    }

    if (!authData.user) {
      throw new Error('Failed to create user account - no user data returned');
    }

    const userId = authData.user.id;
    console.log('Auth user created successfully:', userId);

    try {
      // Step 2: Upload documents to Supabase Storage
      const uploadDocument = async (file: File, path: string) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}_${Date.now()}.${fileExt}`;
        const filePath = `${path}/${fileName}`;
        
        const { data, error } = await supabase.storage
          .from('veterinarian-documents')
          .upload(filePath, file);
          
        if (error) {
          throw new Error(`Failed to upload ${path}: ${error.message}`);
        }
        
        return filePath;
      };
      
      const businessPermitPath = await uploadDocument(businessPermit, 'business-permits');
      const governmentIdPath = await uploadDocument(governmentId, 'government-ids');
      
      console.log('Documents uploaded successfully');
      
      // Step 3: Create profile record with PENDING status
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: email.toLowerCase().trim(),
          full_name: fullName.trim(),
          phone: phone.trim(),
          user_role: 'veterinarian',
          is_active: false, // Account inactive until approved
          verification_status: 'pending'
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw new Error('Failed to create profile: ' + profileError.message);
      }
      
      // Step 4: Create veterinarian application record
      const { error: verificationError } = await supabase
        .from('veterinarian_applications')
        .insert({
          email: email.toLowerCase().trim(),
          full_name: fullName.trim(),
          phone: phone.trim(),
          specialization: specialization?.trim() || null,
          license_number: licenseNumber.trim(),
          years_experience: parseInt(yearsExperience) || 0,
          consultation_fee: parseFloat(consultationFee) || 0,
          business_permit_url: businessPermitPath,
          government_id_url: governmentIdPath,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (verificationError) {
        console.error('Verification record creation error:', verificationError);
        throw new Error('Failed to create verification record: ' + verificationError.message);
      }
      
      console.log('Veterinarian verification record created successfully');
      
      // Step 5: Send notifications
      try {
        // Send confirmation email to veterinarian
        await sendNotification('VET_REGISTRATION_PENDING', email.toLowerCase().trim(), {
          fullName: fullName.trim(),
          email: email.toLowerCase().trim(),
          licenseNumber: licenseNumber.trim(),
          specialization: specialization?.trim() || 'General Practice'
        });
        
        // Send notification to admins (if admin email is configured)
        if (process.env.ADMIN_EMAIL) {
          await sendNotification('ADMIN_NEW_VET_REGISTRATION', process.env.ADMIN_EMAIL, {
            fullName: fullName.trim(),
            email: email.toLowerCase().trim(),
            phone: phone.trim(),
            licenseNumber: licenseNumber.trim(),
            specialization: specialization?.trim() || 'General Practice',
            yearsExperience: parseInt(yearsExperience) || 0,
            consultationFee: parseFloat(consultationFee) || 0,
            submittedAt: new Date().toISOString()
          });
        }
        
        console.log('Notification emails sent successfully');
      } catch (emailError) {
        console.warn('Failed to send notification emails:', emailError);
        // Don't fail the registration if email sending fails
      }
      
      return NextResponse.json({
        success: true,
        message: 'Veterinarian registration submitted successfully. Your account is pending verification.',
        data: {
          user_id: userId,
          email: email.toLowerCase().trim(),
          full_name: fullName.trim(),
          verification_status: 'pending'
        }
      });
      
    } catch (dbError) {
      console.error('Database operation error:', dbError);
      // Clean up auth user if database operations fail
      try {
        await supabase.auth.admin.deleteUser(userId);
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError);
      }
      throw new Error('Registration failed: ' + (dbError as Error).message);
    }
    
  } catch (error) {
    console.error('Veterinarian registration error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message || 'Registration failed. Please try again.'
    }, { status: 500 });
  }
}
