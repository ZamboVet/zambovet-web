import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    console.log('Patients API: Starting request');
    
    // Get Authorization header
    const authHeader = request.headers.get('authorization');
    console.log('Patients API: Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Patients API: No Bearer token found');
      return NextResponse.json(
        { error: 'Authentication required - No Bearer token' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Patients API: Token present:', !!token, 'length:', token.length);

    // Create a service role client for data operations
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {
            // No-op for service role
          },
        },
      }
    );

    // Verify the token and get user info
    console.log('Patients API: Verifying token...');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    console.log('Patients API: Token verification result:', {
      user: user ? { id: user.id, email: user.email } : 'NULL',
      authError: authError?.message
    });
    
    if (authError || !user) {
      console.log('Patients API: Token verification failed');
      return NextResponse.json(
        { error: 'Authentication required - Invalid token' },
        { status: 401 }
      );
    }

    console.log('Patients API: User authenticated:', user.id);

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Patients API: Profile error:', profileError);
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    console.log('Patients API: User profile:', { user_role: profile.user_role });

    // Only veterinarians and admins can access all patient records
    if (profile.user_role !== 'veterinarian' && profile.user_role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied - insufficient permissions' },
        { status: 403 }
      );
    }

    console.log('Patients API: Fetching patients...');

    // Fetch patients with owner information using service role
    const { data: patientsData, error: patientsError } = await supabaseAdmin
      .from('patients')
      .select(`
        *,
        pet_owner_profiles (
          id,
          full_name,
          phone,
          address,
          emergency_contact_name,
          emergency_contact_phone
        )
      `)
      .order('created_at', { ascending: false });

    if (patientsError) {
      console.error('Patients API: Error fetching patients:', patientsError);
      throw new Error(patientsError.message);
    }

    console.log('Patients API: Patients fetched:', patientsData?.length || 0);

    // Calculate age and fetch appointment statistics for each patient
    const patientsWithStats = await Promise.all(
      (patientsData || []).map(async (patient) => {
        // Calculate age
        let ageInfo = null;
        if (patient.date_of_birth) {
          const birthDate = new Date(patient.date_of_birth);
          const today = new Date();
          const ageInMilliseconds = today.getTime() - birthDate.getTime();
          const ageInDays = Math.floor(ageInMilliseconds / (1000 * 60 * 60 * 24));
          const years = Math.floor(ageInDays / 365);
          const months = Math.floor((ageInDays % 365) / 30);
          
          ageInfo = {
            years,
            months,
            totalDays: ageInDays,
            formatted: years > 0 
              ? `${years} year${years > 1 ? 's' : ''} ${months > 0 ? `and ${months} month${months > 1 ? 's' : ''}` : ''}` 
              : `${months} month${months > 1 ? 's' : ''}`
          };
        }

        // Get appointment statistics using service role
        const { data: appointments } = await supabaseAdmin
          .from('appointments')
          .select('id, appointment_date, status')
          .eq('patient_id', patient.id);

        // Get average rating using service role
        const { data: reviews } = await supabaseAdmin
          .from('reviews')
          .select('rating')
          .eq('patient_id', patient.id);

        const stats = {
          totalAppointments: appointments?.length || 0,
          lastAppointment: appointments && appointments.length > 0 
            ? appointments.sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())[0].appointment_date
            : undefined,
          averageRating: reviews && reviews.length > 0
            ? (reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length).toFixed(1)
            : undefined
        };

        return {
          ...patient,
          age: ageInfo,
          stats
        };
      })
    );

    console.log('Patients API: Success, returning', patientsWithStats.length, 'patients');

    return NextResponse.json({
      success: true,
      data: patientsWithStats
    });

  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}