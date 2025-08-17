'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          router.push('/login');
          return;
        }

        if (!session?.user) {
          router.push('/login');
          return;
        }

        // Get user profile to determine role-based redirect
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('user_role')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          // Default redirect if profile fetch fails
          router.push('/dashboard');
          return;
        }

        // Role-based redirect
        switch (profile.user_role) {
          case 'admin':
            router.push('/admin');
            break;
          case 'veterinarian':
            router.push('/veterinarian');
            break;
          case 'pet_owner':
            router.push('/dashboard');
            break;
          default:
            router.push('/dashboard');
            break;
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        router.push('/login');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600 mx-auto"></div>
        <p className="mt-4 text-stone-600">Redirecting you to your dashboard...</p>
      </div>
    </div>
  );
}
