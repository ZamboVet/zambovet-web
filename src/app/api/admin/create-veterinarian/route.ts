import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// Create a Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

function generateSecurePassword(): string {
    // Generate cryptographically secure random password
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    const randomBytes = crypto.randomBytes(length);
    let password = '';
    
    for (let i = 0; i < length; i++) {
        password += charset[randomBytes[i] % charset.length];
    }
    
    // Ensure password meets requirements
    return password + '!A1';
}

export async function POST(request: NextRequest) {
  console.log('POST request received at /api/admin/create-veterinarian');
  
  try {
    // First, authenticate the user
    const cookieStore = await cookies();
    const supabaseClient = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('user_role')
      .eq('id', user.id)
      .single();
      
    if (!profile || profile.user_role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }
    
    // Check if environment variables are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('NEXT_PUBLIC_SUPABASE_URL environment variable is not set');
      return NextResponse.json(
        { error: 'Configuration error' },
        { status: 500 }
      );
    }
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'Configuration error' },
        { status: 500 }
      );
    }

    console.log('Environment variables are set, parsing request body...');
    const body = await request.json();
    console.log('Request body parsed:', { ...body, password: '[HIDDEN]' });
    
    const {
      email,
      full_name,
      password,
      specialization,
      license_number,
      years_experience,
      consultation_fee,
      clinic_id
    } = body;

    // Input sanitization and validation
    const sanitizedEmail = email?.toLowerCase().trim();
    const sanitizedFullName = full_name?.trim();
    const sanitizedSpecialization = specialization?.trim();
    const sanitizedLicenseNumber = license_number?.trim();
    
    // Validate required fields
    if (!sanitizedEmail || !sanitizedFullName || !password) {
      return NextResponse.json(
        { error: 'Email, full name, and password are required' },
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }
    
    // Validate numeric fields
    const numericYearsExperience = Math.max(0, parseInt(years_experience?.toString() || '0'));
    const numericConsultationFee = Math.max(0, parseFloat(consultation_fee?.toString() || '0'));
    const numericClinicId = clinic_id ? parseInt(clinic_id.toString()) : null;

    console.log('Starting user creation process...');

    // 1. Create the auth user using admin client
    const { data: authData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: sanitizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: sanitizedFullName,
        user_role: 'veterinarian'
      }
    });

    if (createUserError) {
      console.error('Auth creation error:', createUserError);
      return NextResponse.json(
        { error: 'Failed to create user account: ' + createUserError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      console.error('No user data returned from auth creation');
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 400 }
      );
    }

    console.log('Auth user created successfully:', authData.user.id);

    try {
      console.log('Creating profile record...');
      // 2. Create profile record
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: sanitizedEmail,
          full_name: sanitizedFullName,
          user_role: 'veterinarian',
          is_active: true
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Clean up auth user if profile creation fails
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json(
          { error: 'Failed to create profile: ' + profileError.message },
          { status: 400 }
        );
      }

      console.log('Profile created successfully, creating veterinarian record...');
      // 3. Create veterinarian record
      const { error: vetError } = await supabaseAdmin
        .from('veterinarians')
        .insert({
          user_id: authData.user.id,
          clinic_id: numericClinicId,
          full_name: sanitizedFullName,
          specialization: sanitizedSpecialization || null,
          license_number: sanitizedLicenseNumber || null,
          years_experience: numericYearsExperience,
          consultation_fee: numericConsultationFee,
          is_available: true,
          average_rating: 0.00
        });

      if (vetError) {
        console.error('Veterinarian creation error:', vetError);
        // Clean up previous records if veterinarian creation fails
        await supabaseAdmin.from('profiles').delete().eq('id', authData.user.id);
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json(
          { error: 'Failed to create veterinarian record: ' + vetError.message },
          { status: 400 }
        );
      }

      console.log('Veterinarian record created successfully');
      // 4. Send password to veterinarian via email (optional - could be implemented later)
      // For now, we'll return success

      return NextResponse.json({
        success: true,
        message: 'Veterinarian created successfully',
        data: {
          user_id: authData.user.id,
          email: sanitizedEmail,
          full_name: sanitizedFullName
        }
      });

    } catch (dbError) {
      console.error('Database operation error:', dbError);
      // Clean up auth user if database operations fail
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError);
      }
      return NextResponse.json(
        { error: 'Database operation failed: ' + (dbError as Error).message },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
