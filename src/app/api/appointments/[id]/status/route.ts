import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabaseClient = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
    
    console.log('Session check:', session ? `Session exists for user: ${session.user.id}` : 'No session');
    console.log('Session error:', sessionError);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - No session found' },
        { status: 401 }
      );
    }

    const appointmentId = params.id;
    const body = await request.json();
    const { status, declineReason } = body;

    // Validate status
    const validStatuses = ['confirmed', 'cancelled', 'in_progress', 'completed', 'no_show'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Get current user profile to verify they're a veterinarian
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('user_role')
      .eq('id', session.user.id)
      .single();

    console.log('User profile check:', { userProfile, profileError });

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: `Failed to get user profile: ${profileError?.message}` },
        { status: 403 }
      );
    }

    if (userProfile.user_role !== 'veterinarian') {
      return NextResponse.json(
        { error: 'Only veterinarians can update appointment status' },
        { status: 403 }
      );
    }

    // Get veterinarian profile to verify they own this appointment
    const { data: vetProfile, error: vetError } = await supabaseClient
      .from('veterinarians')
      .select('id, clinic_id')
      .eq('user_id', session.user.id)
      .single();

    console.log('Vet profile check:', { vetProfile, vetError });

    if (vetError || !vetProfile) {
      return NextResponse.json(
        { error: `Veterinarian profile not found: ${vetError?.message}` },
        { status: 404 }
      );
    }

    // Verify the appointment belongs to this veterinarian or is in their clinic
    const { data: appointment, error: appointmentError } = await supabaseClient
      .from('appointments')
      .select('id, status, veterinarian_id, clinic_id')
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Check if the appointment is assigned to this vet OR is in their clinic and unassigned/pending
    const canUpdateAppointment = 
      appointment.veterinarian_id === vetProfile.id || // Already assigned to this vet
      (appointment.clinic_id === vetProfile.clinic_id && // In vet's clinic
       (appointment.veterinarian_id === null || appointment.status === 'pending')); // Unassigned or pending

    if (!canUpdateAppointment) {
      return NextResponse.json(
        { error: 'Access denied - appointment not accessible to this veterinarian' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    // If confirming appointment
    if (status === 'confirmed') {
      updateData.is_approved = true;
      updateData.approved_by = session.user.id;
      updateData.approved_at = new Date().toISOString();
      // Assign the veterinarian if not already assigned
      if (appointment.veterinarian_id === null) {
        updateData.veterinarian_id = vetProfile.id;
      }
    }

    // If declining/cancelling appointment, add decline reason to notes
    if (status === 'cancelled' && declineReason) {
      const declineNote = `DECLINED BY VETERINARIAN: ${declineReason}`;
      updateData.notes = declineNote;
    }

    // Update the appointment
    const { data: updatedAppointment, error: updateError } = await supabaseClient
      .from('appointments')
      .update(updateData)
      .eq('id', appointmentId)
      .select(`
        *,
        patients(name, species, breed),
        pet_owner_profiles(full_name, phone),
        services(name, duration_minutes),
        clinics(name, address, phone)
      `)
      .single();

    if (updateError) {
      console.error('Error updating appointment:', updateError);
      return NextResponse.json(
        { error: 'Failed to update appointment' },
        { status: 500 }
      );
    }

    // Create notification for pet owner
    try {
      let notificationTitle = '';
      let notificationMessage = '';

      switch (status) {
        case 'confirmed':
          notificationTitle = 'Appointment Confirmed';
          notificationMessage = `Your appointment for ${updatedAppointment.patients?.name} has been confirmed by the veterinarian.`;
          break;
        case 'cancelled':
          notificationTitle = 'Appointment Declined';
          notificationMessage = `Your appointment for ${updatedAppointment.patients?.name} has been declined. ${declineReason ? `Reason: ${declineReason}` : ''}`;
          break;
        case 'completed':
          notificationTitle = 'Appointment Completed';
          notificationMessage = `Your appointment for ${updatedAppointment.patients?.name} has been completed.`;
          break;
      }

      if (notificationTitle) {
        await supabaseClient
          .from('notifications')
          .insert({
            user_id: updatedAppointment.pet_owner_profiles?.user_id,
            title: notificationTitle,
            message: notificationMessage,
            notification_type: 'appointment_update',
            related_appointment_id: parseInt(appointmentId)
          });
      }
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the main operation if notification fails
    }

    return NextResponse.json({
      success: true,
      appointment: updatedAppointment,
      message: `Appointment ${status} successfully`
    });

  } catch (error) {
    console.error('Error updating appointment status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabaseClient = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const appointmentId = params.id;

    // Get appointment details
    const { data: appointment, error } = await supabaseClient
      .from('appointments')
      .select(`
        *,
        patients(name, species, breed, date_of_birth, weight, medical_conditions),
        pet_owner_profiles(full_name, phone, address),
        veterinarians(full_name, specialization),
        clinics(name, address, phone),
        services(name, description, price, duration_minutes)
      `)
      .eq('id', appointmentId)
      .single();

    if (error || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      appointment
    });

  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
