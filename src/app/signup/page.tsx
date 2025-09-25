'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { HeartIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';
import {
    EnvelopeIcon,
    LockClosedIcon,
    UserIcon,
    PhoneIcon,
    MapPinIcon,
    DocumentTextIcon,
    AcademicCapIcon,
    BanknotesIcon,
    ClockIcon
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
        userRole: 'pet_owner' as 'pet_owner' | 'veterinarian',

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
        businessPermit: null as File | null,
        governmentId: null as File | null,

        // Terms
        agreeToTerms: false,
        subscribeNewsletter: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [completedUserRole, setCompletedUserRole] = useState<'pet_owner' | 'veterinarian'>('pet_owner');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear any existing errors when user starts typing (avoid unnecessary re-renders)
        if (error && error.trim() !== '') {
            setError('');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'businessPermit' | 'governmentId') => {
        const file = e.target.files?.[0] || null;
        
        // Validate file type and size
        if (file) {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
            const maxSizeInMB = 5;
            
            // Enhanced file validation
            if (!allowedTypes.includes(file.type)) {
                setError(`Please upload a valid file for ${fieldName}. Allowed types: JPEG, PNG, PDF`);
                return;
            }
            
            if (file.size > maxSizeInMB * 1024 * 1024) {
                setError(`File size for ${fieldName} must be less than ${maxSizeInMB}MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
                return;
            }
            
            // Check file name length
            if (file.name.length > 100) {
                setError(`File name too long for ${fieldName}. Please rename your file to be shorter.`);
                return;
            }
            
            // Add success feedback for file selection
            console.log(`✅ Valid file selected for ${fieldName}: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
        }
        
        setFormData(prev => ({
            ...prev,
            [fieldName]: file
        }));
        
        // Clear any existing errors
        if (error) {
            setError('');
        }
    };

    const handleNextStep = () => {
        if (currentStep < (formData.userRole === 'veterinarian' ? 3 : 2)) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const validateStep1 = useCallback(() => {
        if (!formData.email) {
            return false;
        }
        if (!formData.password) {
            return false;
        }
        if (formData.password.length < 8) {
            return false;
        }
        if (!formData.confirmPassword) {
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            return false;
        }
        return true;
    }, [formData.email, formData.password, formData.confirmPassword]);

    const validateStep2 = useCallback(() => {
        if (!formData.fullName) {
            return false;
        }
        if (!formData.phone) {
            return false;
        }
        if (!formData.address) {
            return false;
        }
        // Skip terms agreement requirement for veterinarians
        if (formData.userRole === 'pet_owner' && !formData.agreeToTerms) {
            return false;
        }
        return true;
    }, [formData.fullName, formData.phone, formData.address, formData.agreeToTerms, formData.userRole]);

    const validateStep3 = useCallback(() => {
        if (formData.userRole !== 'veterinarian') return true;
        
        if (!formData.licenseNumber) {
            return false;
        }
        if (!formData.businessPermit) {
            return false;
        }
        if (!formData.governmentId) {
            return false;
        }
        return true;
    }, [formData.userRole, formData.licenseNumber, formData.businessPermit, formData.governmentId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate the current step
        if (formData.userRole === 'pet_owner' && !validateStep2()) {
            return;
        }
        if (formData.userRole === 'veterinarian' && !validateStep3()) {
            return;
        }

        setIsLoading(true);

        try {
            if (formData.userRole === 'veterinarian') {
                // Use the veterinarian registration API for document verification
                const registrationData = new FormData();
                registrationData.append('email', formData.email);
                registrationData.append('password', formData.password);
                registrationData.append('fullName', formData.fullName);
                registrationData.append('phone', formData.phone);
                registrationData.append('address', formData.address);
                registrationData.append('specialization', formData.specialization);
                registrationData.append('licenseNumber', formData.licenseNumber);
                registrationData.append('yearsExperience', formData.yearsExperience);
                registrationData.append('consultationFee', formData.consultationFee);
                
                if (formData.businessPermit) {
                    registrationData.append('businessPermit', formData.businessPermit);
                }
                if (formData.governmentId) {
                    registrationData.append('governmentId', formData.governmentId);
                }

                const response = await fetch('/api/veterinarian/register', {
                    method: 'POST',
                    body: registrationData,
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || 'Failed to register veterinarian');
                }

                // Save user role before clearing form
                setCompletedUserRole(formData.userRole);
                // Show success message with pending verification info
                setSuccess(true);
            } else {
                // Regular pet owner registration
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

                // Create profile record
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

                // Create pet owner profile
                const { data: existingProfile } = await supabase
                    .from('pet_owner_profiles')
                    .select('id')
                    .eq('user_id', authData.user.id)
                    .single();

                let petOwnerError;
                if (existingProfile) {
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

                handleSignupComplete(authData.user.id);
                // Save user role before clearing form
                setCompletedUserRole(formData.userRole);
                setSuccess(true);
            }

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
                businessPermit: null,
                governmentId: null,
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

    const isStep1Valid = useMemo(() => {
        return formData.email &&
            formData.password &&
            formData.confirmPassword &&
            formData.password === formData.confirmPassword &&
            formData.password.length >= 8;
    }, [formData.email, formData.password, formData.confirmPassword]);

    const isStep2Valid = useMemo(() => {
        return formData.fullName &&
            formData.phone &&
            formData.address &&
            (formData.userRole === 'veterinarian' || formData.agreeToTerms);
    }, [formData.fullName, formData.phone, formData.address, formData.agreeToTerms, formData.userRole]);

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
                            {completedUserRole === 'veterinarian' ? 'Application Submitted for Verification!' : 'Account Created Successfully!'}
                        </h2>
                        <p className="text-[#0032A0] mb-8">
                            {completedUserRole === 'veterinarian' 
                                ? 'Thank you for applying to join ZamboVet! Your veterinarian registration has been submitted for review. Our team will verify your documents within 2-3 business days and notify you via email once approved.'
                                : 'Welcome to ZamboVet! Please check your email to verify your account, then you can sign in and start using our services.'
                            }
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
                <div className="flex items-center justify-center space-x-2 mb-8">
                    <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 1 ? 'bg-[#0032A0] text-white' : 'bg-[#b3c7e6] text-[#0032A0]'}`}>1</div>
                        <span className={`ml-2 text-sm font-medium ${currentStep >= 1 ? 'text-[#0032A0]' : 'text-[#b3c7e6]'}`}>Account</span>
                    </div>
                    <div className={`w-8 h-0.5 ${currentStep >= 2 ? 'bg-[#0032A0]' : 'bg-[#b3c7e6]'}`}></div>
                    <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 2 ? 'bg-[#0032A0] text-white' : 'bg-[#b3c7e6] text-[#0032A0]'}`}>2</div>
                        <span className={`ml-2 text-sm font-medium ${currentStep >= 2 ? 'text-[#0032A0]' : 'text-[#b3c7e6]'}`}>Profile</span>
                    </div>
                    {formData.userRole === 'veterinarian' && (
                        <>
                            <div className={`w-8 h-0.5 ${currentStep >= 3 ? 'bg-[#0032A0]' : 'bg-[#b3c7e6]'}`}></div>
                            <div className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 3 ? 'bg-[#0032A0] text-white' : 'bg-[#b3c7e6] text-[#0032A0]'}`}>3</div>
                                <span className={`ml-2 text-sm font-medium ${currentStep >= 3 ? 'text-[#0032A0]' : 'text-[#b3c7e6]'}`}>Documents</span>
                            </div>
                        </>
                    )}
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
                                {/* User Role Selection */}
                                <div>
                                    <label htmlFor="userRole" className="block text-sm font-medium text-[#0032A0] mb-2">
                                        I want to register as:
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <label className="flex items-center space-x-3 p-3 border border-[#b3c7e6] rounded-lg cursor-pointer hover:bg-[#b3c7e6]/10 transition-colors">
                                            <input
                                                type="radio"
                                                name="userRole"
                                                value="pet_owner"
                                                checked={formData.userRole === 'pet_owner'}
                                                onChange={handleInputChange}
                                                className="w-4 h-4 text-[#0032A0] focus:ring-[#0032A0] border-[#b3c7e6]"
                                            />
                                            <div>
                                                <div className="text-sm font-medium text-[#0032A0]">Pet Owner</div>
                                                <div className="text-xs text-[#b3c7e6]">Book appointments for pets</div>
                                            </div>
                                        </label>
                                        <label className="flex items-center space-x-3 p-3 border border-[#b3c7e6] rounded-lg cursor-pointer hover:bg-[#b3c7e6]/10 transition-colors">
                                            <input
                                                type="radio"
                                                name="userRole"
                                                value="veterinarian"
                                                checked={formData.userRole === 'veterinarian'}
                                                onChange={handleInputChange}
                                                className="w-4 h-4 text-[#0032A0] focus:ring-[#0032A0] border-[#b3c7e6]"
                                            />
                                            <div>
                                                <div className="text-sm font-medium text-[#0032A0]">Veterinarian</div>
                                                <div className="text-xs text-[#b3c7e6]">Provide veterinary services</div>
                                            </div>
                                        </label>
                                    </div>
                                </div>

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
                                        if (isStep1Valid) {
                                            handleNextStep();
                                        } else {
                                            setError('Please fill in all required fields correctly');
                                        }
                                    }}
                                    disabled={!isStep1Valid}
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

                                    {formData.userRole === 'veterinarian' ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (isStep2Valid) {
                                                    handleNextStep();
                                                } else {
                                                    setError('Please fill in all required fields');
                                                }
                                            }}
                                            disabled={!isStep2Valid}
                                            className="flex-1 flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-[#0032A0] to-[#0053d6] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0032A0] transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                        >
                                            Continue
                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            disabled={!isStep2Valid || isLoading}
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
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Veterinarian Documents and Professional Info */}
                        {currentStep === 3 && formData.userRole === 'veterinarian' && (
                            <div className="space-y-6">
                                <div className="text-center mb-6">
                                    <h3 className="text-lg font-semibold text-[#0032A0] mb-2">Professional Verification</h3>
                                    <p className="text-sm text-[#b3c7e6]">Please provide your professional credentials for verification</p>
                                </div>

                                {/* Specialization */}
                                <div>
                                    <label htmlFor="specialization" className="block text-sm font-medium text-[#0032A0] mb-2">
                                        Specialization
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <AcademicCapIcon className="h-5 w-5 text-[#b3c7e6]" />
                                        </div>
                                        <input
                                            id="specialization"
                                            name="specialization"
                                            type="text"
                                            value={formData.specialization}
                                            onChange={handleInputChange}
                                            className="block w-full pl-10 pr-3 py-3 border border-[#b3c7e6] rounded-lg focus:ring-2 focus:ring-[#0032A0] focus:border-transparent transition-all duration-200 text-[#0032A0] placeholder-[#b3c7e6]"
                                            placeholder="e.g., General Practice, Small Animal Surgery"
                                        />
                                    </div>
                                </div>

                                {/* License Number */}
                                <div>
                                    <label htmlFor="licenseNumber" className="block text-sm font-medium text-[#0032A0] mb-2">
                                        License Number *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <DocumentTextIcon className="h-5 w-5 text-[#b3c7e6]" />
                                        </div>
                                        <input
                                            id="licenseNumber"
                                            name="licenseNumber"
                                            type="text"
                                            required
                                            value={formData.licenseNumber}
                                            onChange={handleInputChange}
                                            className="block w-full pl-10 pr-3 py-3 border border-[#b3c7e6] rounded-lg focus:ring-2 focus:ring-[#0032A0] focus:border-transparent transition-all duration-200 text-[#0032A0] placeholder-[#b3c7e6]"
                                            placeholder="VET123456789"
                                        />
                                    </div>
                                </div>

                                {/* Years of Experience and Consultation Fee */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="yearsExperience" className="block text-sm font-medium text-[#0032A0] mb-2">
                                            Years of Experience
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <ClockIcon className="h-5 w-5 text-[#b3c7e6]" />
                                            </div>
                                            <input
                                                id="yearsExperience"
                                                name="yearsExperience"
                                                type="number"
                                                min="0"
                                                value={formData.yearsExperience}
                                                onChange={handleInputChange}
                                                className="block w-full pl-10 pr-3 py-3 border border-[#b3c7e6] rounded-lg focus:ring-2 focus:ring-[#0032A0] focus:border-transparent transition-all duration-200 text-[#0032A0] placeholder-[#b3c7e6]"
                                                placeholder="5"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="consultationFee" className="block text-sm font-medium text-[#0032A0] mb-2">
                                            Consultation Fee (₱)
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <BanknotesIcon className="h-5 w-5 text-[#b3c7e6]" />
                                            </div>
                                            <input
                                                id="consultationFee"
                                                name="consultationFee"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={formData.consultationFee}
                                                onChange={handleInputChange}
                                                className="block w-full pl-10 pr-3 py-3 border border-[#b3c7e6] rounded-lg focus:ring-2 focus:ring-[#0032A0] focus:border-transparent transition-all duration-200 text-[#0032A0] placeholder-[#b3c7e6]"
                                                placeholder="1500.00"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Document Uploads */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-[#0032A0]">Required Documents *</h4>
                                    
                                    {/* Business Permit */}
                                    <div>
                                        <label htmlFor="businessPermit" className="block text-sm font-medium text-[#0032A0] mb-2">
                                            Business Permit *
                                        </label>
                                        <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition-all duration-200 ${
                                            formData.businessPermit 
                                                ? 'border-green-400 bg-green-50' 
                                                : 'border-[#b3c7e6] hover:border-[#0032A0]'
                                        }`}>
                                            <div className="space-y-1 text-center">
                                                {formData.businessPermit ? (
                                                    <div className="space-y-2">
                                                        <div className="mx-auto h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                                                            <DocumentTextIcon className="h-8 w-8 text-green-600" />
                                                        </div>
                                                        <div className="text-sm text-green-800">
                                                            <p className="font-medium">{formData.businessPermit.name}</p>
                                                            <p className="text-xs text-green-600">
                                                                {(formData.businessPermit.size / (1024 * 1024)).toFixed(2)} MB
                                                            </p>
                                                        </div>
                                                        <label htmlFor="businessPermit" className="cursor-pointer inline-flex items-center px-3 py-1 border border-green-600 text-xs font-medium rounded text-green-600 bg-white hover:bg-green-50">
                                                            Change file
                                                            <input
                                                                id="businessPermit"
                                                                name="businessPermit"
                                                                type="file"
                                                                required
                                                                className="sr-only"
                                                                accept="image/*,application/pdf"
                                                                onChange={(e) => handleFileChange(e, 'businessPermit')}
                                                            />
                                                        </label>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <DocumentTextIcon className="mx-auto h-12 w-12 text-[#b3c7e6]" />
                                                        <div className="flex text-sm text-[#0032A0]">
                                                            <label htmlFor="businessPermit" className="relative cursor-pointer bg-white rounded-md font-medium text-[#0032A0] hover:text-[#0053d6] focus-within:outline-none">
                                                                <span>Upload business permit</span>
                                                                <input
                                                                    id="businessPermit"
                                                                    name="businessPermit"
                                                                    type="file"
                                                                    required
                                                                    className="sr-only"
                                                                    accept="image/*,application/pdf"
                                                                    onChange={(e) => handleFileChange(e, 'businessPermit')}
                                                                />
                                                            </label>
                                                        </div>
                                                        <p className="text-xs text-[#b3c7e6]">PNG, JPG, PDF up to 5MB</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Government ID */}
                                    <div>
                                        <label htmlFor="governmentId" className="block text-sm font-medium text-[#0032A0] mb-2">
                                            Government ID *
                                        </label>
                                        <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition-all duration-200 ${
                                            formData.governmentId 
                                                ? 'border-green-400 bg-green-50' 
                                                : 'border-[#b3c7e6] hover:border-[#0032A0]'
                                        }`}>
                                            <div className="space-y-1 text-center">
                                                {formData.governmentId ? (
                                                    <div className="space-y-2">
                                                        <div className="mx-auto h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                                                            <DocumentTextIcon className="h-8 w-8 text-green-600" />
                                                        </div>
                                                        <div className="text-sm text-green-800">
                                                            <p className="font-medium">{formData.governmentId.name}</p>
                                                            <p className="text-xs text-green-600">
                                                                {(formData.governmentId.size / (1024 * 1024)).toFixed(2)} MB
                                                            </p>
                                                        </div>
                                                        <label htmlFor="governmentId" className="cursor-pointer inline-flex items-center px-3 py-1 border border-green-600 text-xs font-medium rounded text-green-600 bg-white hover:bg-green-50">
                                                            Change file
                                                            <input
                                                                id="governmentId"
                                                                name="governmentId"
                                                                type="file"
                                                                required
                                                                className="sr-only"
                                                                accept="image/*,application/pdf"
                                                                onChange={(e) => handleFileChange(e, 'governmentId')}
                                                            />
                                                        </label>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <DocumentTextIcon className="mx-auto h-12 w-12 text-[#b3c7e6]" />
                                                        <div className="flex text-sm text-[#0032A0]">
                                                            <label htmlFor="governmentId" className="relative cursor-pointer bg-white rounded-md font-medium text-[#0032A0] hover:text-[#0053d6] focus-within:outline-none">
                                                                <span>Upload government ID</span>
                                                                <input
                                                                    id="governmentId"
                                                                    name="governmentId"
                                                                    type="file"
                                                                    required
                                                                    className="sr-only"
                                                                    accept="image/*,application/pdf"
                                                                    onChange={(e) => handleFileChange(e, 'governmentId')}
                                                                />
                                                            </label>
                                                        </div>
                                                        <p className="text-xs text-[#b3c7e6]">PNG, JPG, PDF up to 5MB</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Verification Notice */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-start space-x-3">
                                        <div className="bg-blue-500 p-2 rounded-lg">
                                            <DocumentTextIcon className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-blue-900 mb-2">Document Verification Process</h4>
                                            <p className="text-sm text-blue-800 leading-relaxed mb-3">
                                                Your documents will be reviewed by our administrative team within 2-3 business days. 
                                                You'll receive an email notification once your application is approved.
                                            </p>
                                            <div className="space-y-1 text-xs text-blue-700">
                                                <div className="flex items-center">
                                                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                                                    Accepted formats: JPEG, PNG, PDF
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                                                    Maximum file size: 5MB per document
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                                                    Ensure documents are clear and legible
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-blue-800">Account Verification Required</h3>
                                            <div className="mt-2 text-sm text-blue-700">
                                                <ul className="list-disc list-inside space-y-1">
                                                    <li>Your account will be pending verification after registration</li>
                                                    <li>Our team will review your documents within 2-3 business days</li>
                                                    <li>You'll receive an email notification once approved</li>
                                                    <li>Only verified veterinarians can provide services on our platform</li>
                                                </ul>
                                            </div>
                                        </div>
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
                                        disabled={!validateStep3() || isLoading}
                                        className="flex-1 flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-[#0032A0] to-[#0053d6] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0032A0] transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center">
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Submitting for Verification...
                                            </div>
                                        ) : (
                                            'Submit for Verification'
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

