import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function PUT(request: NextRequest) {
    try {
        console.log('Veterinarian Profile API PUT: Starting request');
        
        // Get authorization header
        const authHeader = request.headers.get('Authorization');
        console.log('Veterinarian Profile API PUT: Auth header present:', !!authHeader);
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Missing or invalid authorization header' },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);
        console.log('Veterinarian Profile API PUT: Token present:', !!token, 'length:', token.length);

        // Verify the JWT token
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        
        console.log('Veterinarian Profile API PUT: Auth result:', {
            user: user ? { id: user.id, email: user.email } : null,
            error: userError?.message
        });

        if (userError || !user) {
            console.error('Authentication failed:', userError);
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const userId = user.id;

            const body = await request.json();
            const { 
                fullName, 
                specialization, 
                licenseNumber, 
                yearsExperience, 
                consultationFee,
                phone
            } = body;

            console.log('Profile update request data:', {
                fullName,
                specialization,
                licenseNumber,
                yearsExperience,
                consultationFee,
                phone
            });

            // Validate required fields
            if (!fullName) {
                return NextResponse.json(
                    { error: 'Full name is required' },
                    { status: 400 }
                );
            }

            // Get veterinarian profile to ensure it exists
            const { data: vetData, error: vetError } = await supabase
                .from('veterinarians')
                .select('id')
                .eq('user_id', userId)
                .single();

            if (vetError || !vetData) {
                console.error('Veterinarian profile not found:', vetError);
                return NextResponse.json(
                    { error: 'Veterinarian profile not found' },
                    { status: 404 }
                );
            }

            // Update veterinarian profile
            const updateData: any = {
                full_name: fullName.trim(),
                updated_at: new Date().toISOString()
            };

            if (specialization !== undefined) {
                updateData.specialization = specialization.trim();
            }
            if (licenseNumber !== undefined) {
                updateData.license_number = licenseNumber.trim();
            }
            if (yearsExperience !== undefined && yearsExperience !== '') {
                updateData.years_experience = parseInt(yearsExperience);
            }
            if (consultationFee !== undefined && consultationFee !== '') {
                updateData.consultation_fee = parseFloat(consultationFee);
            }

            const { data: updatedVet, error: updateError } = await supabase
                .from('veterinarians')
                .update(updateData)
                .eq('user_id', userId)
                .select()
                .single();

            if (updateError) {
                console.error('Error updating veterinarian profile:', updateError);
                return NextResponse.json(
                    { error: 'Failed to update profile' },
                    { status: 500 }
                );
            }

            // Update profiles table as well for consistency
            const profileUpdateData: any = {
                full_name: fullName.trim(),
                updated_at: new Date().toISOString()
            };

            if (phone !== undefined) {
                profileUpdateData.phone = phone.trim();
            }

            const { error: profileUpdateError } = await supabase
                .from('profiles')
                .update(profileUpdateData)
                .eq('id', userId);

            if (profileUpdateError) {
                console.warn('Warning: Failed to update profiles table:', profileUpdateError);
                // Don't fail the request if profiles update fails
            }

            console.log('Profile updated successfully:', updatedVet);

            return NextResponse.json({
                success: true,
                message: 'Profile updated successfully',
                data: {
                    veterinarian: updatedVet
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