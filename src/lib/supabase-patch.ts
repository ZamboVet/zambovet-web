/**
 * Runtime patch for Supabase cookie parsing issue
 * This patches the getItemAsync function to handle base64-encoded cookies properly
 */

// Store the original function
let originalGetItemAsync: any = null;

export function patchSupabaseHelpers() {
  try {
    // Try to access the Supabase helpers module
    const supabaseModule = require('@supabase/auth-js/dist/main');
    
    // If we can access the helpers, patch the getItemAsync function
    if (supabaseModule && supabaseModule.getItemAsync) {
      originalGetItemAsync = supabaseModule.getItemAsync;
      
      supabaseModule.getItemAsync = async function(storage: any, key: string) {
        const value = await storage.getItem(key);
        
        if (!value) {
          return null;
        }
        
        try {
          // Handle base64-encoded values
          if (typeof value === 'string' && value.startsWith('base64-')) {
            try {
              const base64Value = value.substring(7);
              const decodedValue = atob(base64Value);
              return JSON.parse(decodedValue);
            } catch (decodeError) {
              console.warn('Failed to decode base64 cookie value:', decodeError);
              // Try to parse as regular JSON
              return JSON.parse(value);
            }
          }
          
          // Regular JSON parsing
          return JSON.parse(value);
        } catch (parseError) {
          console.warn('Failed to parse cookie value as JSON, returning raw value:', parseError);
          return value;
        }
      };
      
      console.log('Successfully patched Supabase getItemAsync function');
      return true;
    }
  } catch (error) {
    console.warn('Could not patch Supabase helpers:', error);
  }
  
  return false;
}

export function unpatchSupabaseHelpers() {
  try {
    const supabaseModule = require('@supabase/auth-js/dist/main');
    if (supabaseModule && originalGetItemAsync) {
      supabaseModule.getItemAsync = originalGetItemAsync;
      originalGetItemAsync = null;
      console.log('Successfully unpatched Supabase getItemAsync function');
    }
  } catch (error) {
    console.warn('Could not unpatch Supabase helpers:', error);
  }
}

// Apply patch immediately when this module is imported
if (typeof window !== 'undefined') {
  // Only patch in browser environment
  setTimeout(() => patchSupabaseHelpers(), 0);
}