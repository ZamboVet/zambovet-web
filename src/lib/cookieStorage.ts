/**
 * Custom storage adapter for Supabase that handles cookie parsing errors
 * This fixes the "Failed to parse cookie string" error in helpers.ts:129
 */

export class CustomCookieStorage {
  async getItem(key: string): Promise<string | null> {
    if (typeof document === 'undefined') return null;
    
    try {
      const cookies = document.cookie.split(';');
      const cookie = cookies.find(cookie => cookie.trim().startsWith(`${key}=`));
      
      if (!cookie) return null;
      
      const value = cookie.split('=')[1];
      if (!value) return null;
      
      // Check if the value is base64 encoded (starts with "base64-")
      if (value.startsWith('base64-')) {
        try {
          // Remove the "base64-" prefix and decode
          const base64Value = value.substring(7);
          const decodedValue = atob(base64Value);
          return decodedValue;
        } catch (error) {
          console.warn('Failed to decode base64 cookie value:', error);
          return value; // Return raw value if decoding fails
        }
      }
      
      // Try to URL decode the value
      try {
        return decodeURIComponent(value);
      } catch (error) {
        console.warn('Failed to URL decode cookie value:', error);
        return value; // Return raw value if decoding fails
      }
    } catch (error) {
      console.error('Error reading cookie:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    if (typeof document === 'undefined') return;
    
    try {
      // Encode the value to handle special characters
      const encodedValue = encodeURIComponent(value);
      
      // Set cookie with proper attributes
      document.cookie = `${key}=${encodedValue}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
    } catch (error) {
      console.error('Error setting cookie:', error);
    }
  }

  async removeItem(key: string): Promise<void> {
    if (typeof document === 'undefined') return;
    
    try {
      // Set cookie with past expiration date to remove it
      document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax`;
    } catch (error) {
      console.error('Error removing cookie:', error);
    }
  }
}

export const customCookieStorage = new CustomCookieStorage();