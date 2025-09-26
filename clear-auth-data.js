/**
 * Emergency Auth Data Cleaner
 * Run this script in the browser console to clear all authentication data
 * 
 * Usage:
 * 1. Open browser DevTools (F12)
 * 2. Go to Console tab
 * 3. Copy and paste this entire script
 * 4. Press Enter
 * 5. Refresh the page
 */

(function clearAllAuthData() {
  console.log('🧹 Starting emergency auth data cleanup...');
  
  // List of possible Supabase auth cookies
  const authCookies = [
    'sb-auth-token',
    'supabase-auth-token',
    'sb-access-token',
    'sb-refresh-token',
    'supabase.auth.token',
    'supabase-auth',
  ];

  // Clear cookies
  console.log('🍪 Clearing cookies...');
  authCookies.forEach(cookieName => {
    // Standard clear
    document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax`;
    document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax; domain=${window.location.hostname}`;
    
    // Clear with leading dot for domain cookies
    if (window.location.hostname !== 'localhost') {
      document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax; domain=.${window.location.hostname}`;
    }
    
    console.log(`  ✅ Cleared cookie: ${cookieName}`);
  });

  // Clear localStorage
  console.log('💾 Clearing localStorage...');
  try {
    const localStorageKeys = Object.keys(localStorage);
    const authKeys = localStorageKeys.filter(key => 
      key.includes('supabase') || 
      key.includes('sb-') || 
      key.includes('auth') ||
      key.includes('token')
    );
    
    authKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`  ✅ Removed localStorage: ${key}`);
    });
  } catch (error) {
    console.warn('❌ Could not clear localStorage:', error);
  }

  // Clear sessionStorage
  console.log('🗂️ Clearing sessionStorage...');
  try {
    const sessionStorageKeys = Object.keys(sessionStorage);
    const authKeys = sessionStorageKeys.filter(key => 
      key.includes('supabase') || 
      key.includes('sb-') || 
      key.includes('auth') ||
      key.includes('token')
    );
    
    authKeys.forEach(key => {
      sessionStorage.removeItem(key);
      console.log(`  ✅ Removed sessionStorage: ${key}`);
    });
  } catch (error) {
    console.warn('❌ Could not clear sessionStorage:', error);
  }

  // Clear any indexed DB storage (if used)
  console.log('🗄️ Attempting to clear IndexedDB...');
  if ('indexedDB' in window) {
    try {
      // This is a more aggressive approach - you might need to adjust based on your setup
      const deleteRequest = indexedDB.deleteDatabase('supabase-cache');
      deleteRequest.onsuccess = () => console.log('  ✅ Cleared IndexedDB');
      deleteRequest.onerror = (error) => console.warn('  ❌ Could not clear IndexedDB:', error);
    } catch (error) {
      console.warn('  ❌ IndexedDB clearing failed:', error);
    }
  }

  console.log('🎉 Auth data cleanup completed!');
  console.log('🔄 Please refresh the page to complete the process.');
  
  // Optionally redirect to login page after a short delay
  setTimeout(() => {
    if (confirm('Auth data cleared! Would you like to go to the login page?')) {
      window.location.href = '/login';
    }
  }, 2000);
})();