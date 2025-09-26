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

  // Helper function to process profile data
  const processProfile = (profile: any): UserProfile => {
    console.log(`[AuthContext] Processing profile:`, {
      userId: profile.id,
      userRole: profile.user_role,
      hasPetOwnerProfiles: !!profile.pet_owner_profiles,
      hasVeterinarians: !!profile.veterinarians
    });

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

    console.log(`[AuthContext] Role profile extracted:`, { roleProfile: roleProfile ? 'EXISTS' : 'NULL' });

    // Clean up the profile object
    const { pet_owner_profiles, veterinarians, ...cleanProfile } = profile;
    const finalProfile = { ...cleanProfile, roleProfile };
    
    console.log(`[AuthContext] Final profile:`, {
      id: finalProfile.id,
      email: finalProfile.email,
      full_name: finalProfile.full_name,
      user_role: finalProfile.user_role,
      hasRoleProfile: !!finalProfile.roleProfile
    });
    
    return finalProfile;
  };

  const fetchUserProfile = async (userId: string, retries = 3): Promise<UserProfile | null> => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        if (attempt > 0) {
          // Exponential backoff: 200ms, 400ms, 800ms
          await new Promise(resolve => setTimeout(resolve, 200 * Math.pow(2, attempt)));
        }

        console.log(`[AuthContext] Fetching profile for user: ${userId} (attempt ${attempt + 1}/${retries})`);

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

        console.log(`[AuthContext] Profile query result:`, { profile: profile ? 'EXISTS' : 'NULL', error });

        // If profile exists, process and return it
        if (profile && !error) {
          console.log(`[AuthContext] Profile found on attempt ${attempt + 1}`);
          return processProfile(profile);
        }

        // If profile is missing and this is not the last attempt, retry
        if (error?.code === 'PGRST116' && attempt < retries - 1) {
          console.log(`[AuthContext] Profile not found, retrying... (${attempt + 1}/${retries})`);
          continue;
        }

        // If profile is still missing on final attempt, try to create it
        console.warn('[AuthContext] Profile not found after all attempts, attempting to create:', error);
        
        // Try to create a basic profile from auth user data
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser.user && authUser.user.id === userId) {
          console.log('[AuthContext] Creating missing profile from auth data');
          
          try {
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                email: authUser.user.email,
                full_name: authUser.user.user_metadata?.full_name || null,
                user_role: authUser.user.user_metadata?.user_role || 'pet_owner',
                is_active: true,
                verification_status: 'approved'
              })
              .select(`
                *,
                pet_owner_profiles(*),
                veterinarians(*)
              `)
              .single();
              
            if (newProfile && !createError) {
              console.log('[AuthContext] Successfully created missing profile');
              return processProfile(newProfile);
            } else {
              console.error('[AuthContext] Failed to create profile:', createError);
            }
          } catch (createErr) {
            console.error('[AuthContext] Error creating profile:', createErr);
          }
        }
        
        return null;

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
        
        // Always set loading to false first so UI can render
        setLoading(false);
        
        if (session?.user) {
          console.log(`[AuthContext] Initial session found, loading profile in background for user: ${session.user.id}`);
          
          // Load profile in background with more retries for initial load
          fetchUserProfile(session.user.id, 3).then(profile => {
            if (mounted) {
              console.log(`[AuthContext] Initial profile load completed:`, { profile: profile ? 'SUCCESS' : 'FAILED' });
              setUserProfile(profile);
            }
          }).catch(error => {
            console.error('[AuthContext] Error loading initial profile:', error);
            // Profile loading failed, but don't block UI - user can still interact
          });
        }
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
          // Use more retries for sign-in events, fewer for others
          const retries = event === 'SIGNED_IN' ? 3 : 2;
          console.log(`[AuthContext] Auth state changed to ${event}, loading profile for user: ${session.user.id}`);
          
          try {
            const profile = await fetchUserProfile(session.user.id, retries);
            if (mounted) {
              console.log(`[AuthContext] Auth change profile load:`, { 
                event, 
                profile: profile ? 'SUCCESS' : 'FAILED',
                userId: session.user.id 
              });
              setUserProfile(profile);
            }
          } catch (error) {
            console.error(`[AuthContext] Profile load failed for ${event}:`, error);
            // Don't set userProfile to null if it was already loaded - keep existing data
            if (mounted && !userProfile) {
              setUserProfile(null);
            }
          }
        } else {
          console.log(`[AuthContext] No session, clearing profile`);
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