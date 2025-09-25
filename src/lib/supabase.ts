import { createBrowserClient } from '@supabase/ssr'
import { customCookieStorage } from './cookieStorage'
import './supabase-patch' // Apply runtime patch for cookie parsing

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customCookieStorage,
    storageKey: 'sb-auth-token',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  cookies: {
    get(name: string) {
      // Use custom cookie storage for getting cookies
      if (typeof document !== 'undefined') {
        const cookies = document.cookie.split(';');
        const cookie = cookies.find(c => c.trim().startsWith(`${name}=`));
        if (cookie) {
          const value = cookie.split('=')[1];
          if (value?.startsWith('base64-')) {
            try {
              return atob(value.substring(7));
            } catch {
              return value;
            }
          }
          try {
            return decodeURIComponent(value || '');
          } catch {
            return value || '';
          }
        }
      }
      return undefined;
    },
    set(name: string, value: string, options: any) {
      // Use custom cookie storage for setting cookies
      if (typeof document !== 'undefined') {
        try {
          const encodedValue = encodeURIComponent(value);
          let cookieString = `${name}=${encodedValue}`;
          
          if (options.path) cookieString += `; path=${options.path}`;
          if (options.maxAge) cookieString += `; max-age=${options.maxAge}`;
          if (options.httpOnly) cookieString += '; httponly';
          if (options.secure) cookieString += '; secure';
          if (options.sameSite) cookieString += `; samesite=${options.sameSite}`;
          
          document.cookie = cookieString;
        } catch (error) {
          console.warn('Failed to set cookie:', error);
        }
      }
    },
    remove(name: string, options: any) {
      // Use custom cookie storage for removing cookies
      if (typeof document !== 'undefined') {
        let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        if (options.path) cookieString += `; path=${options.path}`;
        document.cookie = cookieString;
      }
    },
  },
})

// Database types (you can generate these with Supabase CLI)
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          user_role: 'admin' | 'pet_owner' | 'veterinarian'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          user_role: 'admin' | 'pet_owner' | 'veterinarian'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          user_role?: 'admin' | 'pet_owner' | 'veterinarian'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      // Add other table types as needed
    }
  }
}