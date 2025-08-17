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
    
    console.log('=== ADMIN DEBUG SESSION ROUTE ===');
    
    // Try different methods to get session
    const sessionResult = await supabaseClient.auth.getSession();
    const userResult = await supabaseClient.auth.getUser();
    
    console.log('Session result:', {
      session: sessionResult.data.session ? 'EXISTS' : 'NULL',
      error: sessionResult.error?.message,
      user_id: sessionResult.data.session?.user?.id
    });
    
    console.log('User result:', {
      user: userResult.data.user ? 'EXISTS' : 'NULL', 
      error: userResult.error?.message,
      user_id: userResult.data.user?.id
    });
    
    return NextResponse.json({
      sessionExists: !!sessionResult.data.session,
      sessionError: sessionResult.error?.message || null,
      userExists: !!userResult.data.user,
      userError: userResult.error?.message || null,
      userId: sessionResult.data.session?.user?.id || userResult.data.user?.id || null,
      cookies: cookieStore.getAll().map(c => ({ name: c.name, hasValue: !!c.value }))
    });
    
  } catch (error) {
    console.error('Debug session error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
