import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if user is pending verification
  if (user && (request.nextUrl.pathname.startsWith('/veterinarian') || request.nextUrl.pathname.startsWith('/dashboard'))) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_role, is_active, verification_status')
        .eq('id', user.id)
        .single();
      
      if (profile?.user_role === 'veterinarian' && (!profile.is_active || profile.verification_status === 'pending')) {
        return NextResponse.redirect(new URL('/pending-verification', request.url));
      }
    } catch (error) {
      console.error('Error checking user verification status:', error);
    }
  }

  // If there's no user and the request is for an API route that requires auth
  if (!user && request.nextUrl.pathname.startsWith('/api/')) {
    // Skip auth check for public endpoints - ONLY truly public endpoints
    const publicEndpoints = [
      '/api/auth', // Auth endpoints (Supabase auth callbacks)
    ];
    
    // Admin-only endpoints that require additional role checking
    const adminOnlyEndpoints = [
      '/api/debug',
      '/api/test-env',
      '/api/admin',
    ];
    
    const isPublicEndpoint = publicEndpoints.some(endpoint => 
      request.nextUrl.pathname.startsWith(endpoint)
    );
    
    const isAdminEndpoint = adminOnlyEndpoints.some(endpoint => 
      request.nextUrl.pathname.startsWith(endpoint)
    );
    
    if (isPublicEndpoint) {
      return supabaseResponse;
    }
    
    // Admin endpoints are handled by their own authentication logic
    if (isAdminEndpoint) {
      return supabaseResponse;
    }

    // For other API routes, return 401
    console.log('Middleware blocking API route:', request.nextUrl.pathname, 'No user found');
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 