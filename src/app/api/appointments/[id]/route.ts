import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const cookieStore = await cookies();
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
        const resolvedParams = await params;
        
        // Get the current user - handle both cookies and Authorization header
        let user, authError;
        
        // Check for Authorization header first
        const authHeader = request.headers.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const result = await supabase.auth.getUser(token);
            user = result.data.user;
            authError = result.error;
            console.log('[Appointment API] Using Authorization header:', { user: user ? 'EXISTS' : 'NULL', authError });
        } else {
            // Fallback to cookies
            const result = await supabase.auth.getUser();
            user = result.data.user;
            authError = result.error;
            console.log('[Appointment API] Using cookies:', { user: user ? 'EXISTS' : 'NULL', authError });
        }
        
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const appointmentId = parseInt(resolvedParams.id);
        const body = await request.json();
        const { status, notes } = body;

        // Get the appointment
        const { data: appointment, error: fetchError } = await supabase
            .from('appointments')
            .select(`
                *,
                veterinarians(user_id),
                pet_owner_profiles(user_id)
            `)
            .eq('id', appointmentId)
            .single();

        console.log('[Appointment API] Appointment fetch result:', { appointment, fetchError });

        if (fetchError || !appointment) {
            return NextResponse.json(
                { error: 'Appointment not found' },
                { status: 404 }
            );
        }

        // Check if user is authorized to update this appointment
        const { data: userProfile } = await supabase
            .from('profiles')
            .select('user_role, is_active, verification_status')
            .eq('id', user.id)
            .single();

        console.log('[Appointment API] User profile check:', { userProfile, userId: user.id });

        const isVet = appointment.veterinarians?.user_id === user.id;
        const isOwner = appointment.pet_owner_profiles?.user_id === user.id;
        const isAdmin = userProfile?.user_role === 'admin';
        
        console.log('[Appointment API] Authorization check:', { isVet, isOwner, isAdmin, appointmentVetId: appointment.veterinarians?.user_id, currentUserId: user.id });

        if (!isVet && !isOwner && !isAdmin) {
            return NextResponse.json(
                { error: 'Unauthorized to update this appointment' },
                { status: 403 }
            );
        }

        // Prepare update data
        const updateData: any = {};
        
        if (status) {
            updateData.status = status;
            
            // If status is being changed to confirmed, set approved_by and approved_at
            if (status === 'confirmed') {
                updateData.approved_by = user.id;
                updateData.approved_at = new Date().toISOString();
            }
        }
        
        if (notes !== undefined) {
            updateData.notes = notes;
        }

        // Update the appointment
        const { data: updatedAppointment, error: updateError } = await supabase
            .from('appointments')
            .update(updateData)
            .eq('id', appointmentId)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating appointment:', updateError);
            return NextResponse.json(
                { error: 'Failed to update appointment' },
                { status: 500 }
            );
        }

        // Create notification for the pet owner
        if (status && ['confirmed', 'cancelled', 'completed'].includes(status)) {
            const notificationMessage = {
                confirmed: 'Your appointment has been confirmed by the veterinarian.',
                cancelled: 'Your appointment has been cancelled.',
                completed: 'Your appointment has been marked as completed.'
            };

            await supabase
                .from('notifications')
                .insert({
                    user_id: appointment.pet_owner_profiles.user_id,
                    title: `Appointment ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                    message: notificationMessage[status as keyof typeof notificationMessage],
                    notification_type: 'appointment_update',
                    related_appointment_id: appointmentId
                });
        }

        return NextResponse.json({
            success: true,
            message: 'Appointment updated successfully',
            data: updatedAppointment
        });

    } catch (error) {
        console.error('Appointment update error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const cookieStore = await cookies();
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
        const resolvedParams = await params;
        
        // Get the current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const appointmentId = parseInt(resolvedParams.id);

        // Get the appointment with related data
        const { data: appointment, error } = await supabase
            .from('appointments')
            .select(`
                *,
                patients(name, species, breed, gender, weight),
                veterinarians(full_name, specialization, consultation_fee),
                clinics(name, address, phone),
                pet_owner_profiles(full_name, phone),
                services(name, price, duration_minutes)
            `)
            .eq('id', appointmentId)
            .single();

        if (error || !appointment) {
            return NextResponse.json(
                { error: 'Appointment not found' },
                { status: 404 }
            );
        }

        // Check if user is authorized to view this appointment
        const { data: userProfile } = await supabase
            .from('profiles')
            .select('user_role')
            .eq('id', user.id)
            .single();

        const isVet = appointment.veterinarians?.user_id === user.id;
        const isOwner = appointment.pet_owner_profiles?.user_id === user.id;
        const isAdmin = userProfile?.user_role === 'admin';

        if (!isVet && !isOwner && !isAdmin) {
            return NextResponse.json(
                { error: 'Unauthorized to view this appointment' },
                { status: 403 }
            );
        }

        return NextResponse.json({
            success: true,
            data: appointment
        });

    } catch (error) {
        console.error('Appointment fetch error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 