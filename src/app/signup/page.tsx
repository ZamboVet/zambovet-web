'use client';

import { useState } from 'react';
import Link from 'next/link';
import { HeartIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';
import {
    EnvelopeIcon,
    LockClosedIcon,
    UserIcon,
    PhoneIcon,
    MapPinIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function SignupPage() {
    const { handleSignupComplete } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        // Basic Info (Step 1)
        email: '',
        password: '',
        confirmPassword: '',
        userRole: 'pet_owner' as 'pet_owner',

        // Personal Info (Step 2)
        fullName: '',
        phone: '',
        address: '',
        emergencyContactName: '',
        emergencyContactPhone: '',

        // Veterinarian specific fields (if userRole is veterinarian)
        specialization: '',
        licenseNumber: '',
        yearsExperience: '',
        consultationFee: '',

        // Terms
        agreeToTerms: false,
        subscribeNewsletter: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear any existing errors when user starts typing
        if (error) {
            setError('');
        }
    };

    const handleNextStep = () => {
        if (currentStep < 2) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const validateStep1 = () => {
        if (!formData.email) {
            setError('Email is required');
            return false;
        }
        if (!formData.password) {
            setError('Password is required');
            return false;
        }
        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long');
            return false;
        }
        if (!formData.confirmPassword) {
            setError('Please confirm your password');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        if (!formData.fullName) {
            setError('Full name is required');
            return false;
        }
        if (!formData.phone) {
            setError('Phone number is required');
            return false;
        }
        if (!formData.address) {
            setError('Address is required');
            return false;
        }
        if (!formData.agreeToTerms) {
            setError('You must agree to the Terms of Service and Privacy Policy');
            return false;
        }



        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateStep2()) {
            return;
        }

        setIsLoading(true);

        try {
            // Step 1: Create user account with Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        user_role: formData.userRole,
                    }
                }
            });

            if (authError) {
                throw new Error(authError.message);
            }

            if (!authData.user) {
                throw new Error('Failed to create user account');
            }

            // Step 2: Create or update profile record (upsert)
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: authData.user.id,
                    email: formData.email,
                    full_name: formData.fullName,
                    phone: formData.phone,
                    user_role: formData.userRole,
                    is_active: true
                }, {
                    onConflict: 'id'
                });

            if (profileError) {
                throw new Error(`Failed to create profile: ${profileError.message}`);
            }

            // Step 3: Check if pet owner profile exists, then insert or update
            const { data: existingProfile } = await supabase
                .from('pet_owner_profiles')
                .select('id')
                .eq('user_id', authData.user.id)
                .single();

            let petOwnerError;
            if (existingProfile) {
                // Update existing profile
                const { error } = await supabase
                    .from('pet_owner_profiles')
                    .update({
                        full_name: formData.fullName,
                        phone: formData.phone,
                        address: formData.address,
                        emergency_contact_name: formData.emergencyContactName || null,
                        emergency_contact_phone: formData.emergencyContactPhone || null
                    })
                    .eq('user_id', authData.user.id);
                petOwnerError = error;
            } else {
                // Insert new profile
                const { error } = await supabase
                    .from('pet_owner_profiles')
                    .insert({
                        user_id: authData.user.id,
                        full_name: formData.fullName,
                        phone: formData.phone,
                        address: formData.address,
                        emergency_contact_name: formData.emergencyContactName || null,
                        emergency_contact_phone: formData.emergencyContactPhone || null
                    });
                petOwnerError = error;
            }

            if (petOwnerError) {
                throw new Error(`Failed to create pet owner profile: ${petOwnerError.message}`);
            }

            // Trigger profile refresh in AuthContext (non-blocking)
            handleSignupComplete(authData.user.id);

            // Success - show success message
            setSuccess(true);

            // Clear form data from memory for security
            setFormData({
                email: '',
                password: '',
                confirmPassword: '',
                userRole: 'pet_owner',
                fullName: '',
                phone: '',
                address: '',
                emergencyContactName: '',
                emergencyContactPhone: '',
                specialization: '',
                licenseNumber: '',
                yearsExperience: '',
                consultationFee: '',
                agreeToTerms: false,
                subscribeNewsletter: false
            });

        } catch (err: any) {
            console.error('Signup error:', err);
            setError(err.message || 'Failed to create account. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const isStep1Valid = () => {
        return formData.email &&
            formData.password &&
            formData.confirmPassword &&
            formData.password === formData.confirmPassword &&
            formData.password.length >= 8;
    };

    const isStep2Valid = () => {
        return formData.fullName &&
            formData.phone &&
            formData.address &&
            formData.agreeToTerms;
    };

    // Success screen
    if (success) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="absolute inset-0 bg-gradient-to-br from-[#b3c7e6] via-white to-[#0032A0] opacity-70"></div>

                <div className="max-w-md w-full space-y-8 relative z-10">
                    <div className="text-center">
                        <Link href="/" className="inline-flex items-center space-x-2 mb-8">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#0032A0] to-[#0053d6] rounded-lg flex items-center justify-center">
                                <HeartIcon className="w-7 h-7 text-white" />
                            </div>
                            <span className="text-2xl font-bold text-[#0032A0]">ZamboVet</span>
                        </Link>

                        <div className="w-16 h-16 bg-gradient-to-br from-[#0032A0] to-[#0053d6] rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <h2 className="text-3xl font-bold text-[#0032A0] mb-4">
                            Account Created Successfully!
                        </h2>
                        <p className="text-[#0032A0] mb-8">
                            Welcome to ZamboVet! Please check your email to verify your account, then you can sign in and start using our services.
                        </p>

                        <div className="space-y-4">
                            <Link
                                href="/login"
                                className="w-full inline-flex justify-center bg-gradient-to-r from-[#0032A0] to-[#0053d6] text-white px-6 py-3 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
                            >
                                Sign In to Your Account
                            </Link>

                            <Link
                                href="/"
                                className="w-full inline-flex justify-center px-6 py-3 border border-[#b3c7e6] text-[#0032A0] rounded-lg hover:bg-[#b3c7e6]/20 transition-colors duration-200 font-medium"
                            >
                                Back to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
                        Create Account
                    </h2>
                    <p className="text-[#0032A0] text-lg">
                        Join thousands of pet parents who trust ZamboVet
                    </p>
                </div>

                {/* Progress Indicator */}
                <div className="flex items-center justify-center space-x-4 mb-8">
                    <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 1 ? 'bg-[#0032A0] text-white' : 'bg-[#b3c7e6] text-[#0032A0]'}`}>1</div>
                        <span className={`ml-2 text-sm font-medium ${currentStep >= 1 ? 'text-[#0032A0]' : 'text-[#b3c7e6]'}`}>Account</span>
                    </div>
                    <div className={`w-8 h-0.5 ${currentStep >= 2 ? 'bg-[#0032A0]' : 'bg-[#b3c7e6]'}`}></div>
                    <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 2 ? 'bg-[#0032A0] text-white' : 'bg-[#b3c7e6] text-[#0032A0]'}`}>2</div>
                        <span className={`ml-2 text-sm font-medium ${currentStep >= 2 ? 'text-[#0032A0]' : 'text-[#b3c7e6]'}`}>Profile</span>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
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

                {/* Signup Form */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-[#b3c7e6]">
                    <form className="space-y-6" onSubmit={handleSubmit}>

                        {/* Step 1: Account Information */}
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                {/* Hidden User Role - Always Pet Owner */}
                                <input
                                    type="hidden"
                                    name="userRole"
                                    value="pet_owner"
                                />

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
                                            autoComplete="new-password"
                                            required
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            className="block w-full pl-10 pr-12 py-3 border border-[#b3c7e6] rounded-lg focus:ring-2 focus:ring-[#0032A0] focus:border-transparent transition-all duration-200 text-[#0032A0] placeholder-[#b3c7e6]"
                                            placeholder="Create a password"
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
                                    <p className="mt-1 text-xs text-[#b3c7e6]">
                                        Must be at least 8 characters long
                                    </p>
                                </div>

                                {/* Confirm Password Field */}
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#0032A0] mb-2">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <LockClosedIcon className="h-5 w-5 text-[#b3c7e6]" />
                                        </div>
                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            autoComplete="new-password"
                                            required
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            className="block w-full pl-10 pr-12 py-3 border border-[#b3c7e6] rounded-lg focus:ring-2 focus:ring-[#0032A0] focus:border-transparent transition-all duration-200 text-[#0032A0] placeholder-[#b3c7e6]"
                                            placeholder="Confirm your password"
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? (
                                                <EyeSlashIcon className="h-5 w-5 text-[#b3c7e6] hover:text-[#0032A0]" />
                                            ) : (
                                                <EyeIcon className="h-5 w-5 text-[#b3c7e6] hover:text-[#0032A0]" />
                                            )}
                                        </button>
                                    </div>
                                    {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                        <p className="mt-1 text-xs text-red-500">
                                            Passwords do not match
                                        </p>
                                    )}
                                </div>

                                {/* Next Button */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (validateStep1()) {
                                            handleNextStep();
                                        }
                                    }}
                                    disabled={!isStep1Valid()}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-[#0032A0] to-[#0053d6] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0032A0] transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    Continue
                                </button>
                            </div>
                        )}

                        {/* Step 2: Personal Information */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                {/* Full Name */}
                                <div>
                                    <label htmlFor="fullName" className="block text-sm font-medium text-[#0032A0] mb-2">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <UserIcon className="h-5 w-5 text-[#b3c7e6]" />
                                        </div>
                                        <input
                                            id="fullName"
                                            name="fullName"
                                            type="text"
                                            autoComplete="name"
                                            required
                                            value={formData.fullName}
                                            onChange={handleInputChange}
                                            className="block w-full pl-10 pr-3 py-3 border border-[#b3c7e6] rounded-lg focus:ring-2 focus:ring-[#0032A0] focus:border-transparent transition-all duration-200 text-[#0032A0] placeholder-[#b3c7e6]"
                                            placeholder="Enter your full name"
                                        />
                                    </div>
                                </div>

                                {/* Phone */}
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-[#0032A0] mb-2">
                                        Phone Number
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <PhoneIcon className="h-5 w-5 text-[#b3c7e6]" />
                                        </div>
                                        <input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            autoComplete="tel"
                                            required
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className="block w-full pl-10 pr-3 py-3 border border-[#b3c7e6] rounded-lg focus:ring-2 focus:ring-[#0032A0] focus:border-transparent transition-all duration-200 text-[#0032A0] placeholder-[#b3c7e6]"
                                            placeholder="+1 (555) 123-4567"
                                        />
                                    </div>
                                </div>

                                {/* Address */}
                                <div>
                                    <label htmlFor="address" className="block text-sm font-medium text-[#0032A0] mb-2">
                                        Address
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 pt-3 pointer-events-none">
                                            <MapPinIcon className="h-5 w-5 text-[#b3c7e6]" />
                                        </div>
                                        <textarea
                                            id="address"
                                            name="address"
                                            rows={3}
                                            required
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            className="block w-full pl-10 pr-3 py-3 border border-[#b3c7e6] rounded-lg focus:ring-2 focus:ring-[#0032A0] focus:border-transparent transition-all duration-200 text-[#0032A0] placeholder-[#b3c7e6] resize-none"
                                            placeholder="Enter your full address"
                                        />
                                    </div>
                                </div>

                                {/* Conditional Fields for Pet Owners */}
                                {formData.userRole === 'pet_owner' && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="emergencyContactName" className="block text-sm font-medium text-[#0032A0] mb-2">
                                                Emergency Contact Name
                                            </label>
                                            <input
                                                id="emergencyContactName"
                                                name="emergencyContactName"
                                                type="text"
                                                value={formData.emergencyContactName}
                                                onChange={handleInputChange}
                                                className="block w-full px-3 py-3 border border-[#b3c7e6] rounded-lg focus:ring-2 focus:ring-[#0032A0] focus:border-transparent transition-all duration-200 text-[#0032A0] placeholder-[#b3c7e6]"
                                                placeholder="Contact name"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-[#0032A0] mb-2">
                                                Emergency Contact Phone
                                            </label>
                                            <input
                                                id="emergencyContactPhone"
                                                name="emergencyContactPhone"
                                                type="tel"
                                                value={formData.emergencyContactPhone}
                                                onChange={handleInputChange}
                                                className="block w-full px-3 py-3 border border-[#b3c7e6] rounded-lg focus:ring-2 focus:ring-[#0032A0] focus:border-transparent transition-all duration-200 text-[#0032A0] placeholder-[#b3c7e6]"
                                                placeholder="Contact phone"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Terms and Conditions */}
                                <div className="space-y-4">
                                    <div className="flex items-start">
                                        <input
                                            id="agreeToTerms"
                                            name="agreeToTerms"
                                            type="checkbox"
                                            required
                                            checked={formData.agreeToTerms}
                                            onChange={handleInputChange}
                                            className="h-4 w-4 text-[#0032A0] focus:ring-[#0032A0] border-[#b3c7e6] rounded mt-1"
                                        />
                                        <label htmlFor="agreeToTerms" className="ml-3 block text-sm text-[#0032A0]">
                                            I agree to the{' '}
                                            <Link href="/terms" className="text-[#0032A0] hover:text-[#0053d6] font-medium">
                                                Terms of Service
                                            </Link>{' '}
                                            and{' '}
                                            <Link href="/privacy" className="text-[#0032A0] hover:text-[#0053d6] font-medium">
                                                Privacy Policy
                                            </Link>
                                        </label>
                                    </div>

                                    <div className="flex items-start">
                                        <input
                                            id="subscribeNewsletter"
                                            name="subscribeNewsletter"
                                            type="checkbox"
                                            checked={formData.subscribeNewsletter}
                                            onChange={handleInputChange}
                                            className="h-4 w-4 text-[#0032A0] focus:ring-[#0032A0] border-[#b3c7e6] rounded mt-1"
                                        />
                                        <label htmlFor="subscribeNewsletter" className="ml-3 block text-sm text-[#0032A0]">
                                            Subscribe to our newsletter for pet care tips and updates
                                        </label>
                                    </div>
                                </div>

                                {/* Navigation Buttons */}
                                <div className="flex space-x-4">
                                    <button
                                        type="button"
                                        onClick={handlePrevStep}
                                        className="flex-1 py-3 px-4 border border-[#b3c7e6] text-sm font-medium rounded-lg text-[#0032A0] bg-white hover:bg-[#b3c7e6]/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0032A0] transition-all duration-200"
                                    >
                                        Back
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={!isStep2Valid() || isLoading}
                                        className="flex-1 flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-[#0032A0] to-[#0053d6] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0032A0] transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center">
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Creating Account...
                                            </div>
                                        ) : (
                                            'Create Account'
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>


                </div>

                {/* Sign In Link */}
                <div className="text-center">
                    <p className="text-[#0032A0]">
                        Already have an account?{' '}
                        <Link
                            href="/login"
                            className="font-medium text-[#0032A0] hover:text-[#0053d6] transition-colors duration-200"
                        >
                            Sign in
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

