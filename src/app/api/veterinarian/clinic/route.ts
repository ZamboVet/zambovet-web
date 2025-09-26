import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
    try {
        console.log('Veterinarian Clinic API: Starting request');
        
        // Get authorization header
        const authHeader = request.headers.get('Authorization');
        console.log('Veterinarian Clinic API: Auth header present:', !!authHeader);
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Missing or invalid authorization header' },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);
        console.log('Veterinarian Clinic API: Token present:', !!token, 'length:', token.length);

        // Verify the JWT token
        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser(token);
            
            console.log('Veterinarian Clinic API: Auth result:', {
                user: user ? { id: user.id, email: user.email } : null,
                error: userError?.message
            });

            if (userError || !user) {
                console.error('Authentication failed:', userError);
                return NextResponse.json(
                    { error: 'Invalid token' },
                    { status: 401 }
                );
            }

            const userId = user.id;

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
                .eq('user_id', userId)
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

        } catch (authError) {
            console.error('Token verification failed:', authError);
            return NextResponse.json(
                { error: 'Authentication failed' },
                { status: 401 }
            );
        }

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Update clinic information
export async function PUT(request: NextRequest) {
    try {
        console.log('Veterinarian Clinic API PUT: Starting request');
        
        // Get authorization header
        const authHeader = request.headers.get('Authorization');
        console.log('Veterinarian Clinic API PUT: Auth header present:', !!authHeader);
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Missing or invalid authorization header' },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);
        console.log('Veterinarian Clinic API PUT: Token present:', !!token, 'length:', token.length);

        // Verify the JWT token
        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser(token);
            
            console.log('Veterinarian Clinic API PUT: Auth result:', {
                user: user ? { id: user.id, email: user.email } : null,
                error: userError?.message
            });

            if (userError || !user) {
                console.error('Authentication failed:', userError);
                return NextResponse.json(
                    { error: 'Invalid token' },
                    { status: 401 }
                );
            }

            const userId = user.id;

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
                .eq('user_id', userId)
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
                    .eq('user_id', userId);

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

        } catch (authError) {
            console.error('Token verification failed:', authError);
            return NextResponse.json(
                { error: 'Authentication failed' },
                { status: 401 }
            );
        }

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}