import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received request body:', body);
    
    const { latitude, longitude, clinicName, clinicAddress, clinicPhone, userId } = body;

    if (!userId) {
      console.error('No userId provided');
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Validate input
    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: 'Invalid latitude or longitude values' },
        { status: 400 }
      );
    }

    // Check if user is a veterinarian
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_role')
      .eq('id', userId)
      .single();

    if (profileError || profile?.user_role !== 'veterinarian') {
      return NextResponse.json(
        { error: 'Only veterinarians can update clinic locations' },
        { status: 403 }
      );
    }

    // Get veterinarian record
    const { data: vet, error: vetError } = await supabase
      .from('veterinarians')
      .select('id, clinic_id, clinics(*)')
      .eq('user_id', userId)
      .single();

    if (vetError) {
      return NextResponse.json(
        { error: 'Veterinarian profile not found' },
        { status: 404 }
      );
    }

    let clinicId = vet.clinic_id;

    // Handle clinic creation/update
    if (!clinicId) {
      console.log('Creating new clinic for veterinarian...');
      
      // Try using the RPC function first (requires the function to be created in database)
      try {
        const { data: newClinicId, error: rpcError } = await supabase.rpc('create_clinic_for_vet', {
          clinic_name: clinicName || 'My Veterinary Clinic',
          clinic_address: clinicAddress || 'Please update your clinic address',
          clinic_lat: parseFloat(latitude),
          clinic_lng: parseFloat(longitude),
          vet_id: vet.id,
          clinic_phone: clinicPhone || null
        });

        if (rpcError) {
          console.error('RPC function error:', rpcError);
          
          // Fallback: Try direct insertion if RPC function doesn't exist
          const { data: newClinic, error: clinicError } = await supabase
            .from('clinics')
            .insert({
              name: clinicName || 'My Veterinary Clinic',
              address: clinicAddress || 'Please update your clinic address',
              phone: clinicPhone || null,
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
              is_active: true,
            })
            .select()
            .single();

          if (clinicError) {
            console.error('Direct insertion also failed:', clinicError);
            return NextResponse.json(
              { 
                error: 'Unable to create clinic. Please run the provided SQL script in Supabase to enable clinic creation.',
                details: clinicError.message,
                suggestion: 'Execute the clinic_creation_function.sql script in your Supabase SQL Editor, or ask an administrator to create a clinic for you.'
              },
              { status: 400 }
            );
          }

          clinicId = newClinic.id;

          // Update veterinarian record with new clinic_id
          const { error: updateVetError } = await supabase
            .from('veterinarians')
            .update({ clinic_id: clinicId })
            .eq('id', vet.id);

          if (updateVetError) {
            console.error('Error updating veterinarian clinic_id:', updateVetError);
            return NextResponse.json(
              { error: 'Failed to link clinic to veterinarian', details: updateVetError.message },
              { status: 500 }
            );
          }
        } else {
          // RPC function succeeded
          clinicId = newClinicId;
          console.log('Clinic created via RPC function:', clinicId);
        }

      } catch (err) {
        console.error('Exception during clinic creation:', err);
        return NextResponse.json(
          { 
            error: 'Unable to create clinic due to system error.',
            details: err instanceof Error ? err.message : 'Unknown error',
            suggestion: 'Please try again or contact support if the issue persists.'
          },
          { status: 500 }
        );
      }

      console.log('New clinic created and linked:', clinicId);
    } else {
      // Update existing clinic location
      const updateData: any = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        updated_at: new Date().toISOString()
      };

      // Only update other fields if they are provided
      if (clinicName) updateData.name = clinicName;
      if (clinicAddress) updateData.address = clinicAddress;
      if (clinicPhone) updateData.phone = clinicPhone;

      const { error: updateError } = await supabase
        .from('clinics')
        .update(updateData)
        .eq('id', clinicId);

      if (updateError) {
        console.error('Error updating clinic:', updateError);
        return NextResponse.json(
          { error: 'Failed to update clinic location' },
          { status: 500 }
        );
      }
    }

    // Return updated clinic data
    const { data: updatedClinic, error: fetchError } = await supabase
      .from('clinics')
      .select('*')
      .eq('id', clinicId)
      .single();

    if (fetchError) {
      console.error('Error fetching updated clinic:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch updated clinic data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Clinic location updated successfully',
      clinic: updatedClinic
    });

  } catch (error) {
    console.error('Error in clinic location update:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get veterinarian's clinic data
    const { data: vet, error: vetError } = await supabase
      .from('veterinarians')
      .select(`
        id,
        clinic_id,
        clinics(*)
      `)
      .eq('user_id', userId)
      .single();

    if (vetError) {
      return NextResponse.json(
        { error: 'Veterinarian profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      clinic: vet.clinics
    });

  } catch (error) {
    console.error('Error fetching clinic data:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
