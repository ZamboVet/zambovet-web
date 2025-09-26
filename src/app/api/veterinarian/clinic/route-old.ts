import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        console.log('Veterinarian Clinic API: Starting request');
        
        const cookieStore = await cookies();
        console.log('Veterinarian Clinic API: Available cookies:', 
            cookieStore.getAll().map(c => ({ name: c.name, hasValue: !!c.value, length: c.value?.length })));
        
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

        console.log('Veterinarian Clinic API: Supabase client created');

        // Get the current user with detailed error logging
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        console.log('Veterinarian Clinic API: Auth result:', {
            user: user ? { id: user.id, email: user.email } : null,
            error: userError?.message
        });

        if (userError || !user) {
            console.error('Authentication error:', userError);
            
            // Try to get session as fallback
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            console.log('Veterinarian Clinic API: Session fallback:', {
                session: session ? { user_id: session.user?.id } : null,
                error: sessionError?.message
            });
            
            return NextResponse.json(
                { 
                    error: 'Unauthorized', 
                    details: userError?.message || 'No valid session found',
                    debug: {
                        hasUser: !!user,
                        hasSession: !!session,
                        userError: userError?.message,
                        sessionError: sessionError?.message
                    }
                },
                { status: 401 }
            );
        }

        // Get veterinarian profile with clinic information
        const { data: vetData, error: vetError } = await supabase
            .from('veterinarians')
            .select(`
                id,
                clinic_id,
                full_name,
                specialization,
                license_number,
                years_experience,
                consultation_fee,
                is_available,
                average_rating,
                clinics (
                    id,
                    name,
                    address,
                    phone,
                    email,
                    latitude,
                    longitude,
                    operating_hours,
                    is_active,
                    created_at,
                    updated_at
                )
            `)
            .eq('user_id', user.id)
            .single();

        if (vetError) {
            console.error('Error fetching veterinarian data:', vetError);
            return NextResponse.json(
                { error: 'Failed to fetch veterinarian data' },
                { status: 500 }
            );
        }

        if (!vetData) {
            return NextResponse.json(
                { error: 'Veterinarian profile not found' },
                { status: 404 }
            );
        }

        // Return the veterinarian and clinic data
        return NextResponse.json({
            success: true,
            data: {
                veterinarian: {
                    id: vetData.id,
                    clinic_id: vetData.clinic_id,
                    full_name: vetData.full_name,
                    specialization: vetData.specialization,
                    license_number: vetData.license_number,
                    years_experience: vetData.years_experience,
                    consultation_fee: vetData.consultation_fee,
                    is_available: vetData.is_available,
                    average_rating: vetData.average_rating
                },
                clinic: vetData.clinics ? {
                    id: vetData.clinics.id,
                    name: vetData.clinics.name,
                    address: vetData.clinics.address,
                    phone: vetData.clinics.phone,
                    email: vetData.clinics.email,
                    latitude: vetData.clinics.latitude,
                    longitude: vetData.clinics.longitude,
                    operating_hours: vetData.clinics.operating_hours,
                    is_active: vetData.clinics.is_active,
                    created_at: vetData.clinics.created_at,
                    updated_at: vetData.clinics.updated_at
                } : null
            }
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Update clinic information
export async function PUT(request: Request) {
    try {
        console.log('Veterinarian Clinic API PUT: Starting request');
        
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
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        console.log('Veterinarian Clinic API PUT: Auth result:', {
            user: user ? { id: user.id, email: user.email } : null,
            error: userError?.message
        });

        if (userError || !user) {
            console.error('Authentication error:', userError);
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { name, address, phone, email, latitude, longitude, operating_hours } = body;

        // Validate required fields
        if (!name || !address) {
            return NextResponse.json(
                { error: 'Clinic name and address are required' },
                { status: 400 }
            );
        }

        // Get veterinarian profile
        const { data: vetData, error: vetError } = await supabase
            .from('veterinarians')
            .select('id, clinic_id')
            .eq('user_id', user.id)
            .single();

        if (vetError || !vetData) {
            return NextResponse.json(
                { error: 'Veterinarian profile not found' },
                { status: 404 }
            );
        }

        let clinicResult;

        if (vetData.clinic_id) {
            // Update existing clinic
            const { data: updatedClinic, error: updateError } = await supabase
                .from('clinics')
                .update({
                    name,
                    address,
                    phone,
                    email,
                    latitude,
                    longitude,
                    operating_hours,
                    updated_at: new Date().toISOString()
                })
                .eq('id', vetData.clinic_id)
                .select()
                .single();

            if (updateError) {
                console.error('Error updating clinic:', updateError);
                return NextResponse.json(
                    { error: 'Failed to update clinic information' },
                    { status: 500 }
                );
            }

            clinicResult = updatedClinic;
        } else {
            // Create new clinic
            const { data: newClinic, error: createError } = await supabase
                .from('clinics')
                .insert({
                    name,
                    address,
                    phone,
                    email,
                    latitude,
                    longitude,
                    operating_hours,
                    is_active: true
                })
                .select()
                .single();

            if (createError) {
                console.error('Error creating clinic:', createError);
                return NextResponse.json(
                    { error: 'Failed to create clinic' },
                    { status: 500 }
                );
            }

            // Link the clinic to the veterinarian
            const { error: linkError } = await supabase
                .from('veterinarians')
                .update({
                    clinic_id: newClinic.id,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', user.id);

            if (linkError) {
                console.error('Error linking clinic to veterinarian:', linkError);
                return NextResponse.json(
                    { error: 'Failed to link clinic to veterinarian' },
                    { status: 500 }
                );
            }

            clinicResult = newClinic;
        }

        return NextResponse.json({
            success: true,
            message: vetData.clinic_id ? 'Clinic updated successfully' : 'Clinic created successfully',
            data: {
                clinic: clinicResult
            }
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
