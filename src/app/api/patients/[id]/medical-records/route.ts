import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    console.log('Medical Records API: Starting request for patient:', resolvedParams.id);
    
    // Get Authorization header
    const authHeader = request.headers.get('authorization');
    console.log('Medical Records API: Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Medical Records API: No Bearer token found');
      return NextResponse.json(
        { error: 'Authentication required - No Bearer token' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Medical Records API: Token present:', !!token, 'length:', token.length);

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
    console.log('Medical Records API: Verifying token...');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    console.log('Medical Records API: Token verification result:', {
      user: user ? { id: user.id, email: user.email } : 'NULL',
      authError: authError?.message
    });
    
    if (authError || !user) {
      console.log('Medical Records API: Token verification failed');
      return NextResponse.json(
        { error: 'Authentication required - Invalid token' },
        { status: 401 }
      );
    }

    console.log('Medical Records API: User authenticated:', user.id);

    const patientId = resolvedParams.id;

    // Get user profile to check role using service role client
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Medical Records API: Profile error:', profileError);
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    console.log('Medical Records API: User profile:', { user_role: profile.user_role });

    let canAccessRecord = false;

    // Check access permissions based on user role
    if (profile.user_role === 'pet_owner') {
      // Pet owners can only access their own pets' records
      const { data: petOwnerProfile, error: ownerError } = await supabaseAdmin
        .from('pet_owner_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (ownerError || !petOwnerProfile) {
        return NextResponse.json(
          { error: 'Pet owner profile not found' },
          { status: 404 }
        );
      }

      // Check if this patient belongs to the current user
      const { data: patientOwnership, error: ownershipError } = await supabaseAdmin
        .from('patients')
        .select('owner_id')
        .eq('id', patientId)
        .eq('owner_id', petOwnerProfile.id)
        .single();

      canAccessRecord = !ownershipError && patientOwnership;
    } else if (profile.user_role === 'veterinarian' || profile.user_role === 'admin') {
      // Veterinarians and admins can access all records
      canAccessRecord = true;
    }

    if (!canAccessRecord) {
      return NextResponse.json(
        { error: 'Access denied - insufficient permissions' },
        { status: 403 }
      );
    }

    // Fetch comprehensive patient medical records using service role client
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .select(`
        *,
        pet_owner_profiles (
          id,
          user_id,
          full_name,
          phone,
          address,
          emergency_contact_name,
          emergency_contact_phone
        )
      `)
      .eq('id', patientId)
      .single();

    if (patientError || !patient) {
      console.error('Medical Records API: Patient not found:', patientError);
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Fetch appointment history with related data using service role client
    console.log('Medical Records API: Fetching appointments for patient:', patientId);
    const { data: appointments, error: appointmentsError } = await supabaseAdmin
      .from('appointments')
      .select(`
        *,
        veterinarians (
          full_name,
          specialization,
          license_number
        ),
        clinics (
          name,
          address,
          phone
        ),
        services (
          name,
          description,
          price
        )
      `)
      .eq('patient_id', patientId)
      .order('appointment_date', { ascending: false });

    console.log('Medical Records API: Appointments fetched:', { count: appointments?.length, error: appointmentsError });

    // Fetch reviews and ratings using service role client  
    console.log('Medical Records API: Fetching reviews for patient:', patientId);
    // Try both patient_id and pet_id column names
    const { data: reviews, error: reviewsError } = await supabaseAdmin
      .from('reviews')
      .select(`
        *,
        veterinarians (
          full_name,
          specialization
        ),
        appointments (
          appointment_date,
          reason_for_visit
        )
      `)
      .or(`patient_id.eq.${patientId},pet_id.eq.${patientId}`)
      .order('created_at', { ascending: false });

    console.log('Medical Records API: Reviews fetched:', { count: reviews?.length, error: reviewsError });

    // Fetch emergency requests using service role client
    console.log('Medical Records API: Fetching emergency requests for patient:', patientId);
    // Simplified query without relationships that might not exist
    const { data: emergencyRequests, error: emergencyError } = await supabaseAdmin
      .from('emergency_requests')
      .select('*')
      .or(`patient_id.eq.${patientId},pet_id.eq.${patientId}`)
      .order('request_time', { ascending: false });

    console.log('Medical Records API: Emergency requests fetched:', { count: emergencyRequests?.length, error: emergencyError });

    // Calculate age if date of birth is available
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
        formatted: years > 0 ? `${years} year${years > 1 ? 's' : ''} ${months > 0 ? `and ${months} month${months > 1 ? 's' : ''}` : ''}` : `${months} month${months > 1 ? 's' : ''}`
      };
    }

    // Prepare comprehensive medical record response
    const medicalRecord = {
      patient: {
        ...patient,
        age: ageInfo
      },
      owner: patient.pet_owner_profiles,
      appointments: appointments || [],
      reviews: reviews || [],
      emergencyRequests: emergencyRequests || [],
      statistics: {
        totalAppointments: appointments?.length || 0,
        completedAppointments: appointments?.filter(apt => apt.status === 'completed').length || 0,
        pendingAppointments: appointments?.filter(apt => apt.status === 'pending').length || 0,
        cancelledAppointments: appointments?.filter(apt => apt.status === 'cancelled').length || 0,
        averageRating: reviews && reviews.length > 0 
          ? (reviews.reduce((sum: number, review: any) => sum + (review.rating || 0), 0) / reviews.length).toFixed(1)
          : null,
        totalReviews: reviews?.length || 0,
        emergencyRequestsCount: emergencyRequests?.length || 0,
        lastAppointmentDate: appointments && appointments.length > 0 ? appointments[0].appointment_date : null,
        nextAppointmentDate: appointments?.find(apt => apt.status === 'confirmed' && new Date(apt.appointment_date) > new Date())?.appointment_date || null
      },
      medicalHistory: {
        conditions: patient.medical_conditions || [],
        vaccinations: patient.vaccination_records || [],
        lastUpdated: patient.updated_at
      }
    };

    return NextResponse.json({
      success: true,
      data: medicalRecord
    });

  } catch (error) {
    console.error('Error fetching patient medical records:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
