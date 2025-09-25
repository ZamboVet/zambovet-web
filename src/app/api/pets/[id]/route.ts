import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// GET - View single pet
export async function GET(request: Request, { params }: { params: { id: string } }) {
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
                            // Handle error silently
                        }
                    },
                },
            }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Get pet owner profile
        const { data: petOwnerProfile, error: profileError } = await supabase
            .from('pet_owner_profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (profileError || !petOwnerProfile) {
            return NextResponse.json(
                { error: 'Pet owner profile not found' },
                { status: 404 }
            );
        }

        // Get pet details
        const { data: pet, error: petError } = await supabase
            .from('patients')
            .select('*')
            .eq('id', params.id)
            .eq('owner_id', petOwnerProfile.id)
            .single();

        if (petError || !pet) {
            return NextResponse.json(
                { error: 'Pet not found or unauthorized' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: pet
        });

    } catch (error) {
        console.error('Error fetching pet:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT - Update pet
export async function PUT(request: Request, { params }: { params: { id: string } }) {
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
                            // Handle error silently
                        }
                    },
                },
            }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { name, species, breed, gender, date_of_birth, weight, medical_conditions } = body;

        // Get pet owner profile
        const { data: petOwnerProfile, error: profileError } = await supabase
            .from('pet_owner_profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (profileError || !petOwnerProfile) {
            return NextResponse.json(
                { error: 'Pet owner profile not found' },
                { status: 404 }
            );
        }

        // Update pet
        const { data: updatedPet, error: updateError } = await supabase
            .from('patients')
            .update({
                name,
                species,
                breed,
                gender,
                date_of_birth: date_of_birth || null,
                weight: weight ? parseFloat(weight) : null,
                medical_conditions,
                updated_at: new Date().toISOString()
            })
            .eq('id', params.id)
            .eq('owner_id', petOwnerProfile.id)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating pet:', updateError);
            return NextResponse.json(
                { error: 'Failed to update pet' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Pet updated successfully',
            data: updatedPet
        });

    } catch (error) {
        console.error('Error updating pet:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE - Delete pet
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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
                            // Handle error silently
                        }
                    },
                },
            }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Get pet owner profile
        const { data: petOwnerProfile, error: profileError } = await supabase
            .from('pet_owner_profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (profileError || !petOwnerProfile) {
            return NextResponse.json(
                { error: 'Pet owner profile not found' },
                { status: 404 }
            );
        }

        // Get pet info before deletion for response
        const { data: pet, error: getPetError } = await supabase
            .from('patients')
            .select('name')
            .eq('id', params.id)
            .eq('owner_id', petOwnerProfile.id)
            .single();

        if (getPetError || !pet) {
            return NextResponse.json(
                { error: 'Pet not found or unauthorized' },
                { status: 404 }
            );
        }

        // Soft delete by setting is_active to false
        const { error: deleteError } = await supabase
            .from('patients')
            .update({ 
                is_active: false,
                updated_at: new Date().toISOString()
            })
            .eq('id', params.id)
            .eq('owner_id', petOwnerProfile.id);

        if (deleteError) {
            console.error('Error deleting pet:', deleteError);
            return NextResponse.json(
                { error: 'Failed to delete pet' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `${pet.name} has been removed from your pets`
        });

    } catch (error) {
        console.error('Error deleting pet:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
