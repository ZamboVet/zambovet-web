import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import rateLimiter, { RATE_LIMITS, getClientIP } from '@/lib/rateLimiter';
import { sanitizeText, validateAndSanitizeId } from '@/lib/sanitize';

export async function POST(request: Request) {
    try {
        // Rate limiting
        const clientIP = getClientIP(request);
        const rateLimitKey = `appointments:${clientIP}`;
        
        if (!rateLimiter.isAllowed(rateLimitKey, RATE_LIMITS.API.requests, RATE_LIMITS.API.windowMs)) {
            const remainingTime = rateLimiter.getRemainingTime(rateLimitKey);
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.', retryAfter: Math.ceil(remainingTime / 1000) },
                { status: 429 }
            );
        }
        
        console.log('Appointments API: Starting appointment creation');
        
        const cookieStore = await cookies();
        console.log('Appointments API: Cookie store available:', !!cookieStore);
        console.log('Appointments API: Cookies found:', cookieStore.getAll().map(c => c.name));
        
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            );
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        );
        
        // Get the current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        console.log('Appointments API: Auth result - user:', user?.id, 'error:', authError);
        
        if (authError || !user) {
            console.log('Appointments API: Authentication failed - authError:', authError, 'user:', user);
            
            // Try to get session to see if there's a session but no user
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            console.log('Appointments API: Session check - session:', !!session, 'error:', sessionError);
            
            return NextResponse.json(
                { error: 'Authentication failed: Auth session missing!' },
                { status: 401 }
            );
        }

        console.log('Appointments API: User authenticated:', user.id);

        const body = await request.json();
        const {
            patient_id,
            veterinarian_id,
            clinic_id,
            appointment_date,
            appointment_time,
            reason_for_visit,
            symptoms,
            estimated_duration = 30,
            total_amount = 0
        } = body;
        
        // Sanitize inputs
        const sanitizedPatientId = validateAndSanitizeId(patient_id);
        const sanitizedVeterinarianId = validateAndSanitizeId(veterinarian_id);
        const sanitizedClinicId = validateAndSanitizeId(clinic_id);
        const sanitizedReason = sanitizeText(reason_for_visit);
        const sanitizedSymptoms = sanitizeText(symptoms);

        console.log('Appointments API: Request body:', body);

        // Validate required fields with sanitized values
        if (!sanitizedPatientId || !sanitizedVeterinarianId || !sanitizedClinicId || !appointment_date || !appointment_time) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }
        
        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
        if (!dateRegex.test(appointment_date) || !timeRegex.test(appointment_time)) {
            return NextResponse.json(
                { error: 'Invalid date or time format' },
                { status: 400 }
            );
        }

        // Get pet owner profile
        const { data: petOwnerProfile, error: profileError } = await supabase
            .from('pet_owner_profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (profileError || !petOwnerProfile) {
            console.log('Appointments API: Pet owner profile not found - error:', profileError);
            return NextResponse.json(
                { error: 'Pet owner profile not found' },
                { status: 404 }
            );
        }

        console.log('Appointments API: Pet owner profile found:', petOwnerProfile.id);

        // Verify that the user owns the pet
        const { data: pet, error: petError } = await supabase
            .from('patients')
            .select('owner_id')
            .eq('id', sanitizedPatientId)
            .single();

        if (petError || !pet || pet.owner_id !== petOwnerProfile.id) {
            console.log('Appointments API: Pet ownership verification failed - pet:', pet, 'error:', petError);
            return NextResponse.json(
                { error: 'Unauthorized to book appointment for this pet' },
                { status: 403 }
            );
        }

        console.log('Appointments API: Pet ownership verified');

        // Check if the veterinarian is available
        const { data: veterinarian } = await supabase
            .from('veterinarians')
            .select('is_available')
            .eq('id', sanitizedVeterinarianId)
            .single();

        if (!veterinarian || !veterinarian.is_available) {
            return NextResponse.json(
                { error: 'Selected veterinarian is not available' },
                { status: 400 }
            );
        }

        // Check for conflicting appointments
        const { data: conflictingAppointments } = await supabase
            .from('appointments')
            .select('id')
            .eq('veterinarian_id', sanitizedVeterinarianId)
            .eq('appointment_date', appointment_date)
            .eq('appointment_time', appointment_time)
            .in('status', ['pending', 'confirmed']);

        if (conflictingAppointments && conflictingAppointments.length > 0) {
            return NextResponse.json(
                { error: 'Selected time slot is not available' },
                { status: 400 }
            );
        }

        // Check appointment limit for pet owner (5 appointments per day)
        const { data: dailyAppointments, error: dailyAppointmentsError } = await supabase
            .from('appointments')
            .select('id')
            .eq('pet_owner_id', petOwnerProfile.id)
            .eq('appointment_date', appointment_date)
            .in('status', ['pending', 'confirmed', 'in_progress']);

        if (dailyAppointmentsError) {
            console.error('Error checking daily appointments:', dailyAppointmentsError);
            return NextResponse.json(
                { error: 'Failed to check appointment limit' },
                { status: 500 }
            );
        }

        if (dailyAppointments && dailyAppointments.length >= 5) {
            return NextResponse.json(
                { error: 'You have reached the daily appointment limit of 5 appointments. Please try booking for another date.' },
                { status: 400 }
            );
        }

        // Create the appointment with sanitized data
        const { data: appointment, error: insertError } = await supabase
            .from('appointments')
            .insert({
                pet_owner_id: petOwnerProfile.id,
                patient_id: sanitizedPatientId,
                veterinarian_id: sanitizedVeterinarianId,
                clinic_id: sanitizedClinicId,
                appointment_date,
                appointment_time,
                reason_for_visit: sanitizedReason,
                symptoms: sanitizedSymptoms,
                status: 'pending',
                booking_type: 'web',
                estimated_duration: Math.max(15, Math.min(180, parseInt(estimated_duration?.toString() || '30'))),
                total_amount: Math.max(0, parseFloat(total_amount?.toString() || '0')),
                payment_status: 'pending'
            })
            .select()
            .single();

        if (insertError) {
            console.error('Appointments API: Error creating appointment:', insertError);
            return NextResponse.json(
                { error: 'Failed to create appointment' },
                { status: 500 }
            );
        }

        console.log('Appointments API: Appointment created successfully:', appointment);

        return NextResponse.json({
            success: true,
            message: 'Appointment created successfully',
            data: appointment
        });

    } catch (error) {
        console.error('Appointments API: Appointment creation error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            );
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        );
        
        // Get the current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '10');
        const page = parseInt(searchParams.get('page') || '1');

        // Get user's pet owner profile
        const { data: petOwnerProfile } = await supabase
            .from('pet_owner_profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!petOwnerProfile) {
            return NextResponse.json(
                { error: 'Pet owner profile not found' },
                { status: 404 }
            );
        }

        // Build query
        let query = supabase
            .from('appointments')
            .select(`
                *,
                patients(name, species, breed),
                veterinarians(full_name, specialization),
                clinics(name, address)
            `)
            .eq('pet_owner_id', petOwnerProfile.id);

        if (status) {
            query = query.eq('status', status);
        }

        // Add pagination
        const offset = (page - 1) * limit;
        query = query.range(offset, offset + limit - 1);
        query = query.order('appointment_date', { ascending: true });
        query = query.order('appointment_time', { ascending: true });

        const { data: appointments, error } = await query;

        if (error) {
            console.error('Error fetching appointments:', error);
            return NextResponse.json(
                { error: 'Failed to fetch appointments' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: appointments
        });

    } catch (error) {
        console.error('Appointments API: Error in GET:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 