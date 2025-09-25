'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

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

  const fetchUserProfile = async (userId: string, retries = 3): Promise<UserProfile | null> => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        // If profile is missing, create it (dev mode only)
        if ((!profile || error) && attempt === 0) {
          // Try to create a default profile for this user
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // Insert a default profile (adjust user_role as needed)
            const { error: insertError } = await supabase.from('profiles').insert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || '',
              user_role: 'pet_owner',
              is_active: true,
            });
            if (!insertError) {
              // Try fetching again
              const { data: newProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
              if (newProfile) {
                let roleProfile = null;
                if (newProfile.user_role === 'pet_owner') {
                  const { data: petOwnerProfile, error: petOwnerError } = await supabase
                    .from('pet_owner_profiles')
                    .select('*')
                    .eq('user_id', userId)
                    .single();
                  if (!petOwnerError) {
                    roleProfile = petOwnerProfile;
                  }
                } else if (newProfile.user_role === 'veterinarian') {
                  const { data: vetProfile, error: vetError } = await supabase
                    .from('veterinarians')
                    .select('*')
                    .eq('user_id', userId)
                    .single();
                  if (!vetError) {
                    roleProfile = vetProfile;
                  }
                }
                return { ...newProfile, roleProfile };
              }
            }
          }
        }

        if (error) {
          // If profile not found and this is not the last attempt, continue retrying
          if (error.code === 'PGRST116' && attempt < retries - 1) {
            console.log(`Profile not found for user ${userId}, retrying... (attempt ${attempt + 1})`);
            continue;
          }
          console.error('Error fetching user profile:', error);
          return null;
        }
        if (!profile) return null;

        let roleProfile = null;
        // Fetch role-specific profile data
        if (profile.user_role === 'pet_owner') {
          const { data: petOwnerProfile, error: petOwnerError } = await supabase
            .from('pet_owner_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();
          if (!petOwnerError) {
            roleProfile = petOwnerProfile;
          }
        } else if (profile.user_role === 'veterinarian') {
          const { data: vetProfile, error: vetError } = await supabase
            .from('veterinarians')
            .select('*')
            .eq('user_id', userId)
            .single();
          if (!vetError) {
            roleProfile = vetProfile;
          }
        }
        return { ...profile, roleProfile };
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
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setUserProfile(profile);
        }
      }
      
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Only log important auth events, not the initial session check
        if (event !== 'INITIAL_SESSION') {
          console.log('Auth state changed:', event, session?.user?.email);
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // For SIGNED_IN event, we might need to wait a bit for the profile to be created
          const retries = event === 'SIGNED_IN' ? 5 : 3;
          const profile = await fetchUserProfile(session.user.id, retries);
          setUserProfile(profile);
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
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