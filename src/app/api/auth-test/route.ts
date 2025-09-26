import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    console.log('Auth Test API: Starting request');
    
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    
    console.log('Auth Test API: All cookies:', allCookies.map(c => ({ 
      name: c.name, 
      hasValue: !!c.value,
      valueLength: c.value?.length,
      valuePreview: c.value?.substring(0, 20) + '...'
    })));
    
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
              // Handle error silently
            }
          },
        },
      }
    );

    console.log('Auth Test API: Supabase client created');

    // Try getUser
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('Auth Test API: getUser result:', { 
      user: user ? { id: user.id, email: user.email, aud: user.aud } : null, 
      error: userError?.message 
    });

    // Try getSession
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Auth Test API: getSession result:', { 
      session: session ? { 
        user_id: session.user?.id, 
        expires_at: session.expires_at,
        access_token_preview: session.access_token?.substring(0, 20) + '...'
      } : null, 
      error: sessionError?.message 
    });

    // Check environment variables
    console.log('Auth Test API: Environment check:', {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    });

    return NextResponse.json({
      success: true,
      data: {
        cookies: allCookies.map(c => ({ name: c.name, hasValue: !!c.value, valueLength: c.value?.length })),
        user: user ? { id: user.id, email: user.email } : null,
        session: session ? { user_id: session.user?.id, expires_at: session.expires_at } : null,
        userError: userError?.message,
        sessionError: sessionError?.message,
        env: {
          supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        }
      }
    });

  } catch (error) {
    console.error('Auth Test API: Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}