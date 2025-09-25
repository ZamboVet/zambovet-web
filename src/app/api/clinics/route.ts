import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
        
        const { searchParams } = new URL(request.url);
        const searchQuery = searchParams.get('search') || '';
        const specialty = searchParams.get('specialty') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = (page - 1) * limit;

        // Build the query
        let query = supabase
            .from('clinics')
            .select(`
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
                veterinarians (
                    id,
                    full_name,
                    specialization,
                    license_number,
                    years_experience,
                    consultation_fee,
                    is_available,
                    average_rating
                )
            `)
            .eq('is_active', true);

        // Apply filters
        if (searchQuery) {
            query = query.or(`name.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`);
        }


        // Apply pagination
        query = query.range(offset, offset + limit - 1);
        query = query.order('name', { ascending: true });

        const { data: clinics, error: clinicsError } = await query;

        if (clinicsError) {
            console.error('Error fetching clinics:', clinicsError);
            return NextResponse.json(
                { error: 'Failed to fetch clinics' },
                { status: 500 }
            );
        }

        // Filter veterinarians by specialty if specified
        let filteredClinics = clinics;
        if (specialty && specialty !== '') {
            filteredClinics = clinics?.filter(clinic => 
                clinic.veterinarians && clinic.veterinarians.some((vet: any) => 
                    vet.specialization?.toLowerCase().includes(specialty.toLowerCase())
                )
            ) || [];
        }

        // Get total count for pagination
        let countQuery = supabase
            .from('clinics')
            .select('id', { count: 'exact' })
            .eq('is_active', true);

        if (searchQuery) {
            countQuery = countQuery.or(`name.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`);
        }


        const { count } = await countQuery;

        return NextResponse.json({
            success: true,
            data: {
                clinics: filteredClinics,
                pagination: {
                    page,
                    limit,
                    total: count || 0,
                    totalPages: Math.ceil((count || 0) / limit)
                }
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
