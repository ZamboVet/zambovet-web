'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface PerformanceMetrics {
  authLoadTime: number;
  profileLoadTime: number;
  pageLoadTime: number;
}

export default function PerformanceMonitor() {
  const { loading, user, userProfile } = useAuth();

  useEffect(() => {
    const startTime = performance.now();
    
    if (!loading && user) {
      const authTime = performance.now() - startTime;
      console.log(`🚀 Auth loaded in: ${authTime.toFixed(2)}ms`);
      
      if (userProfile) {
        console.log(`👤 Profile loaded with role: ${userProfile.user_role}`);
      }
    }
  }, [loading, user, userProfile]);

  useEffect(() => {
    // Monitor page load performance
    if (typeof window !== 'undefined') {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            console.log(`📊 Page load time: ${entry.duration?.toFixed(2)}ms`);
          }
        });
      });
      
      try {
        observer.observe({ entryTypes: ['navigation'] });
      } catch (error) {
        // Performance observer not supported
      }

      return () => observer.disconnect();
    }
  }, []);

  // Show loading indicator in development
  if (process.env.NODE_ENV === 'development' && loading) {
    return (
      <div className="fixed top-4 right-4 z-50 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm shadow-lg">
        🔄 Loading auth...
      </div>
    );
  }

  return null;
}