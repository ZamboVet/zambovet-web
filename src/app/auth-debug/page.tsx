'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface AuthTestResult {
  cookies: { name: string; hasValue: boolean; valueLength?: number }[];
  user: any;
  session: any;
  userError?: string;
  sessionError?: string;
  env: {
    supabaseUrl: boolean;
    anonKey: boolean;
  };
}

export default function AuthDebugPage() {
  const { user, session, userProfile, loading } = useAuth();
  const [authTest, setAuthTest] = useState<AuthTestResult | null>(null);
  const [apiTest, setApiTest] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const testClientAuth = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      console.log('Client Auth Test:', {
        session: session ? 'EXISTS' : 'NULL',
        user: user ? 'EXISTS' : 'NULL',
        sessionError: sessionError?.message,
        userError: userError?.message
      });
    } catch (error) {
      console.error('Client auth test failed:', error);
    }
  };

  const testServerAuth = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/auth-test', {
        credentials: 'include',
      });
      const data = await response.json();
      setAuthTest(data.data || data);
      
      // Test the veterinarian clinic API
      const clinicResponse = await fetch('/api/veterinarian/clinic', {
        credentials: 'include',
      });
      const clinicData = await clinicResponse.json();
      setApiTest({
        status: clinicResponse.status,
        data: clinicData
      });
    } catch (error) {
      console.error('Server auth test failed:', error);
      setAuthTest({ error: error.message } as any);
    } finally {
      setTesting(false);
    }
  };

  const clearAllAuth = () => {
    // Clear all auth data
    if (typeof window !== 'undefined') {
      // Clear all cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      
      // Clear local storage
      localStorage.clear();
      
      // Clear session storage
      sessionStorage.clear();
      
      // Sign out from Supabase
      supabase.auth.signOut();
      
      alert('All authentication data cleared. Please refresh the page.');
    }
  };

  const handleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com', // Replace with test credentials
        password: 'password123'
      });
      
      if (error) {
        alert('Login failed: ' + error.message);
      } else {
        alert('Login successful!');
        // Refresh the page to update auth state
        window.location.reload();
      }
    } catch (error) {
      alert('Login error: ' + error.message);
    }
  };

  useEffect(() => {
    testClientAuth();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Debug Panel</h1>
            <p className="text-gray-600">Diagnose authentication issues</p>
          </div>

          {/* Auth Context State */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="font-semibold text-blue-900 mb-3">Auth Context State</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Loading:</span> {loading ? 'Yes' : 'No'}
              </div>
              <div>
                <span className="font-medium">User:</span> {user ? `${user.email} (${user.id})` : 'None'}
              </div>
              <div>
                <span className="font-medium">Session:</span> {session ? 'Active' : 'None'}
              </div>
              <div>
                <span className="font-medium">User Profile:</span> {userProfile ? `${userProfile.user_role}` : 'None'}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mb-6 flex flex-wrap gap-3">
            <button
              onClick={testServerAuth}
              disabled={testing}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {testing ? 'Testing...' : 'Test Server Auth'}
            </button>
            <button
              onClick={testClientAuth}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Test Client Auth
            </button>
            <button
              onClick={handleLogin}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Try Login (Test)
            </button>
            <button
              onClick={clearAllAuth}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Clear All Auth Data
            </button>
          </div>

          {/* Server Auth Test Results */}
          {authTest && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h2 className="font-semibold text-gray-900 mb-3">Server Auth Test Results</h2>
              <pre className="text-xs bg-white p-3 rounded border overflow-auto">
                {JSON.stringify(authTest, null, 2)}
              </pre>
            </div>
          )}

          {/* API Test Results */}
          {apiTest && (
            <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
              <h2 className="font-semibold text-yellow-900 mb-3">
                Veterinarian API Test (Status: {apiTest.status})
              </h2>
              <pre className="text-xs bg-white p-3 rounded border overflow-auto">
                {JSON.stringify(apiTest.data, null, 2)}
              </pre>
            </div>
          )}

          {/* Browser Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h2 className="font-semibold text-gray-900 mb-3">Browser Environment</h2>
            <div className="text-sm space-y-1">
              <div><span className="font-medium">User Agent:</span> {navigator.userAgent}</div>
              <div><span className="font-medium">Cookies Enabled:</span> {navigator.cookieEnabled ? 'Yes' : 'No'}</div>
              <div><span className="font-medium">Local Storage:</span> {typeof(Storage) !== "undefined" ? 'Available' : 'Not Available'}</div>
              <div><span className="font-medium">Current URL:</span> {window.location.href}</div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h2 className="font-semibold text-green-900 mb-3">Troubleshooting Steps</h2>
            <ol className="text-sm text-green-800 space-y-2">
              <li>1. Click "Test Server Auth" to check if cookies are being passed correctly</li>
              <li>2. If no cookies are found, try logging in with valid credentials</li>
              <li>3. Check the browser's developer tools for any cookie-related errors</li>
              <li>4. If issues persist, click "Clear All Auth Data" and try logging in again</li>
              <li>5. Ensure your environment variables are set correctly (.env.local)</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}