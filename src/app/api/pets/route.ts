import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    console.log('Pets API: Starting pet creation');
    
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
      console.log('Pets API: Authentication failed - authError:', authError, 'user:', user);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Pets API: User authenticated:', user.id);

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    if (profile.user_role !== 'pet_owner') {
      return NextResponse.json(
        { error: 'Only pet owners can add pets' },
        { status: 403 }
      );
    }

    // Get pet owner profile
    const { data: petOwnerProfile, error: petOwnerError } = await supabase
      .from('pet_owner_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (petOwnerError || !petOwnerProfile) {
      return NextResponse.json(
        { error: 'Pet owner profile not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      name,
      species,
      breed,
      gender,
      date_of_birth,
      weight,
      medical_conditions = []
    } = body;

    // Validate required fields
    if (!name || !species) {
      return NextResponse.json(
        { error: 'Name and species are required' },
        { status: 400 }
      );
    }
    
    // Validate species length and format
    if (species.trim().length < 2 || species.trim().length > 50) {
      return NextResponse.json(
        { error: 'Species must be between 2 and 50 characters' },
        { status: 400 }
      );
    }

    // Validate gender if provided
    if (gender && !['male', 'female'].includes(gender)) {
      return NextResponse.json(
        { error: 'Gender must be either "male" or "female"' },
        { status: 400 }
      );
    }

    // Validate weight if provided
    if (weight && (isNaN(parseFloat(weight)) || parseFloat(weight) < 0)) {
      return NextResponse.json(
        { error: 'Weight must be a positive number' },
        { status: 400 }
      );
    }

    // Validate date of birth if provided
    if (date_of_birth) {
      const birthDate = new Date(date_of_birth);
      if (isNaN(birthDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date of birth format' },
          { status: 400 }
        );
      }
      
      // Check if date is not in the future
      if (birthDate > new Date()) {
        return NextResponse.json(
          { error: 'Date of birth cannot be in the future' },
          { status: 400 }
        );
      }
    }

    // Insert pet into database
    const { data: newPet, error: insertError } = await supabase
      .from('patients')
      .insert({
        owner_id: petOwnerProfile.id,
        name: name.trim(),
        species: species.trim(),
        breed: breed ? breed.trim() : null,
        gender: gender || null,
        date_of_birth: date_of_birth || null,
        weight: weight ? parseFloat(weight) : null,
        medical_conditions: medical_conditions.length > 0 ? medical_conditions : null,
        is_active: true
      })
      .select()
      .single();

    if (insertError) {
      console.error('Pets API: Error inserting pet:', insertError);
      return NextResponse.json(
        { error: 'Failed to add pet to database' },
        { status: 500 }
      );
    }

    console.log('Pets API: Pet created successfully:', newPet);

    return NextResponse.json({
      message: 'Pet added successfully',
      pet: newPet
    }, { status: 201 });

  } catch (error) {
    console.error('Pets API: Error in POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('Pets API: Starting pet retrieval');
    
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
      console.log('Pets API: Authentication failed - authError:', authError, 'user:', user);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Pets API: User authenticated:', user.id);

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    if (profile.user_role !== 'pet_owner') {
      return NextResponse.json(
        { error: 'Only pet owners can view pets' },
        { status: 403 }
      );
    }

    // Get pet owner profile
    const { data: petOwnerProfile, error: petOwnerError } = await supabase
      .from('pet_owner_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (petOwnerError || !petOwnerProfile) {
      return NextResponse.json(
        { error: 'Pet owner profile not found' },
        { status: 404 }
      );
    }

    // Get pets for this owner
    const { data: pets, error: petsError } = await supabase
      .from('patients')
      .select('*')
      .eq('owner_id', petOwnerProfile.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (petsError) {
      console.error('Pets API: Error fetching pets:', petsError);
      return NextResponse.json(
        { error: 'Failed to fetch pets' },
        { status: 500 }
      );
    }

    console.log('Pets API: Pets retrieved successfully:', pets);

    return NextResponse.json({
      pets: pets || []
    });

  } catch (error) {
    console.error('Pets API: Error in GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 