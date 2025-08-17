import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabaseClient = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Check authentication first
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('user_role')
      .eq('id', user.id)
      .single();
      
    if (!profile || profile.user_role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }
    
    console.log('Admin accessing environment variables test...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? 'SET' : 'NOT SET');
    
    return NextResponse.json({
      supabaseUrl: supabaseUrl ? 'SET' : 'NOT SET',
      serviceRoleKey: serviceRoleKey ? 'SET' : 'NOT SET',
      nodeEnv: process.env.NODE_ENV
    });
  } catch (error) {
    console.error('Test env error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
