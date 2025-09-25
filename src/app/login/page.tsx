'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { HeartIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';
import {
    EnvelopeIcon,
    LockClosedIcon
} from '@heroicons/react/24/outline';

export default function LoginPage() {
    const { user, userProfile, loading: authLoading } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    // Handle redirect after successful authentication
    useEffect(() => {
        if (!authLoading && user && userProfile) {
            // Role-based redirect
            switch (userProfile.user_role) {
                case 'admin':
                    router.push('/admin');
                    break;
                case 'veterinarian':
                    router.push('/veterinarian');
                    break;
                case 'pet_owner':
                    router.push('/dashboard');
                    break;
                default:
                    router.push('/dashboard');
                    break;
            }
        }
    }, [user, userProfile, authLoading, router]);

    // Show loading spinner while checking auth state
    if (authLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#0032A0] border-t-transparent mx-auto mb-4"></div>
                    <p className="text-[#0032A0]">Loading...</p>
                </div>
            </div>
        );
    }

    // If user is already logged in, don't show login form
    if (user && userProfile) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#0032A0] border-t-transparent mx-auto mb-4"></div>
                    <p className="text-[#0032A0]">Redirecting...</p>
                </div>
            </div>
        );
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear error when user starts typing
        if (error) {
            setError('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (signInError) throw signInError;

            // Check if user is a veterinarian and verify their approval status
            if (authData.user) {
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('user_role, is_active, verification_status')
                    .eq('id', authData.user.id)
                    .single();

                if (profileError) {
                    console.error('Error fetching user profile:', profileError);
                    throw new Error('Failed to verify account status');
                }

                // If user is a veterinarian, check verification status
                if (profile?.user_role === 'veterinarian') {
                    if (!profile.is_active) {
                        // Sign out the user since they shouldn't have access
                        await supabase.auth.signOut();
                        
                        if (profile.verification_status === 'pending') {
                            throw new Error('Your veterinarian account is still under review. Please wait for admin approval before signing in.');
                        } else if (profile.verification_status === 'rejected') {
                            throw new Error('Your veterinarian application has been rejected. Please contact support or submit a new application.');
                        } else {
                            throw new Error('Your veterinarian account is not yet activated. Please contact support.');
                        }
                    }
                }
            }

            // AuthContext will handle the redirect via useEffect once user and userProfile are available
            // No need to manually redirect here - let the auth state listener handle it
            
        } catch (err: any) {
            setError(err.message || 'Failed to sign in. Please try again.');
            setIsLoading(false); // Only set loading to false if there's an error
        }
        // Note: we don't set setIsLoading(false) in success case because we want to keep the
        // loading state until redirect happens
    };



    return (
        <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#b3c7e6] via-white to-[#0032A0] opacity-70"></div>

            <div className="max-w-md w-full space-y-8 relative z-10">
                {/* Header */}
                <div className="text-center">
                    <Link href="/" className="inline-flex items-center space-x-2 mb-8">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#0032A0] to-[#0053d6] rounded-lg flex items-center justify-center">
                            <HeartIcon className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-[#0032A0]">ZamboVet</span>
                    </Link>

                    <h2 className="text-3xl md:text-4xl font-bold text-[#0032A0] mb-2">
                        Welcome Back
                    </h2>
                    <p className="text-[#0032A0] text-lg">
                        Sign in to manage your pet's health
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Login Form */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-[#b3c7e6]">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-[#0032A0] mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <EnvelopeIcon className="h-5 w-5 text-[#b3c7e6]" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="block w-full pl-10 pr-3 py-3 border border-[#b3c7e6] rounded-lg focus:ring-2 focus:ring-[#0032A0] focus:border-transparent transition-all duration-200 text-[#0032A0] placeholder-[#b3c7e6]"
                                    placeholder="Enter your email"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-[#0032A0] mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <LockClosedIcon className="h-5 w-5 text-[#b3c7e6]" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="block w-full pl-10 pr-12 py-3 border border-[#b3c7e6] rounded-lg focus:ring-2 focus:ring-[#0032A0] focus:border-transparent transition-all duration-200 text-[#0032A0] placeholder-[#b3c7e6]"
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeSlashIcon className="h-5 w-5 text-[#b3c7e6] hover:text-[#0032A0]" />
                                    ) : (
                                        <EyeIcon className="h-5 w-5 text-[#b3c7e6] hover:text-[#0032A0]" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="rememberMe"
                                    name="rememberMe"
                                    type="checkbox"
                                    checked={formData.rememberMe}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-[#0032A0] focus:ring-[#0032A0] border-[#b3c7e6] rounded"
                                />
                                <label htmlFor="rememberMe" className="ml-2 block text-sm text-[#0032A0]">
                                    Remember me
                                </label>
                            </div>

                            <Link
                                href="/forgot-password"
                                className="text-sm text-[#0032A0] hover:text-[#0053d6] font-medium"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        {/* Sign In Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-[#0032A0] to-[#0053d6] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0032A0] transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isLoading ? (
                                <div className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing In...
                                </div>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>


                </div>

                {/* Sign Up Link */}
                <div className="text-center">
                    <p className="text-[#0032A0]">
                        Don't have an account?{' '}
                        <Link
                            href="/signup"
                            className="font-medium text-[#0032A0] hover:text-[#0053d6] transition-colors duration-200"
                        >
                            Sign up for free
                        </Link>
                    </p>
                </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute top-10 left-10 w-20 h-20 bg-[#b3c7e6]/30 rounded-full animate-float"></div>
            <div className="absolute bottom-10 right-10 w-32 h-32 bg-[#0032A0]/20 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-[#0053d6]/20 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        </div>
    );
}
