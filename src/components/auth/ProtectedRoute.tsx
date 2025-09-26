'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'pet_owner' | 'veterinarian' | 'admin';
  redirectTo?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        console.log('[ProtectedRoute] No user, redirecting to login');
        router.push(redirectTo);
        return;
      }

      // Only redirect based on role if we have a profile loaded
      // If user exists but profile is still loading, let them stay
      if (requiredRole && userProfile && userProfile.user_role !== requiredRole) {
        console.log(`[ProtectedRoute] Role mismatch: required ${requiredRole}, got ${userProfile.user_role}`);
        // Redirect to appropriate dashboard based on user role
        if (userProfile.user_role === 'veterinarian') {
          router.push('/veterinarian');
        } else if (userProfile.user_role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
        return;
      }
    }
  }, [user, userProfile, loading, requiredRole, router, redirectTo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  // If user exists but profile is loading and a role is required, show loading
  if (requiredRole && !userProfile) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  // If role is required and doesn't match, will redirect in useEffect
  if (requiredRole && userProfile && userProfile.user_role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}
