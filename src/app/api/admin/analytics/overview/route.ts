import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { analyticsService } from '@/lib/services/analyticsService';

export async function GET(request: NextRequest) {
  try {
    console.log('Analytics API: Starting overview analytics fetch');
    
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
            }
          },
        },
      }
    );
    
    console.log('Analytics API: Getting user session...');
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('Analytics API: Authentication failed');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.user_role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Parse query parameters for filters
    const url = new URL(request.url);
    const filtersParam = url.searchParams.get('filters');
    
    let filters = {};
    if (filtersParam) {
      try {
        filters = JSON.parse(filtersParam);
      } catch (e) {
        console.warn('Invalid filters parameter:', e);
      }
    }

    console.log('Analytics API: Fetching system overview with filters:', filters);
    
    const overview = await analyticsService.getSystemOverview(filters);
    
    console.log('Analytics API: System overview fetched successfully');
    
    return NextResponse.json({
      success: true,
      data: overview
    });

  } catch (error) {
    console.error('Analytics API: Error in overview endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}