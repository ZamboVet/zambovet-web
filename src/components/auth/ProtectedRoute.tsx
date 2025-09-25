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
        router.push(redirectTo);
        return;
      }

      if (requiredRole && userProfile?.user_role !== requiredRole) {
        // Redirect to appropriate dashboard based on user role
        if (userProfile?.user_role === 'veterinarian') {
          router.push('/vet-dashboard');
        } else if (userProfile?.user_role === 'admin') {
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

  if (requiredRole && userProfile?.user_role !== requiredRole) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
