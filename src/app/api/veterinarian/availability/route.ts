import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
    try {
        // Get authorization header
        const authHeader = request.headers.get('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Missing or invalid authorization header' },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);

        // Verify the JWT token
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        
        if (userError || !user) {
            console.error('Authentication error:', userError);
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get veterinarian availability status
        const { data: vetData, error: vetError } = await supabase
            .from('veterinarians')
            .select('id, is_available')
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

        return NextResponse.json({
            success: true,
            data: {
                id: vetData.id,
                is_available: vetData.is_available
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

export async function PUT(request: NextRequest) {
    try {
        // Get authorization header
        const authHeader = request.headers.get('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Missing or invalid authorization header' },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);

        // Verify the JWT token
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        
        if (userError || !user) {
            console.error('Authentication error:', userError);
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { is_available } = body;

        // Validate request body
        if (typeof is_available !== 'boolean') {
            return NextResponse.json(
                { error: 'is_available must be a boolean value' },
                { status: 400 }
            );
        }

        // Update veterinarian availability
        const { data: updatedVet, error: updateError } = await supabase
            .from('veterinarians')
            .update({
                is_available,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .select('id, is_available')
            .single();

        if (updateError) {
            console.error('Error updating veterinarian availability:', updateError);
            return NextResponse.json(
                { error: 'Failed to update availability status' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Availability status updated to ${is_available ? 'Available' : 'Unavailable'}`,
            data: {
                id: updatedVet.id,
                is_available: updatedVet.is_available
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