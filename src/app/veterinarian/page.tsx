'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
    CalendarDaysIcon,
    ClipboardDocumentListIcon,
    UserCircleIcon,
    StarIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    EyeIcon,
    PencilIcon,
    PhoneIcon,
    MapPinIcon,
    DocumentTextIcon,
    ChartBarIcon,
    AcademicCapIcon,
    BuildingOffice2Icon,
    ArrowRightOnRectangleIcon,
    ChatBubbleBottomCenterTextIcon,
    WrenchScrewdriverIcon,
    PresentationChartBarIcon,
    HeartIcon
} from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';

// Dynamically import PatientMedicalRecords to avoid SSR issues
const PatientMedicalRecords = dynamic(() => import('@/components/medical/PatientMedicalRecords'), {
    ssr: false,
    loading: () => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="animate-pulse">
                <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                    <div className="space-y-2 flex-1">
                        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
                    ))}
                </div>
            </div>
        </div>
    )
});

// Dynamically import LocationPicker to avoid SSR issues with Leaflet
const LocationPicker = dynamic(() => import('@/components/maps/LocationPicker'), {
    ssr: false,
    loading: () => <div className="h-96 bg-stone-100 rounded-lg flex items-center justify-center">Loading map...</div>
});

// Dynamically import ClinicMapView to avoid SSR issues with Leaflet
const ClinicMapView = dynamic(() => import('@/components/maps/ClinicMapView'), {
    ssr: false,
    loading: () => <div className="h-72 bg-stone-100 rounded-lg flex items-center justify-center">Loading clinic map...</div>
});

interface VetStats {
    totalAppointments: number;
    pendingAppointments: number;
    completedToday: number;
    averageRating: number;
    totalReviews: number;
    loading: boolean;
}

export default function VeterinarianDashboard() {
    const { user, userProfile, session, signOut } = useAuth();
    const router = useRouter();
    
    // Debug: Log auth state
    console.log('Vet Dashboard Auth State:', {
        user: user ? 'EXISTS' : 'NULL',
        userId: user?.id,
        userProfile: userProfile ? 'EXISTS' : 'NULL', 
        userRole: userProfile?.user_role,
        session: session ? 'EXISTS' : 'NULL'
    });
    
    const [activeTab, setActiveTab] = useState('overview');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [vetStats, setVetStats] = useState<VetStats>({
        totalAppointments: 0,
        pendingAppointments: 0,
        completedToday: 0,
        averageRating: 0,
        totalReviews: 0,
        loading: true
    });

    const [appointments, setAppointments] = useState<unknown[]>([]);
    const [vetProfile, setVetProfile] = useState<unknown>(null);
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    
    // Patient records management states
    const [patients, setPatients] = useState<unknown[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [patientsLoading, setPatientsLoading] = useState(false);
    
    // Appointment management states
    const [selectedAppointment, setSelectedAppointment] = useState<unknown>(null);
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [showDeclineModal, setShowDeclineModal] = useState(false);
    const [declineReason, setDeclineReason] = useState('');
    const [appointmentLoading, setAppointmentLoading] = useState(false);
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const [clinicLoading, setClinicLoading] = useState(false);
    const [clinicData, setClinicData] = useState({
        name: '',
        address: '',
        phone: '',
        latitude: null as number | null,
        longitude: null as number | null
    });

    const fetchVetData = useCallback(async () => {
        console.log('fetchVetData called with:', { 
            userId: user?.id, 
            userRole: userProfile?.user_role,
            hasSupabase: !!supabase 
        });
        
        if (!user?.id) {
            console.log('No user ID available for veterinarian data fetch');
            setVetStats(prev => ({ ...prev, loading: false }));
            return;
        }

        try {
            setClinicLoading(true);
            console.log('Fetching veterinarian data for user:', user.id);
            
            // Test basic connectivity first
            console.log('Testing Supabase connection...');
            const { data: testData, error: testError } = await supabase.from('profiles').select('id').limit(1);
            console.log('Connection test result:', { testData, testError });
            
            // First, get veterinarian profile with proper error handling
            const { data: vetData, error: vetError } = await supabase
                .from('veterinarians')
                .select(`
                    id,
                    user_id,
                    clinic_id,
                    full_name,
                    specialization,
                    license_number,
                    years_experience,
                    consultation_fee,
                    is_available,
                    average_rating,
                    created_at,
                    updated_at
                `)
                .eq('user_id', user.id)
                .single();

            console.log('Veterinarian query result:', { data: vetData, error: vetError });

            // Handle veterinarian not found case
            if (vetError) {
                if (vetError.code === 'PGRST116') {
                    console.log('No veterinarian profile found for user. Using temporary mock data for development.');
                    
                    // For development purposes, use mock data instead of showing NOT_FOUND
                    const mockVetProfile = {
                        id: 'mock-vet-id',
                        user_id: user.id,
                        full_name: userProfile?.full_name || 'Dr. Developer',
                        specialization: 'General Practice',
                        license_number: 'DEV-001',
                        years_experience: 5,
                        consultation_fee: 500,
                        is_available: true,
                        average_rating: 4.5
                    };
                    
                    setVetProfile(mockVetProfile);
                    setVetStats({
                        totalAppointments: 0,
                        pendingAppointments: 0,
                        completedToday: 0,
                        averageRating: 4.5,
                        totalReviews: 0,
                        loading: false
                    });
                    setClinicLoading(false);
                    return;
                }
                console.error('Error fetching veterinarian data:', vetError);
                throw new Error(`Failed to fetch veterinarian data: ${vetError.message}`);
            }

            if (!vetData) {
                console.error('No veterinarian data returned');
                setVetStats(prev => ({ ...prev, loading: false }));
                setVetProfile('NOT_FOUND');
                return;
            }

            setVetProfile(vetData);

            // Fetch clinic data separately if clinic_id exists
            if (vetData.clinic_id) {
                try {
                    const { data: clinicData, error: clinicError } = await supabase
                        .from('clinics')
                        .select(`
                            id,
                            name,
                            address,
                            phone,
                            email,
                            latitude,
                            longitude,
                            operating_hours,
                            is_active
                        `)
                        .eq('id', vetData.clinic_id)
                        .single();

                    if (clinicData && !clinicError) {
                        setClinicData({
                            name: clinicData.name || '',
                            address: clinicData.address || '',
                            phone: clinicData.phone || '',
                            latitude: clinicData.latitude || null,
                            longitude: clinicData.longitude || null
                        });
                        // Update vetProfile with clinic data
                        setVetProfile(prev => ({ ...prev, clinics: clinicData }));
                    } else {
                        console.warn('Failed to fetch clinic data:', clinicError);
                    }
                } catch (clinicError) {
                    console.warn('Error fetching clinic data:', clinicError);
                }
            }

            // Fetch statistics with optimized queries and proper error handling
            console.log('Fetching appointment statistics for vet ID:', vetData.id);
            
            try {
                // Get today's date in YYYY-MM-DD format
                const today = new Date();
                const todayString = today.toISOString().split('T')[0];
                
                const [
                    { data: appointmentStats },
                    { data: reviewsData, error: reviewsError }
                ] = await Promise.all([
                    // Single query to get all appointment statistics
                    supabase
                        .from('appointments')
                        .select('id, status, appointment_date')
                        .eq('veterinarian_id', vetData.id),
                    // Get reviews for average rating calculation
                    supabase
                        .from('reviews')
                        .select('rating')
                        .eq('veterinarian_id', vetData.id)
                ]);

                // Process appointment statistics
                const totalAppointments = appointmentStats?.length || 0;
                const pendingAppointments = appointmentStats?.filter(apt => apt.status === 'pending')?.length || 0;
                const completedToday = appointmentStats?.filter(apt => 
                    apt.status === 'completed' && apt.appointment_date === todayString
                )?.length || 0;

                // Calculate average rating with error handling
                let avgRating = 0;
                let totalReviews = 0;
                
                if (reviewsData && !reviewsError && reviewsData.length > 0) {
                    totalReviews = reviewsData.length;
                    const validRatings = reviewsData.filter(review => 
                        review.rating != null && !isNaN(review.rating)
                    );
                    if (validRatings.length > 0) {
                        avgRating = validRatings.reduce((sum, review) => sum + Number(review.rating), 0) / validRatings.length;
                    }
                }

                console.log('Statistics calculated:', {
                    totalAppointments,
                    pendingAppointments,
                    completedToday,
                    avgRating,
                    totalReviews
                });

                setVetStats({
                    totalAppointments,
                    pendingAppointments,
                    completedToday,
                    averageRating: Number(avgRating.toFixed(1)),
                    totalReviews,
                    loading: false
                });

            } catch (statsError) {
                console.error('Error fetching statistics:', statsError);
                // Set default stats if statistics fetch fails
                setVetStats({
                    totalAppointments: 0,
                    pendingAppointments: 0,
                    completedToday: 0,
                    averageRating: 0,
                    totalReviews: 0,
                    loading: false
                });
            }

        } catch (error) {
            console.error('Error in fetchVetData:', error);
            
            // More detailed error handling
            if (error instanceof Error) {
                console.error('Error details:', {
                    message: error.message,
                    name: error.name,
                    stack: error.stack
                });
                
                // Check if it's a network error
                if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
                    console.error('Network fetch error detected - using development fallback');
                    
                    // Use mock data for development when network is unavailable
                    const mockVetProfile = {
                        id: 'mock-vet-id',
                        user_id: user?.id || 'mock-user-id',
                        full_name: userProfile?.full_name || 'Dr. Developer',
                        specialization: 'General Practice',
                        license_number: 'DEV-001',
                        years_experience: 5,
                        consultation_fee: 500,
                        is_available: true,
                        average_rating: 4.5
                    };
                    
                    setVetProfile(mockVetProfile);
                }
            }
            
            setVetStats({
                totalAppointments: 0,
                pendingAppointments: 0,
                completedToday: 0,
                averageRating: 0,
                totalReviews: 0,
                loading: false
            });
            
            // Don't show NOT_FOUND if we had a different error
            if (vetProfile !== 'NOT_FOUND') {
                setVetProfile(null);
            }
        } finally {
            setClinicLoading(false);
        }
    }, [user?.id, vetProfile]);

    // Real-time timer effect
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        console.log('VeterinarianDashboard useEffect triggered:', {
            hasUser: !!user,
            userRole: userProfile?.user_role,
            userName: userProfile?.full_name
        });
        
        if (user && userProfile?.user_role === 'veterinarian') {
            console.log('Calling fetchVetData...');
            fetchVetData();
        } else if (user && userProfile?.user_role !== 'veterinarian') {
            console.warn('User is not a veterinarian:', userProfile?.user_role);
            // Set loading to false even if user is not a veterinarian
            setVetStats(prev => ({ ...prev, loading: false }));
        }
    }, [user, userProfile, fetchVetData]);

    const fetchTabData = async (tab: string) => {
        if (!vetProfile || vetProfile === 'NOT_FOUND') {
            console.warn('No veterinarian profile available for fetching tab data');
            return;
        }

        try {
            switch (tab) {
                case 'appointments':
                    console.log('Fetching appointments for vet ID:', vetProfile.id);
                    
                    const { data: appointmentsData, error: appointmentsError } = await supabase
                        .from('appointments')
                        .select(`
                            id,
                            veterinarian_id,
                            patient_id,
                            pet_owner_id,
                            service_id,
                            clinic_id,
                            appointment_date,
                            appointment_time,
                            status,
                            reason_for_visit,
                            symptoms,
                            notes,
                            is_approved,
                            created_at,
                            updated_at,
                            patients (
                                id,
                                name,
                                species,
                                breed,
                                date_of_birth,
                                weight,
                                medical_conditions
                            ),
                            pet_owner_profiles (
                                id,
                                full_name,
                                phone,
                                address
                            ),
                            services (
                                id,
                                name,
                                description,
                                price,
                                duration_minutes
                            ),
                            clinics (
                                id,
                                name,
                                address,
                                phone
                            )
                        `)
                        .eq('veterinarian_id', vetProfile.id)
                        .order('appointment_date', { ascending: true })
                        .order('appointment_time', { ascending: true });

                    if (appointmentsError) {
                        console.error('Error fetching appointments:', appointmentsError);
                        setAppointments([]);
                        return;
                    }

                    // Filter and validate appointments data
                    const validAppointments = (appointmentsData || []).map(appointment => {
                        // Ensure all required fields have default values
                        return {
                            ...appointment,
                            patients: appointment.patients || {
                                id: null,
                                name: 'Unknown Pet',
                                species: 'Unknown',
                                breed: 'Unknown',
                                date_of_birth: null,
                                weight: null,
                                medical_conditions: []
                            },
                            pet_owner_profiles: appointment.pet_owner_profiles || {
                                id: null,
                                full_name: 'Unknown Owner',
                                phone: 'Not provided',
                                address: 'Not provided'
                            },
                            services: appointment.services || {
                                id: null,
                                name: 'General Consultation',
                                description: '',
                                price: null,
                                duration_minutes: 30
                            },
                            clinics: appointment.clinics || {
                                id: null,
                                name: 'Unknown Clinic',
                                address: 'Not specified',
                                phone: 'Not provided'
                            },
                            reason_for_visit: appointment.reason_for_visit || '',
                            symptoms: appointment.symptoms || '',
                            notes: appointment.notes || ''
                        };
                    });

                    console.log(`Successfully fetched ${validAppointments.length} appointments`);
                    setAppointments(validAppointments);
                    break;

                case 'patients':
                    console.log('Fetching patients for veterinarian:', vetProfile.id);
                    setPatientsLoading(true);
                    try {
                        // Fetch all patients that this veterinarian has had appointments with
                        const { data: patientData, error: patientError } = await supabase
                            .from('appointments')
                            .select(`
                                patients (
                                    id,
                                    name,
                                    species,
                                    breed,
                                    date_of_birth,
                                    weight,
                                    medical_conditions,
                                    created_at,
                                    pet_owner_profiles (
                                        full_name,
                                        phone,
                                        address
                                    )
                                )
                            `)
                            .eq('veterinarian_id', vetProfile.id)
                            .not('patients', 'is', null);
                        
                        if (patientError) {
                            console.error('Error fetching patients:', patientError);
                            setPatients([]);
                            return;
                        }
                        
                        // Extract unique patients from appointments
                        const uniquePatientsMap = new Map();
                        patientData?.forEach(appointment => {
                            if (appointment.patients) {
                                const patient = appointment.patients;
                                uniquePatientsMap.set(patient.id, {
                                    ...patient,
                                    owner: patient.pet_owner_profiles
                                });
                            }
                        });
                        
                        const uniquePatients = Array.from(uniquePatientsMap.values());
                        console.log(`Found ${uniquePatients.length} unique patients`);
                        setPatients(uniquePatients);
                    } catch (error) {
                        console.error('Error fetching patients:', error);
                        setPatients([]);
                    } finally {
                        setPatientsLoading(false);
                    }
                    break;

                case 'reviews':
                    console.log('Reviews data fetching - feature not implemented yet');
                    // TODO: Implement reviews data fetching when needed
                    break;

                default:
                    console.warn(`Unknown tab requested: ${tab}`);
                    break;
            }
        } catch (error) {
            console.error(`Error fetching ${tab} data:`, error);
            
            // Set appropriate empty state for failed data fetches
            if (tab === 'appointments') {
                setAppointments([]);
            }
            
            // Show user-friendly error message
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            console.error(`Failed to load ${tab} data: ${errorMessage}`);
        }
    };

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        if (tab !== 'overview') {
            fetchTabData(tab);
        }
    };

    const handleLocationSelect = (lat: number, lng: number, address?: string) => {
        setClinicData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            address: address || prev.address
        }));
    };

    const handleUpdateClinicLocation = async () => {
        if (!clinicData.latitude || !clinicData.longitude) {
            alert('Please select a location on the map');
            return;
        }

        if (!clinicData.name.trim()) {
            alert('Please enter a clinic name');
            return;
        }

        if (!clinicData.address.trim()) {
            alert('Please enter a clinic address');
            return;
        }

        setIsUpdatingProfile(true);
        try {
            // Check if we're updating existing clinic or creating new one
            if (vetProfile?.clinic_id) {
                // Update existing clinic
                const { error } = await supabase
                    .from('clinics')
                    .update({
                        name: clinicData.name,
                        address: clinicData.address,
                        phone: clinicData.phone,
                        latitude: clinicData.latitude,
                        longitude: clinicData.longitude,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', vetProfile.clinic_id);

                if (error) {
                    throw error;
                }
                
                alert('Clinic information updated successfully!');
            } else {
                // Create new clinic and link to veterinarian
                const { data: newClinic, error: clinicError } = await supabase
                    .from('clinics')
                    .insert({
                        name: clinicData.name,
                        address: clinicData.address,
                        phone: clinicData.phone,
                        latitude: clinicData.latitude,
                        longitude: clinicData.longitude,
                        is_active: true
                    })
                    .select()
                    .single();

                if (clinicError) {
                    throw clinicError;
                }

                // Update veterinarian to link to the new clinic
                const { error: vetUpdateError } = await supabase
                    .from('veterinarians')
                    .update({
                        clinic_id: newClinic.id,
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_id', user?.id);

                if (vetUpdateError) {
                    throw vetUpdateError;
                }

                alert('Clinic created and linked successfully!');
            }

            setShowLocationPicker(false);
            // Refresh vet data to get updated clinic info
            fetchVetData();
        } catch (error) {
            console.error('Error updating clinic:', error);
            alert('Failed to update clinic information. Please try again.');
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            router.push('/login');
        } catch (error) {
            console.error('Error signing out:', error);
            alert('Error signing out. Please try again.');
        }
    };

    // Appointment management functions
    const handleViewAppointment = (appointment: unknown) => {
        setSelectedAppointment(appointment);
        setShowAppointmentModal(true);
    };

    const testAuth = async () => {
        try {
            console.log('=== Testing Authentication ===');
            
            // Test client-side session
            const { data: { session } } = await supabase.auth.getSession();
            console.log('Client session:', session ? 'EXISTS' : 'NULL');
            
            // Test API call
            const response = await fetch('/api/debug/session', {
                credentials: 'include'
            });
            const result = await response.json();
            console.log('Server session test:', result);
            
            alert(`Client: ${session ? 'Logged in' : 'Not logged in'}, Server: ${result.sessionExists ? 'Session found' : 'No session'}`);
        } catch (error) {
            console.error('Auth test error:', error);
            alert('Auth test failed');
        }
    };

    const handleAcceptAppointment = async (appointmentId: number) => {
        setAppointmentLoading(true);
        try {
            console.log('Attempting to confirm appointment:', appointmentId, 'type:', typeof appointmentId);
            
            // Get the session token from client
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('No session found on client');
            }
            
            const response = await fetch('/api/vet/appointments/update-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`, // Pass token explicitly
                },
                credentials: 'include',
                body: JSON.stringify({
                    appointmentId,
                    status: 'confirmed'
                }),
            });

            console.log('Response status:', response.status);
            
            const result = await response.json();
            console.log('Response body:', result);

            if (response.ok && result.success) {
                alert('Appointment confirmed successfully!');
                // Refresh appointments list
                if (activeTab === 'appointments') {
                    fetchTabData('appointments');
                }
                fetchVetData(); // Update stats
            } else {
                console.error('API Error:', result);
                throw new Error(result.error || 'Failed to confirm appointment');
            }
        } catch (error: unknown) {
            console.error('Error confirming appointment:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Failed to confirm appointment: ${errorMessage}. Please try again.`);
        } finally {
            setAppointmentLoading(false);
        }
    };

    const handleDeclineAppointment = (appointment: unknown) => {
        setSelectedAppointment(appointment);
        setShowDeclineModal(true);
        setDeclineReason('');
    };

    const confirmDeclineAppointment = async () => {
        if (!selectedAppointment || !declineReason.trim()) {
            alert('Please provide a reason for declining the appointment.');
            return;
        }

        setAppointmentLoading(true);
        try {
            // Get the session token from client
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('No session found on client');
            }
            
            const response = await fetch('/api/vet/appointments/update-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                credentials: 'include',
                body: JSON.stringify({
                    appointmentId: Number(selectedAppointment.id),
                    status: 'cancelled',
                    declineReason: declineReason.trim()
                }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                alert('Appointment declined successfully.');
                setShowDeclineModal(false);
                setSelectedAppointment(null);
                setDeclineReason('');
                // Refresh appointments list
                if (activeTab === 'appointments') {
                    fetchTabData('appointments');
                }
                fetchVetData(); // Update stats
            } else {
                throw new Error(result.error || 'Failed to decline appointment');
            }
        } catch (error: unknown) {
            console.error('Error declining appointment:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            alert(`Failed to decline appointment: ${errorMessage}. Please try again.`);
        } finally {
            setAppointmentLoading(false);
        }
    };

    const handleCompleteAppointment = async (appointmentId: number) => {
        if (confirm('Mark this appointment as completed?')) {
            setAppointmentLoading(true);
            try {
                const response = await fetch(`/api/appointments/${appointmentId}/status`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        status: 'completed'
                    }),
                });

                const result = await response.json();

                if (response.ok) {
                    alert('Appointment marked as completed!');
                    // Refresh appointments list
                    if (activeTab === 'appointments') {
                        fetchTabData('appointments');
                    }
                    fetchVetData(); // Update stats
                } else {
                    throw new Error(result.error || 'Failed to complete appointment');
                }
            } catch (error) {
                console.error('Error completing appointment:', error);
                alert('Failed to complete appointment. Please try again.');
            } finally {
                setAppointmentLoading(false);
            }
        }
    };

    // Loading Skeleton Component
    const LoadingSkeleton = () => (
        <div className="space-y-8 animate-pulse">
            {/* Welcome Section Skeleton */}
            <div className="bg-slate-200 rounded-2xl h-32"></div>
            
            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <div className="h-4 bg-slate-200 rounded w-3/4 mb-3"></div>
                                <div className="h-8 bg-slate-200 rounded w-1/2 mb-2"></div>
                                <div className="h-3 bg-slate-200 rounded w-full"></div>
                            </div>
                            <div className="w-14 h-14 bg-slate-200 rounded-xl"></div>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Quick Actions Skeleton */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                <div className="h-6 bg-slate-200 rounded w-1/4 mb-8"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-slate-100 p-6 rounded-2xl">
                            <div className="w-12 h-12 bg-slate-200 rounded-xl mb-4"></div>
                            <div className="h-5 bg-slate-200 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-slate-200 rounded w-full mb-4"></div>
                            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    if (vetStats.loading) {
        return (
            <ProtectedRoute requiredRole="veterinarian">
                <DashboardLayout>
                    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
                        <div className="bg-white shadow-sm border-b border-slate-200">
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                <div className="flex items-center justify-between py-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                                                <AcademicCapIcon className="w-5 h-5 text-white animate-pulse" />
                                            </div>
                                            <div>
                                                <h1 className="text-lg font-bold text-slate-900">VetPortal</h1>
                                                <p className="text-xs text-slate-500">Loading...</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse"></div>
                                        <div className="h-4 w-20 bg-slate-200 rounded animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="max-w-7xl mx-auto p-8">
                            <LoadingSkeleton />
                        </div>
                    </div>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    // Show registration prompt if no veterinarian profile found
    if (vetProfile === 'NOT_FOUND') {
        return (
            <ProtectedRoute requiredRole="veterinarian">
                <DashboardLayout>
                    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                        <div className="max-w-2xl w-full bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-10">
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                                        <AcademicCapIcon className="w-12 h-12 text-white" />
                                    </div>
                                    <h1 className="text-3xl font-bold text-white mb-3">
                                        Veterinary Profile Setup
                                    </h1>
                                    <p className="text-blue-100 text-lg">
                                        Complete your professional credentials to access the veterinary dashboard
                                    </p>
                                </div>
                            </div>

                            <div className="px-8 py-8">
                                <div className="space-y-8">
                                    <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-6">
                                        <div className="flex items-start space-x-4">
                                            <div className="bg-blue-500 p-2 rounded-lg">
                                                <UserCircleIcon className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-blue-900 text-lg mb-2">Professional Profile Required</h3>
                                                <p className="text-blue-800 leading-relaxed">
                                                    Your account has been identified as a veterinary professional, but your clinical profile needs to be configured by the system administrator before you can access patient management features.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 rounded-lg p-6">
                                        <h4 className="font-semibold text-slate-900 text-lg mb-4">Account Information</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-white p-4 rounded-lg border border-slate-200">
                                                <span className="text-sm font-medium text-slate-600 block mb-1">Email Address</span>
                                                <span className="text-slate-900 font-medium">{userProfile?.email}</span>
                                            </div>
                                            <div className="bg-white p-4 rounded-lg border border-slate-200">
                                                <span className="text-sm font-medium text-slate-600 block mb-1">Full Name</span>
                                                <span className="text-slate-900 font-medium">{userProfile?.full_name || 'Not specified'}</span>
                                            </div>
                                            <div className="bg-white p-4 rounded-lg border border-slate-200">
                                                <span className="text-sm font-medium text-slate-600 block mb-1">Account Type</span>
                                                <span className="inline-flex px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                                                    {userProfile?.user_role}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white border border-slate-200 rounded-lg p-6">
                                        <h4 className="font-semibold text-slate-900 text-lg mb-4 flex items-center">
                                            <DocumentTextIcon className="w-5 h-5 mr-2 text-blue-600" />
                                            Required Setup Steps
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="flex items-start space-x-3">
                                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <span className="text-blue-600 font-semibold text-sm">1</span>
                                                </div>
                                                <p className="text-slate-700">Submit veterinary license and professional credentials to system administrator</p>
                                            </div>
                                            <div className="flex items-start space-x-3">
                                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <span className="text-blue-600 font-semibold text-sm">2</span>
                                                </div>
                                                <p className="text-slate-700">Provide specialization details and years of experience</p>
                                            </div>
                                            <div className="flex items-start space-x-3">
                                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <span className="text-blue-600 font-semibold text-sm">3</span>
                                                </div>
                                                <p className="text-slate-700">Configure clinic location and contact information</p>
                                            </div>
                                            <div className="flex items-start space-x-3">
                                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    <span className="text-blue-600 font-semibold text-sm">4</span>
                                                </div>
                                                <p className="text-slate-700">Wait for profile activation and verification</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <button
                                            onClick={fetchVetData}
                                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-semibold flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                                        >
                                            <ArrowRightOnRectangleIcon className="w-5 h-5" />
                                            <span>Refresh Status</span>
                                        </button>
                                        <button
                                            onClick={() => router.push('/profile')}
                                            className="flex-1 px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-200 font-semibold"
                                        >
                                            Account Settings
                                        </button>
                                        <button
                                            onClick={handleSignOut}
                                            className="px-6 py-3 bg-slate-100 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-200 transition-all duration-200 font-medium"
                                        >
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute requiredRole="veterinarian">
            <DashboardLayout>
                <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
                    <div className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex items-center justify-between py-4">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                                            <AcademicCapIcon className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h1 className="text-lg font-bold text-slate-900">VetPortal</h1>
                                            <p className="text-xs text-slate-500">Veterinary Management</p>
                                        </div>
                                    </div>
                                    
                                    <div className="hidden md:flex items-center space-x-2 text-sm text-slate-600">
                                        <ClockIcon className="w-4 h-4" />
                                        <span>{currentTime.toLocaleTimeString('en-US', { hour12: false })}</span>
                                    </div>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                                            <span className="text-sm font-bold text-white">
                                                {(vetProfile?.full_name || userProfile?.full_name || 'V').charAt(0)}
                                            </span>
                                        </div>
                                        <div className="hidden sm:block text-left">
                                            <p className="text-sm font-medium text-slate-900">
                                                Dr. {vetProfile?.full_name || userProfile?.full_name}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {vetProfile?.specialization || 'Veterinarian'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-1">
                                        <button
                                            onClick={testAuth}
                                            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                                            title="System Diagnostics"
                                        >
                                            <ChartBarIcon className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={handleSignOut}
                                            className="p-2 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                                            title="Sign Out"
                                        >
                                            <ArrowRightOnRectangleIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-7xl mx-auto">
                        <div className="p-8">
                            <div className="lg:hidden bg-white rounded-xl shadow-sm border border-slate-200 mb-8">
                                <div className="border-b border-slate-200">
                                    <nav className="-mb-px flex overflow-x-auto scrollbar-hide">
                                        {[
                                            { id: 'overview', name: 'Overview', icon: ChartBarIcon },
                                            { id: 'appointments', name: 'Appointments', icon: CalendarDaysIcon },
                                            { id: 'patients', name: 'Patients', icon: ClipboardDocumentListIcon },
                                            { id: 'profile', name: 'Profile', icon: UserCircleIcon },
                                            { id: 'reviews', name: 'Reviews', icon: StarIcon }
                                        ].map((tab) => (
                                            <button
                                                key={tab.id}
                                                onClick={() => handleTabChange(tab.id)}
                                                className={`group inline-flex items-center py-4 px-4 border-b-3 font-semibold text-sm whitespace-nowrap transition-all duration-200 ${activeTab === tab.id
                                                        ? 'border-blue-600 text-blue-700 bg-blue-50'
                                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <tab.icon className="w-4 h-4 mr-2" />
                                                <span>{tab.name}</span>
                                            </button>
                                        ))}
                                    </nav>
                                </div>
                            </div>

                            {activeTab === 'overview' && (
                                <div className="space-y-8">
                                    {/* Welcome Section */}
                                    <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
                                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSI0Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
                                        <div className="relative z-10">
                                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                                                <div className="flex-1">
                                                    <h2 className="text-xl md:text-2xl font-bold mb-2">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, Dr. {vetProfile?.full_name || userProfile?.full_name || 'Doctor'}</h2>
                                                    <p className="text-blue-100 text-base md:text-lg mb-4 lg:mb-0">Ready to provide excellent care today?</p>
                                                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-4">
                                                        <div className="flex items-center space-x-2 text-blue-100">
                                                            <ClockIcon className="w-4 h-4" />
                                                            <span className="text-sm">{currentTime.toLocaleString('en-US', { 
                                                                weekday: 'long',
                                                                year: 'numeric', 
                                                                month: 'long', 
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-2 text-blue-100">
                                                            <HeartIcon className="w-4 h-4" />
                                                            <span className="text-sm">{vetProfile?.specialization || 'General Practice'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="hidden lg:flex items-center space-x-4">
                                                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                                        <AcademicCapIcon className="w-10 h-10 text-white" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Enhanced Statistics Cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <div className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 cursor-pointer">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                                        <p className="text-sm font-medium text-slate-600">Total Appointments</p>
                                                    </div>
                                                    <p className="text-3xl font-bold text-slate-900 mb-1">{vetStats.totalAppointments}</p>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">All time</span>
                                                        <span className="text-xs text-slate-500">+12% vs last month</span>
                                                    </div>
                                                </div>
                                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                    <CalendarDaysIcon className="w-7 h-7 text-white" />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-xl hover:border-orange-300 transition-all duration-300 cursor-pointer">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                                        <p className="text-sm font-medium text-slate-600">Pending Reviews</p>
                                                    </div>
                                                    <p className="text-3xl font-bold text-slate-900 mb-1">{vetStats.pendingAppointments}</p>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full font-medium">Needs attention</span>
                                                        {vetStats.pendingAppointments > 0 && <span className="text-xs text-slate-500">Review now</span>}
                                                    </div>
                                                </div>
                                                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                    <ClockIcon className="w-7 h-7 text-white" />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-xl hover:border-green-300 transition-all duration-300 cursor-pointer">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                        <p className="text-sm font-medium text-slate-600">Completed Today</p>
                                                    </div>
                                                    <p className="text-3xl font-bold text-slate-900 mb-1">{vetStats.completedToday}</p>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">Consultations</span>
                                                        <span className="text-xs text-slate-500">Great progress!</span>
                                                    </div>
                                                </div>
                                                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                    <CheckCircleIcon className="w-7 h-7 text-white" />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-xl hover:border-yellow-300 transition-all duration-300 cursor-pointer">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                                                        <p className="text-sm font-medium text-slate-600">Patient Rating</p>
                                                    </div>
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <p className="text-3xl font-bold text-slate-900">{vetStats.averageRating.toFixed(1)}</p>
                                                        <div className="flex items-center">
                                                            {[...Array(5)].map((_, i) => (
                                                                <StarIcon key={i} className={`w-4 h-4 ${i < Math.floor(vetStats.averageRating) ? 'text-yellow-400 fill-current' : 'text-slate-300'}`} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full font-medium">{vetStats.totalReviews} reviews</span>
                                                        <span className="text-xs text-slate-500">Excellent!</span>
                                                    </div>
                                                </div>
                                                <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                    <StarIcon className="w-7 h-7 text-white" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Actions Grid */}
                                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                                        <div className="flex items-center justify-between mb-8">
                                            <div>
                                                <h3 className="text-2xl font-bold text-slate-900">Quick Actions</h3>
                                                <p className="text-slate-600 mt-1">Access your most important tools</p>
                                            </div>
                                            <div className="hidden sm:flex items-center space-x-2 text-sm text-slate-500">
                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                <span>All systems operational</span>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                            <button
                                                onClick={() => handleTabChange('appointments')}
                                                className="group relative bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 p-6 rounded-2xl border-2 border-blue-200 hover:border-blue-300 transition-all duration-300 text-left overflow-hidden focus:outline-none focus:ring-4 focus:ring-blue-200 focus:ring-opacity-50"
                                                aria-label="Navigate to appointment management"
                                                tabIndex={0}
                                            >
                                                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full -translate-y-4 translate-x-4"></div>
                                                <div className="relative z-10">
                                                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                                        <CalendarDaysIcon className="w-6 h-6 text-white" />
                                                    </div>
                                                    <h4 className="font-bold text-slate-900 mb-2">Appointments</h4>
                                                    <p className="text-sm text-slate-600 leading-relaxed">Manage patient appointments and schedule</p>
                                                    <div className="mt-4 flex items-center text-blue-600">
                                                        <span className="text-sm font-medium">Manage</span>
                                                        <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </button>
                                            
                                            <button
                                                onClick={() => handleTabChange('patients')}
                                                className="group relative bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 p-6 rounded-2xl border-2 border-emerald-200 hover:border-emerald-300 transition-all duration-300 text-left overflow-hidden focus:outline-none focus:ring-4 focus:ring-emerald-200 focus:ring-opacity-50"
                                                aria-label="Navigate to patient records"
                                                tabIndex={0}
                                            >
                                                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full -translate-y-4 translate-x-4"></div>
                                                <div className="relative z-10">
                                                    <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                                        <ClipboardDocumentListIcon className="w-6 h-6 text-white" />
                                                    </div>
                                                    <h4 className="font-bold text-slate-900 mb-2">Patient Records</h4>
                                                    <p className="text-sm text-slate-600 leading-relaxed">Access comprehensive medical records</p>
                                                    <div className="mt-4 flex items-center text-emerald-600">
                                                        <span className="text-sm font-medium">View</span>
                                                        <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </button>
                                            
                                            <button
                                                onClick={() => handleTabChange('profile')}
                                                className="group relative bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 p-6 rounded-2xl border-2 border-purple-200 hover:border-purple-300 transition-all duration-300 text-left overflow-hidden focus:outline-none focus:ring-4 focus:ring-purple-200 focus:ring-opacity-50"
                                                aria-label="Navigate to professional profile"
                                                tabIndex={0}
                                            >
                                                <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full -translate-y-4 translate-x-4"></div>
                                                <div className="relative z-10">
                                                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                                        <UserCircleIcon className="w-6 h-6 text-white" />
                                                    </div>
                                                    <h4 className="font-bold text-slate-900 mb-2">Profile</h4>
                                                    <p className="text-sm text-slate-600 leading-relaxed">Update professional credentials</p>
                                                    <div className="mt-4 flex items-center text-purple-600">
                                                        <span className="text-sm font-medium">Edit</span>
                                                        <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </button>
                                            
                                            <button
                                                onClick={() => handleTabChange('reviews')}
                                                className="group relative bg-gradient-to-br from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 p-6 rounded-2xl border-2 border-amber-200 hover:border-amber-300 transition-all duration-300 text-left overflow-hidden focus:outline-none focus:ring-4 focus:ring-amber-200 focus:ring-opacity-50"
                                                aria-label="Navigate to patient reviews"
                                                tabIndex={0}
                                            >
                                                <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full -translate-y-4 translate-x-4"></div>
                                                <div className="relative z-10">
                                                    <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                                        <StarIcon className="w-6 h-6 text-white" />
                                                    </div>
                                                    <h4 className="font-bold text-slate-900 mb-2">Reviews</h4>
                                                    <p className="text-sm text-slate-600 leading-relaxed">View patient feedback and ratings</p>
                                                    <div className="mt-4 flex items-center text-amber-600">
                                                        <span className="text-sm font-medium">Review</span>
                                                        <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Today's Schedule & Performance */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        {/* Today's Schedule */}
                                        <div className="lg:col-span-2 bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                                            <div className="flex items-center justify-between mb-6">
                                                <div>
                                                    <h3 className="text-xl font-bold text-slate-900">Today's Schedule</h3>
                                                    <p className="text-slate-600 text-sm mt-1">Your upcoming appointments</p>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm text-slate-500">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-4">
                                                {/* Mock appointments for demo */}
                                                <div className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                                                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mr-4">
                                                        <ClockIcon className="w-6 h-6 text-white" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <h4 className="font-semibold text-slate-900">Next Appointment</h4>
                                                            <span className="text-sm font-medium text-blue-600">In 30 mins</span>
                                                        </div>
                                                        <p className="text-sm text-slate-600">Routine checkup scheduled</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="text-center py-8">
                                                    <CalendarDaysIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                                                    <p className="text-slate-500 font-medium">No more appointments today</p>
                                                    <p className="text-sm text-slate-400 mt-1">Enjoy your free time!</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Performance Insights */}
                                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                                            <div className="flex items-center justify-between mb-6">
                                                <div>
                                                    <h3 className="text-xl font-bold text-slate-900">Performance Insights</h3>
                                                    <p className="text-slate-600 text-sm mt-1">Your daily achievements</p>
                                                </div>
                                                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                                                    <ChartBarIcon className="w-4 h-4 text-white" />
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-6">
                                                <div className="relative">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                                                                <CheckCircleIcon className="w-5 h-5 text-white" />
                                                            </div>
                                                            <div>
                                                                <span className="font-bold text-slate-900">Consultations</span>
                                                                <p className="text-xs text-slate-500">Completed today</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-2xl font-bold text-green-600">{vetStats.completedToday}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-1000" style={{ width: '75%' }}></div>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-2">75% of daily goal (8 consultations)</p>
                                                </div>
                                                
                                                <div className="relative">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                                                                <ClockIcon className="w-5 h-5 text-white" />
                                                            </div>
                                                            <div>
                                                                <span className="font-bold text-slate-900">Pending</span>
                                                                <p className="text-xs text-slate-500">Needs attention</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-2xl font-bold text-orange-600">{vetStats.pendingAppointments}</span>
                                                    </div>
                                                    {vetStats.pendingAppointments > 0 && (
                                                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                                            <p className="text-xs text-orange-700 font-medium">Review pending appointments to improve response time</p>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div className="relative">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center">
                                                                <StarIcon className="w-5 h-5 text-white" />
                                                            </div>
                                                            <div>
                                                                <span className="font-bold text-slate-900">Rating</span>
                                                                <p className="text-xs text-slate-500">Patient satisfaction</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-2xl font-bold text-yellow-600">{vetStats.averageRating.toFixed(1)}</span>
                                                            <div className="flex items-center justify-end mt-1">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <StarIcon key={i} className={`w-3 h-3 ${i < Math.floor(vetStats.averageRating) ? 'text-yellow-400 fill-current' : 'text-slate-300'}`} />
                                                                ))}
                                                            </div>
                                                            <p className="text-xs text-slate-500 mt-1">{vetStats.totalReviews} reviews</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Quick stats summary */}
                                                <div className="border-t pt-4 mt-6">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="text-center">
                                                            <p className="text-2xl font-bold text-blue-600">{new Date().getHours() - 8}</p>
                                                            <p className="text-xs text-slate-500">Hours worked</p>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-2xl font-bold text-green-600">94%</p>
                                                            <p className="text-xs text-slate-500">Success rate</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'appointments' && (
                                <div className="text-center py-12">
                                    <p className="text-slate-600">Appointments management functionality would be here...</p>
                                </div>
                            )}

                            {activeTab === 'patients' && (
                                <div className="text-center py-12">
                                    <p className="text-slate-600">Patient records management functionality would be here...</p>
                                </div>
                            )}

                            {activeTab === 'profile' && (
                                <div className="text-center py-12">
                                    <p className="text-slate-600">Profile management functionality would be here...</p>
                                </div>
                            )}

                            {activeTab === 'reviews' && (
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                                    <div className="text-center py-12">
                                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <StarIcon className="w-10 h-10 text-blue-600" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-slate-900 mb-4">Patient Reviews & Feedback</h3>
                                        <p className="text-slate-600 max-w-md mx-auto mb-6">
                                            Monitor patient satisfaction, review feedback, and track your professional reputation. View detailed analytics on service quality and patient experience.
                                        </p>
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-sm mx-auto">
                                            <p className="text-blue-800 font-medium text-sm">Feature Coming Soon</p>
                                            <p className="text-blue-700 text-xs mt-1">Review management system in development</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}