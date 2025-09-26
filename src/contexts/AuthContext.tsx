'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AuthHelper, handleAuthError } from '@/lib/auth-helper';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  user_role: 'admin' | 'pet_owner' | 'veterinarian' | 'receptionist';
  is_active: boolean;
  verification_status?: 'pending' | 'approved' | 'rejected' | null;
  roleProfile?: any; // This will contain pet_owner_profiles or veterinarian data
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  handleSignupComplete: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  userProfile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  handleSignupComplete: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string, retries = 2): Promise<UserProfile | null> => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, 500 * attempt)); // Reduce delay
        }

        // Single optimized query with joins to reduce round trips
        const { data: profile, error } = await supabase
          .from('profiles')
          .select(`
            *,
            pet_owner_profiles(*),
            veterinarians(*)
          `)
          .eq('id', userId)
          .single();

        // If profile is missing, skip auto-creation to avoid delays
        if (!profile || error) {
          if (error?.code === 'PGRST116' && attempt < retries - 1) {
            console.log(`Profile not found, retrying... (${attempt + 1}/${retries})`);
            continue;
          }
          console.error('Profile not found or error:', error);
          return null;
        }

        // Process the joined data from the single query
        if (!profile) return null;

        // Extract role profile from joined data
        let roleProfile = null;
        if (profile.user_role === 'pet_owner' && profile.pet_owner_profiles) {
          roleProfile = Array.isArray(profile.pet_owner_profiles) 
            ? profile.pet_owner_profiles[0] 
            : profile.pet_owner_profiles;
        } else if (profile.user_role === 'veterinarian' && profile.veterinarians) {
          roleProfile = Array.isArray(profile.veterinarians) 
            ? profile.veterinarians[0] 
            : profile.veterinarians;
        }

        // Clean up the profile object
        const { pet_owner_profiles, veterinarians, ...cleanProfile } = profile;
        return { ...cleanProfile, roleProfile };
      } catch (error) {
        console.error(`Error in fetchUserProfile (attempt ${attempt + 1}):`, error);
        if (attempt === retries - 1) {
          return null;
        }
      }
    }
    return null;
  };

  const refreshProfile = async () => {
    if (user) {
      const profile = await fetchUserProfile(user.id);
      setUserProfile(profile);
    }
  };

  const handleSignupComplete = async (userId: string) => {
    // Force a profile refresh after signup - no retries needed since profile was just created
    const profile = await fetchUserProfile(userId, 1);
    setUserProfile(profile);
  };

  const signOut = async () => {
    try {
      // Clear auth data first
      AuthHelper.clearAuthData();
      
      // Then sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear local state
      setUser(null);
      setSession(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if signOut fails, clear local data
      AuthHelper.clearAuthData();
      setUser(null);
      setSession(null);
      setUserProfile(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    // Get initial session with error handling
    const getInitialSession = async () => {
      try {
        // Use direct supabase call for faster initial load
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Load profile in background, don't block UI
          fetchUserProfile(session.user.id, 1).then(profile => {
            if (mounted) {
              setUserProfile(profile);
            }
          }).catch(error => {
            console.error('Error loading profile:', error);
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to get initial session:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        // Only log important auth events
        if (event !== 'INITIAL_SESSION') {
          console.log('Auth state changed:', event);
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Reduce retries for faster auth state changes
          const retries = event === 'SIGNED_IN' ? 2 : 1;
          const profile = await fetchUserProfile(session.user.id, retries);
          if (mounted) {
            setUserProfile(profile);
          }
        } else {
          setUserProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    session,
    userProfile,
    loading,
    signOut,
    refreshProfile,
    handleSignupComplete,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}