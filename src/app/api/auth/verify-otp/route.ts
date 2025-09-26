import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { 
  isValidOTPFormat, 
  isOTPExpired, 
  sanitizeOTP, 
  isValidEmail,
  OTP_CONFIG 
} from '@/lib/otpUtils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otpCode } = body;

    // Validate input
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Valid email is required' },
        { status: 400 }
      );
    }

    const sanitizedOTP = sanitizeOTP(otpCode);
    if (!isValidOTPFormat(sanitizedOTP)) {
      return NextResponse.json(
        { success: false, error: 'Invalid OTP format. Please enter 6 digits.' },
        { status: 400 }
      );
    }

    // Get OTP record from database
    const { data: otpRecord, error: fetchError } = await supabaseAdmin
      .from('otp_verification')
      .select('*')
      .eq('email', email)
      .eq('is_verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !otpRecord) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired OTP. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check if OTP has expired
    if (isOTPExpired(new Date(otpRecord.expires_at))) {
      // Clean up expired OTP
      await supabaseAdmin
        .from('otp_verification')
        .delete()
        .eq('id', otpRecord.id);

      return NextResponse.json(
        { success: false, error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check attempt limit
    if (otpRecord.attempts >= OTP_CONFIG.MAX_ATTEMPTS) {
      // Clean up OTP after max attempts
      await supabaseAdmin
        .from('otp_verification')
        .delete()
        .eq('id', otpRecord.id);

      return NextResponse.json(
        { success: false, error: 'Too many verification attempts. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Verify OTP code
    if (otpRecord.otp_code !== sanitizedOTP) {
      // Increment attempt count
      await supabaseAdmin
        .from('otp_verification')
        .update({ attempts: otpRecord.attempts + 1 })
        .eq('id', otpRecord.id);

      const remainingAttempts = OTP_CONFIG.MAX_ATTEMPTS - (otpRecord.attempts + 1);
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Incorrect OTP code. ${remainingAttempts} attempts remaining.`,
          remainingAttempts 
        },
        { status: 400 }
      );
    }

    // OTP is valid! Now create the user account
    const userData = otpRecord.verification_data;

    try {
      // Create Supabase user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.fullName,
          user_role: userData.userRole || 'pet_owner',
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        return NextResponse.json(
          { success: false, error: authError.message },
          { status: 400 }
        );
      }

      if (!authData.user) {
        return NextResponse.json(
          { success: false, error: 'Failed to create user account' },
          { status: 500 }
        );
      }

      // Create profile record
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: userData.email,
          full_name: userData.fullName,
          phone: userData.phone,
          user_role: userData.userRole || 'pet_owner',
          is_active: true
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        return NextResponse.json(
          { success: false, error: `Failed to create profile: ${profileError.message}` },
          { status: 500 }
        );
      }

      // Create pet owner profile (only for pet owners)
      if (userData.userRole === 'pet_owner' || !userData.userRole) {
        const { data: existingProfile } = await supabaseAdmin
          .from('pet_owner_profiles')
          .select('id')
          .eq('user_id', authData.user.id)
          .single();

        let petOwnerError;
        if (existingProfile) {
          const { error } = await supabaseAdmin
            .from('pet_owner_profiles')
            .update({
              full_name: userData.fullName,
              phone: userData.phone,
              address: userData.address,
              emergency_contact_name: userData.emergencyContactName || null,
              emergency_contact_phone: userData.emergencyContactPhone || null
            })
            .eq('user_id', authData.user.id);
          petOwnerError = error;
        } else {
          const { error } = await supabaseAdmin
            .from('pet_owner_profiles')
            .insert({
              user_id: authData.user.id,
              full_name: userData.fullName,
              phone: userData.phone,
              address: userData.address,
              emergency_contact_name: userData.emergencyContactName || null,
              emergency_contact_phone: userData.emergencyContactPhone || null
            });
          petOwnerError = error;
        }

        if (petOwnerError) {
          console.error('Pet owner profile creation error:', petOwnerError);
          return NextResponse.json(
            { success: false, error: `Failed to create pet owner profile: ${petOwnerError.message}` },
            { status: 500 }
          );
        }
      }

      // Mark OTP as verified and clean up
      await supabaseAdmin
        .from('otp_verification')
        .update({ is_verified: true })
        .eq('id', otpRecord.id);

      // Clean up verified OTP after a short delay (handled by database function)
      
      return NextResponse.json({
        success: true,
        message: 'Account created successfully!',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          full_name: userData.fullName,
          user_role: userData.userRole || 'pet_owner'
        }
      });

    } catch (accountError) {
      console.error('Account creation error:', accountError);
      return NextResponse.json(
        { success: false, error: 'Failed to create account. Please try again.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Verify OTP API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}