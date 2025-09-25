import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    console.log('=== VET APPOINTMENT STATUS UPDATE ===');
    
    const body = await request.json();
    const { appointmentId, status, declineReason } = body;
    const numericAppointmentId = Number(appointmentId);
    
    console.log('Request body:', { appointmentId, status, declineReason });
    
    // Validate required fields
    if (!appointmentId || !status) {
      return NextResponse.json(
        { error: 'Missing appointmentId or status' },
        { status: 400 }
      );
    }
    
    // Validate status values
    const validStatuses = ['confirmed', 'cancelled', 'completed', 'in_progress'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }
    
    // Try to get auth token from Authorization header first
    const authHeader = request.headers.get('authorization');
    let supabase;
    let user;
    let userError;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      console.log('Using Authorization header');
      const token = authHeader.substring(7);
      
      // Create Supabase client with the token
      const { createClient } = await import('@supabase/supabase-js');
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      // Set the session with the token
      const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token);
      user = tokenUser;
      userError = tokenError;
    } else {
      console.log('Using cookies');
      // Fallback to cookie-based auth
      const cookieStore = await cookies();
      supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            },
          },
        }
      );
      
      const { data: { user: cookieUser }, error: cookieError } = await supabase.auth.getUser();
      user = cookieUser;
      userError = cookieError;
    }
    console.log('User check:', { user: user ? 'EXISTS' : 'NULL', userError });
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication failed', details: userError?.message },
        { status: 401 }
      );
    }
    
    // Get user profile to verify they're a veterinarian
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_role')
      .eq('id', user.id)
      .single();
    
    console.log('Profile check:', { profile, profileError });
    
    if (profileError || !profile || profile.user_role !== 'veterinarian') {
      return NextResponse.json(
        { error: 'Access denied - veterinarian role required', details: { profile, profileError } },
        { status: 403 }
      );
    }
    
    // Get veterinarian info
    const { data: vet, error: vetError } = await supabase
      .from('veterinarians')
      .select('id, clinic_id')
      .eq('user_id', user.id)
      .single();
    
    console.log('Vet check:', { vet, vetError });
    
    if (vetError || !vet) {
      return NextResponse.json(
        { error: 'Veterinarian profile not found', details: { vet, vetError } },
        { status: 404 }
      );
    }
    
    // Get appointment details
    console.log('Looking for appointment ID:', appointmentId, 'type:', typeof appointmentId);
    
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('id, status, veterinarian_id, clinic_id, pet_owner_id, appointment_date, appointment_time')
      .eq('id', numericAppointmentId)
      .single();
    
    console.log('Appointment check:', { appointment, appointmentError });
    
    // If not found, let's debug what appointments exist
    if (!appointment) {
      const { data: allAppointments } = await supabase
        .from('appointments')
        .select('id, status, veterinarian_id, clinic_id')
        .limit(10);
      console.log('ALL appointments in database:', allAppointments);
      
      const { data: vetAppointments } = await supabase
        .from('appointments')
        .select('id, status, veterinarian_id, clinic_id')
        .eq('veterinarian_id', vet.id)
        .limit(5);
      console.log('Appointments assigned to this vet:', vetAppointments);
    }
    
    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found', details: { appointmentId, numericAppointmentId, appointmentError, vet, vetId: vet.id, vetClinicId: vet.clinic_id } },
        { status: 404 }
      );
    }
    
    // Check if vet can update this appointment
    const canUpdate = 
      appointment.veterinarian_id === vet.id || // Already assigned to this vet
      (appointment.clinic_id === vet.clinic_id && // In vet's clinic
       (appointment.veterinarian_id === null || appointment.status === 'pending')); // Unassigned or pending
    
    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Cannot update this appointment - not assigned to you or your clinic', details: { appointment, vet, vetId: vet.id, vetClinicId: vet.clinic_id } },
        { status: 403 }
      );
    }
    
    // Prepare update data
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };
    
    // Handle different status updates
    if (status === 'confirmed') {
      updateData.is_approved = true;
      updateData.approved_by = user.id;
      updateData.approved_at = new Date().toISOString();
      // Assign vet if not already assigned
      if (!appointment.veterinarian_id) {
        updateData.veterinarian_id = vet.id;
      }
    }
    
    if (status === 'cancelled' && declineReason) {
      updateData.notes = `DECLINED: ${declineReason}`;
    }
    
    console.log('Update data:', updateData);
    
    // Update the appointment
    const { data: updatedAppointment, error: updateError } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', numericAppointmentId)
      .select(`
        *,
        patients(name, species),
        pet_owner_profiles(full_name, user_id)
      `)
      .single();
    
    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update appointment', details: updateError.message },
        { status: 500 }
      );
    }
    
    // Send email to pet owner if appointment is confirmed
    if (status === 'confirmed') {
      try {
        // Fetch pet owner's email
        let ownerEmail = null;
        let ownerName = null;
        if (updatedAppointment?.pet_owner_profiles?.user_id) {
          const { data: ownerUser } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', updatedAppointment.pet_owner_profiles.user_id)
            .single();
          ownerEmail = ownerUser?.email;
          ownerName = updatedAppointment.pet_owner_profiles.full_name;
        }
        if (ownerEmail) {
          // Configure Gmail SMTP
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'vetzambo@gmail.com',
              pass: process.env.GMAIL_APP_PASSWORD,
            },
          });
          // Compose the email
          await transporter.sendMail({
            from: 'ZamboVet <vetzambo@gmail.com>',
            to: ownerEmail,
            subject: 'Your Appointment is Confirmed!',
            text: `Hi ${ownerName || ''},\n\nYour appointment on ${updatedAppointment.appointment_date} at ${updatedAppointment.appointment_time} has been confirmed by the veterinarian.\n\nThank you for using ZamboVet!`,
            html: `<p>Hi ${ownerName || ''},</p><p>Your appointment on <b>${updatedAppointment.appointment_date}</b> at <b>${updatedAppointment.appointment_time}</b> has been <b>confirmed</b> by the veterinarian.</p><p>Thank you for using ZamboVet!</p>`
          });
        }
      } catch (emailError) {
        console.error('Email send error:', emailError);
        // Don't fail the main operation if email fails
      }
    }
    
    console.log('Appointment updated successfully');
    
    // Create notification for pet owner
    try {
      const notificationData = {
        user_id: appointment.pet_owner_id,
        title: status === 'confirmed' ? 'Appointment Confirmed' : 
               status === 'cancelled' ? 'Appointment Cancelled' : 'Appointment Updated',
        message: `Your appointment has been ${status}${declineReason ? `. Reason: ${declineReason}` : ''}`,
        notification_type: 'appointment_update',
        related_appointment_id: appointmentId
      };
      
      await supabase.from('notifications').insert(notificationData);
    } catch (notifError) {
      console.error('Notification error:', notifError);
      // Don't fail the main operation
    }
    
    return NextResponse.json({
      success: true,
      message: `Appointment ${status} successfully`,
      appointment: updatedAppointment
    });
    
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
