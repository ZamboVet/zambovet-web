/**
 * Cache utilities to handle browser cache and localStorage issues
 */

export const clearBrowserCache = () => {
  if (typeof window === 'undefined') return;
  
  try {
    // Clear localStorage
    localStorage.clear();
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Force reload without cache
    window.location.reload();
  } catch (error) {
    console.error('Error clearing browser cache:', error);
  }
};

export const clearSpecificKeys = (keys: string[]) => {
  if (typeof window === 'undefined') return;
  
  try {
    keys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Error clearing specific cache keys:', error);
  }
};

export const forceComponentRefresh = (setStateFunction: (value: boolean) => void) => {
  setStateFunction(false);
  setTimeout(() => setStateFunction(true), 10);
};