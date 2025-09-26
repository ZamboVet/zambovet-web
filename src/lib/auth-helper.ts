/**
 * Authentication Helper
 * Fixes "Invalid Refresh Token: Refresh Token Not Found" error
 */

import { supabase } from './supabase';

export class AuthHelper {
  /**
   * Clear all authentication related cookies and storage
   */
  static clearAuthData(): void {
    if (typeof document !== 'undefined') {
      // List of possible Supabase auth cookies
      const authCookies = [
        'sb-auth-token',
        'supabase-auth-token',
        'sb-access-token',
        'sb-refresh-token',
      ];

      authCookies.forEach(cookieName => {
        // Clear the cookie
        document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax`;
        document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax; domain=${window.location.hostname}`;
        
        // Also try with leading dot for domain cookies
        if (window.location.hostname !== 'localhost') {
          document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax; domain=.${window.location.hostname}`;
        }
      });

      // Clear localStorage items
      try {
        const localStorageKeys = Object.keys(localStorage);
        localStorageKeys.forEach(key => {
          if (key.includes('supabase') || key.includes('sb-') || key.includes('auth')) {
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.warn('Could not clear localStorage:', error);
      }

      // Clear sessionStorage items
      try {
        const sessionStorageKeys = Object.keys(sessionStorage);
        sessionStorageKeys.forEach(key => {
          if (key.includes('supabase') || key.includes('sb-') || key.includes('auth')) {
            sessionStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.warn('Could not clear sessionStorage:', error);
      }
    }
  }

  /**
   * Handle authentication errors and clear stale tokens
   */
  static async handleAuthError(error: any): Promise<void> {
    console.error('Authentication error:', error);
    
    // Check if it's a refresh token error
    if (error?.message?.includes('refresh') || 
        error?.message?.includes('Refresh Token Not Found') ||
        error?.message?.includes('Invalid Refresh Token')) {
      
      console.log('Detected refresh token error, clearing authentication data...');
      
      // Clear all auth data
      this.clearAuthData();
      
      // Sign out from Supabase
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.warn('Error during signOut:', signOutError);
      }
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.href = '/login?error=session_expired';
        }
      }, 1000);
    }
  }

  /**
   * Safe session retrieval with error handling
   */
  static async getSafeSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        await this.handleAuthError(error);
        return { session: null, error };
      }
      
      return { session, error: null };
    } catch (error) {
      await this.handleAuthError(error);
      return { session: null, error };
    }
  }

  /**
   * Safe user retrieval with error handling
   */
  static async getSafeUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        await this.handleAuthError(error);
        return { user: null, error };
      }
      
      return { user, error: null };
    } catch (error) {
      await this.handleAuthError(error);
      return { user: null, error };
    }
  }

  /**
   * Initialize authentication with error handling
   */
  static async initialize() {
    try {
      // First, try to get the current session
      const { session, error } = await this.getSafeSession();
      
      if (error) {
        console.log('Session retrieval failed, clearing auth data');
        return { session: null, user: null };
      }
      
      return { session, user: session?.user || null };
    } catch (error) {
      console.error('Auth initialization failed:', error);
      await this.handleAuthError(error);
      return { session: null, user: null };
    }
  }
}

// Export a function to clear auth data for emergency use
export const clearAuthData = () => AuthHelper.clearAuthData();

// Export safe auth methods
export const getSafeSession = () => AuthHelper.getSafeSession();
export const getSafeUser = () => AuthHelper.getSafeUser();
export const handleAuthError = (error: any) => AuthHelper.handleAuthError(error);