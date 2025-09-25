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
        if (!user?.id) {
            console.log('No user ID available for veterinarian data fetch');
            setVetStats(prev => ({ ...prev, loading: false }));
            return;
        }

        try {
            setClinicLoading(true);
            console.log('Fetching veterinarian data for user:', user.id);
            
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
                    console.log('No veterinarian profile found for user. User may need to register as a veterinarian.');
                    setVetStats(prev => ({ ...prev, loading: false }));
                    setVetProfile('NOT_FOUND');
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
            setVetStats(prev => ({ ...prev, loading: false }));
            // Don't show NOT_FOUND if we had a different error
            if (vetProfile !== 'NOT_FOUND') {
                setVetProfile(null);
            }
        } finally {
            setClinicLoading(false);
        }
    }, [user?.id]);

    // Real-time timer effect
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (user && userProfile?.user_role === 'veterinarian') {
            fetchVetData();
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

    const StatCard = ({ title, value, icon: Icon, color, subtitle }: {
        title: string;
        value: number;
        icon: React.ElementType;
        color: string;
        subtitle?: string;
    }) => (
        <div className="bg-stone-50 rounded-xl shadow-sm border border-stone-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
                <div className={`p-3 rounded-xl ${color}`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-stone-600 truncate">{title}</p>
                    <p className="text-lg sm:text-2xl font-bold text-stone-900">{value}</p>
                    {subtitle && <p className="text-xs text-stone-500">{subtitle}</p>}
                </div>
            </div>
        </div>
    );

    if (vetStats.loading) {
        return (
            <ProtectedRoute requiredRole="veterinarian">
                <DashboardLayout>
                    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-8 mx-auto">
                                <AcademicCapIcon className="w-10 h-10 text-white animate-pulse" />
                            </div>
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                            <h2 className="text-xl font-semibold text-slate-900 mb-2">Veterinary Management System</h2>
                            <p className="text-slate-600">Initializing professional dashboard...</p>
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
                            {/* Header */}
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

                            {/* Content */}
                            <div className="px-8 py-8">
                                <div className="space-y-8">
                                    {/* Status Alert */}
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

                                    {/* Account Information */}
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

                                    {/* Setup Requirements */}
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

                                    {/* Action Buttons */}
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
                {/* Simplified Header */}
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
                                
                                {/* Current time */}
                                <div className="hidden md:flex items-center space-x-2 text-sm text-slate-600">
                                    <ClockIcon className="w-4 h-4" />
                                    <span>{currentTime.toLocaleTimeString('en-US', { hour12: false })}</span>
                                </div>
                            </div>
                            
                            {/* User Profile & Actions */}
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

                {/* Portal Navigation & Content Layout */}
                <div className="flex">
                    {/* Sidebar Navigation */}
                    <div className="hidden lg:block w-80 bg-white shadow-lg border-r border-slate-200 min-h-screen">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-6">Portal Navigation</h3>
                            <nav className="space-y-2">
                                {[
                                    { id: 'overview', name: 'Dashboard Overview', icon: ChartBarIcon, desc: 'View performance metrics' },
                                    { id: 'appointments', name: 'Appointment Management', icon: CalendarDaysIcon, desc: 'Manage patient appointments' },
                                    { id: 'patients', name: 'Patient Records', icon: ClipboardDocumentListIcon, desc: 'Access medical records' },
                                    { id: 'profile', name: 'Professional Profile', icon: UserCircleIcon, desc: 'Update your credentials' },
                                    { id: 'reviews', name: 'Patient Reviews', icon: StarIcon, desc: 'View patient feedback' }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => handleTabChange(tab.id)}
                                        className={`group w-full text-left p-4 rounded-lg transition-all duration-200 border ${
                                            activeTab === tab.id
                                                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm'
                                                : 'border-transparent hover:bg-slate-50 hover:border-slate-200'
                                        }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className={`p-2 rounded-lg transition-colors ${
                                                activeTab === tab.id
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                                            }`}>
                                                <tab.icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-semibold text-sm truncate ${
                                                    activeTab === tab.id ? 'text-blue-700' : 'text-slate-900 group-hover:text-slate-900'
                                                }`}>
                                                    {tab.name}
                                                </p>
                                                <p className={`text-xs truncate mt-0.5 ${
                                                    activeTab === tab.id ? 'text-blue-600' : 'text-slate-500'
                                                }`}>
                                                    {tab.desc}
                                                </p>
                                            </div>
                                            {activeTab === tab.id && (
                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </nav>
                            
                            {/* Portal Quick Actions */}
                            <div className="mt-8 p-4 bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg border border-slate-200">
                                <h4 className="font-semibold text-slate-900 text-sm mb-3">Quick Actions</h4>
                                <div className="space-y-2">
                                    <button className="w-full flex items-center space-x-3 px-3 py-2 text-xs text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors">
                                        <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                                            <PresentationChartBarIcon className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <span>View Analytics</span>
                                    </button>
                                    <button className="w-full flex items-center space-x-3 px-3 py-2 text-xs text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors">
                                        <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                                            <ChatBubbleBottomCenterTextIcon className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <span>Send Messages</span>
                                    </button>
                                    <button className="w-full flex items-center space-x-3 px-3 py-2 text-xs text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors">
                                        <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                                            <DocumentTextIcon className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <span>Generate Reports</span>
                                    </button>
                                    <button 
                                        onClick={testAuth}
                                        className="w-full flex items-center space-x-3 px-3 py-2 text-xs text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                                    >
                                        <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
                                            <WrenchScrewdriverIcon className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <span>System Diagnostics</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 min-h-screen">
                        <div className="p-8">
                            {/* Mobile Navigation Tabs */}
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

                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-8">
                                {/* Professional Stats Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-slate-600 mb-1">Total Appointments</p>
                                                <p className="text-3xl font-bold text-blue-600">{vetStats.totalAppointments}</p>
                                                <p className="text-xs text-slate-500 mt-1">All time</p>
                                            </div>
                                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <CalendarDaysIcon className="w-6 h-6 text-blue-600" />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-slate-600 mb-1">Pending Reviews</p>
                                                <p className="text-3xl font-bold text-blue-700">{vetStats.pendingAppointments}</p>
                                                <p className="text-xs text-slate-500 mt-1">Awaiting approval</p>
                                            </div>
                                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <ClockIcon className="w-6 h-6 text-blue-700" />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-slate-600 mb-1">Completed Today</p>
                                                <p className="text-3xl font-bold text-blue-800">{vetStats.completedToday}</p>
                                                <p className="text-xs text-slate-500 mt-1">Consultations</p>
                                            </div>
                                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <CheckCircleIcon className="w-6 h-6 text-blue-800" />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-slate-600 mb-1">Patient Rating</p>
                                                <p className="text-3xl font-bold text-blue-600">{vetStats.averageRating.toFixed(1)}</p>
                                                <p className="text-xs text-slate-500 mt-1">{vetStats.totalReviews} reviews</p>
                                            </div>
                                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <StarIcon className="w-6 h-6 text-blue-600" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Professional Dashboard Sections */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Quick Actions Panel */}
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                                        <h3 className="text-xl font-bold text-slate-900 mb-6">Clinical Operations</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => handleTabChange('appointments')}
                                                className="group p-6 bg-blue-50 hover:bg-blue-100 rounded-xl border-2 border-blue-200 hover:border-blue-300 transition-all duration-200"
                                            >
                                                <CalendarDaysIcon className="w-8 h-8 text-blue-600 mb-3 mx-auto group-hover:scale-110 transition-transform" />
                                                <p className="text-sm font-semibold text-blue-800">Appointment</p>
                                                <p className="text-sm font-semibold text-blue-800">Management</p>
                                            </button>
                                            <button
                                                onClick={() => handleTabChange('patients')}
                                                className="group p-6 bg-blue-50 hover:bg-blue-100 rounded-xl border-2 border-blue-200 hover:border-blue-300 transition-all duration-200"
                                            >
                                                <ClipboardDocumentListIcon className="w-8 h-8 text-blue-700 mb-3 mx-auto group-hover:scale-110 transition-transform" />
                                                <p className="text-sm font-semibold text-blue-800">Patient</p>
                                                <p className="text-sm font-semibold text-blue-800">Records</p>
                                            </button>
                                            <button
                                                onClick={() => handleTabChange('profile')}
                                                className="group p-6 bg-blue-50 hover:bg-blue-100 rounded-xl border-2 border-blue-200 hover:border-blue-300 transition-all duration-200"
                                            >
                                                <UserCircleIcon className="w-8 h-8 text-blue-800 mb-3 mx-auto group-hover:scale-110 transition-transform" />
                                                <p className="text-sm font-semibold text-blue-800">Professional</p>
                                                <p className="text-sm font-semibold text-blue-800">Profile</p>
                                            </button>
                                            <button
                                                onClick={() => handleTabChange('reviews')}
                                                className="group p-6 bg-blue-50 hover:bg-blue-100 rounded-xl border-2 border-blue-200 hover:border-blue-300 transition-all duration-200"
                                            >
                                                <StarIcon className="w-8 h-8 text-blue-600 mb-3 mx-auto group-hover:scale-110 transition-transform" />
                                                <p className="text-sm font-semibold text-blue-800">Patient</p>
                                                <p className="text-sm font-semibold text-blue-800">Reviews</p>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Daily Performance Summary */}
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                                        <h3 className="text-xl font-bold text-slate-900 mb-6">Daily Performance</h3>
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                                        <CheckCircleIcon className="w-6 h-6 text-white" />
                                                    </div>
                                                    <span className="font-semibold text-blue-800">Consultations Completed</span>
                                                </div>
                                                <span className="text-2xl font-bold text-blue-700">{vetStats.completedToday}</span>
                                            </div>
                                            
                                            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                                        <ClockIcon className="w-6 h-6 text-white" />
                                                    </div>
                                                    <span className="font-semibold text-blue-800">Pending Approvals</span>
                                                </div>
                                                <span className="text-2xl font-bold text-blue-700">{vetStats.pendingAppointments}</span>
                                            </div>
                                            
                                            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                                        <StarIcon className="w-6 h-6 text-white" />
                                                    </div>
                                                    <span className="font-semibold text-blue-800">Patient Satisfaction</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-2xl font-bold text-blue-700">{vetStats.averageRating.toFixed(1)}</span>
                                                    <p className="text-sm text-blue-600">{vetStats.totalReviews} reviews</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Appointments Tab */}
                        {activeTab === 'appointments' && (
                            <div className="space-y-8">
                                {/* Appointments Header */}
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div>
                                            <h3 className="text-2xl font-bold text-slate-900 flex items-center">
                                                <CalendarDaysIcon className="w-7 h-7 text-blue-600 mr-3" />
                                                Appointment Management
                                            </h3>
                                            <p className="text-slate-600 mt-2">
                                                Comprehensive patient appointment scheduling and management system
                                            </p>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2">
                                            <div className="text-sm text-slate-600">
                                                Total Appointments: <span className="font-bold text-slate-900 text-lg">{appointments.length}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Appointment Status Summary */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-3xl font-bold text-blue-600 mb-1">
                                                    {appointments.filter(apt => apt.status === 'pending').length}
                                                </p>
                                                <p className="text-sm font-medium text-slate-600">Pending Review</p>
                                            </div>
                                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <ClockIcon className="w-6 h-6 text-blue-600" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-3xl font-bold text-blue-700 mb-1">
                                                    {appointments.filter(apt => apt.status === 'confirmed').length}
                                                </p>
                                                <p className="text-sm font-medium text-slate-600">Confirmed</p>
                                            </div>
                                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <CheckCircleIcon className="w-6 h-6 text-blue-700" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-3xl font-bold text-blue-800 mb-1">
                                                    {appointments.filter(apt => apt.status === 'completed').length}
                                                </p>
                                                <p className="text-sm font-medium text-slate-600">Completed</p>
                                            </div>
                                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <DocumentTextIcon className="w-6 h-6 text-blue-800" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-3xl font-bold text-slate-600 mb-1">
                                                    {appointments.filter(apt => apt.status === 'cancelled').length}
                                                </p>
                                                <p className="text-sm font-medium text-slate-600">Cancelled</p>
                                            </div>
                                            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                                                <XCircleIcon className="w-6 h-6 text-slate-600" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Appointments List */}
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                    <div className="px-8 py-6 border-b border-slate-200 bg-slate-50">
                                        <h4 className="text-xl font-bold text-slate-900">Patient Appointments</h4>
                                        <p className="text-slate-600 text-sm mt-1">Manage and track all patient appointments</p>
                                    </div>

                                    {appointments.length === 0 ? (
                                        <div className="p-12 text-center">
                                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <CalendarDaysIcon className="w-10 h-10 text-slate-400" />
                                            </div>
                                            <h4 className="text-xl font-semibold text-slate-900 mb-2">No Appointments Scheduled</h4>
                                            <p className="text-slate-600 max-w-md mx-auto">
                                                Your appointment schedule is currently empty. New patient appointments will appear here once they are booked.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Mobile Cards */}
                                            <div className="md:hidden">
                                                {appointments.map((appointment) => (
                                                    <div key={appointment.id} className="p-4 border-b border-stone-200 last:border-b-0">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex-1">
                                                                <div className="flex items-center space-x-2 mb-2">
                                                                    <h4 className="font-medium text-stone-900">
                                                                        {appointment.patients?.name}
                                                                    </h4>
                                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                        appointment.status === 'completed'
                                                                            ? 'bg-emerald-100 text-emerald-800'
                                                                            : appointment.status === 'confirmed'
                                                                                ? 'bg-teal-100 text-teal-800'
                                                                                : appointment.status === 'pending'
                                                                                    ? 'bg-amber-100 text-amber-800'
                                                                                    : appointment.status === 'cancelled'
                                                                                        ? 'bg-red-100 text-red-800'
                                                                                        : 'bg-stone-100 text-stone-800'
                                                                    }`}>
                                                                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-stone-600">
                                                                    <span className="font-medium">Owner:</span> {appointment.pet_owner_profiles?.full_name}
                                                                </p>
                                                                <p className="text-sm text-stone-600">
                                                                    <span className="font-medium">Pet:</span> {appointment.patients?.species}, {appointment.patients?.breed}
                                                                </p>
                                                                <p className="text-sm text-stone-600">
                                                                    <span className="font-medium">Date:</span> {new Date(appointment.appointment_date).toLocaleDateString()} at {appointment.appointment_time}
                                                                </p>
                                                                <p className="text-sm text-stone-600">
                                                                    <span className="font-medium">Service:</span> {appointment.services?.name || 'General Consultation'}
                                                                </p>
                                                                {appointment.reason_for_visit && (
                                                                    <p className="text-sm text-stone-600 mt-1">
                                                                        <span className="font-medium">Reason:</span> {appointment.reason_for_visit}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex space-x-2 mt-3">
                                            <button 
                                                onClick={() => handleViewAppointment(appointment)}
                                                className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors flex items-center justify-center space-x-1"
                                            >
                                                <EyeIcon className="w-4 h-4" />
                                                <span>Review</span>
                                            </button>
                                            {appointment.status === 'pending' && (
                                                <>
                                                    <button 
                                                        onClick={() => handleAcceptAppointment(Number(appointment.id))}
                                                        disabled={appointmentLoading}
                                                        className="flex-1 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-100 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                                                    >
                                                        <CheckCircleIcon className="w-4 h-4" />
                                                        <span>Approve</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeclineAppointment(appointment)}
                                                        disabled={appointmentLoading}
                                                        className="flex-1 bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                                                    >
                                                        <XCircleIcon className="w-4 h-4" />
                                                        <span>Decline</span>
                                                    </button>
                                                </>
                                            )}
                                            {appointment.status === 'confirmed' && (
                                                <button 
                                                    onClick={() => handleCompleteAppointment(Number(appointment.id))}
                                                    disabled={appointmentLoading}
                                                    className="flex-1 bg-slate-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                                                >
                                                    <DocumentTextIcon className="w-4 h-4" />
                                                    <span>Complete</span>
                                                </button>
                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Desktop Table */}
                                            <div className="hidden md:block overflow-x-auto">
                                                <table className="min-w-full divide-y divide-stone-200">
                                                    <thead className="bg-stone-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                                                Patient & Owner
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                                                Date & Time
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                                                Service & Reason
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                                                Status
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                                                                Actions
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-stone-200">
                                                        {appointments.map((appointment) => (
                                                            <tr key={appointment.id} className="hover:bg-stone-50">
                                                                <td className="px-6 py-4 text-sm text-stone-900">
                                                                    <div>
                                                                        <div className="font-medium text-stone-900">{appointment.patients?.name}</div>
                                                                        <div className="text-stone-500">{appointment.patients?.species}, {appointment.patients?.breed}</div>
                                                                        <div className="text-stone-600 mt-1">Owner: {appointment.pet_owner_profiles?.full_name}</div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-stone-900">
                                                                    <div>
                                                                        <div className="font-medium">{new Date(appointment.appointment_date).toLocaleDateString()}</div>
                                                                        <div className="text-stone-500">{appointment.appointment_time}</div>
                                                                        <div className="text-xs text-stone-400">
                                                                            {appointment.services?.duration_minutes}min
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-stone-900">
                                                                    <div>
                                                                        <div className="font-medium">{appointment.services?.name || 'General Consultation'}</div>
                                                                        {appointment.reason_for_visit && (
                                                                            <div className="text-stone-500 text-xs mt-1">
                                                                                {appointment.reason_for_visit.length > 50 
                                                                                    ? `${appointment.reason_for_visit.substring(0, 50)}...`
                                                                                    : appointment.reason_for_visit
                                                                                }
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                        appointment.status === 'completed'
                                                                            ? 'bg-emerald-100 text-emerald-800'
                                                                            : appointment.status === 'confirmed'
                                                                                ? 'bg-teal-100 text-teal-800'
                                                                                : appointment.status === 'pending'
                                                                                    ? 'bg-amber-100 text-amber-800'
                                                                                    : appointment.status === 'cancelled'
                                                                                        ? 'bg-red-100 text-red-800'
                                                                                        : 'bg-stone-100 text-stone-800'
                                                                    }`}>
                                                                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                                    <div className="flex space-x-2">
                                                                        <button 
                                                                            onClick={() => handleViewAppointment(appointment)}
                                                                            className="text-teal-600 hover:text-teal-900"
                                                                            title="View Details"
                                                                        >
                                                                            <EyeIcon className="w-4 h-4" />
                                                                        </button>
                                                                        {appointment.status === 'pending' && (
                                                                            <>
                                                                                <button 
                                                                                    onClick={() => handleAcceptAppointment(Number(appointment.id))}
                                                                                    disabled={appointmentLoading}
                                                                                    className="text-emerald-600 hover:text-emerald-900 disabled:opacity-50"
                                                                                    title="Accept Appointment"
                                                                                >
                                                                                    <CheckCircleIcon className="w-4 h-4" />
                                                                                </button>
                                                                                <button 
                                                                                    onClick={() => handleDeclineAppointment(appointment)}
                                                                                    disabled={appointmentLoading}
                                                                                    className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                                                                    title="Decline Appointment"
                                                                                >
                                                                                    <XCircleIcon className="w-4 h-4" />
                                                                                </button>
                                                                            </>
                                                                        )}
                                                                        {appointment.status === 'confirmed' && (
                                                                            <button 
                                                                                onClick={() => handleCompleteAppointment(Number(appointment.id))}
                                                                                disabled={appointmentLoading}
                                                                                className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                                                                                title="Mark as Completed"
                                                                            >
                                                                                <DocumentTextIcon className="w-4 h-4" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Patient Records Tab */}
                        {activeTab === 'patients' && (
                            <div className="space-y-6">
                                {!selectedPatientId ? (
                                    <>
                                        {/* Patient Selection Header */}
                                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                <div>
                                                    <h3 className="text-2xl font-bold text-slate-900 flex items-center">
                                                        <ClipboardDocumentListIcon className="w-7 h-7 text-blue-600 mr-3" />
                                                        Patient Medical Records
                                                    </h3>
                                                    <p className="text-slate-600 mt-2">
                                                        Access comprehensive medical records for all your patients
                                                    </p>
                                                </div>
                                                <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2">
                                                    <div className="text-sm text-slate-600">
                                                        Total Patients: <span className="font-bold text-slate-900 text-lg">{patients.length}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Search Bar */}
                                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    placeholder="Search patients by name, species, or owner..."
                                                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                />
                                                <ClipboardDocumentListIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            </div>
                                        </div>

                                        {/* Patient List */}
                                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                                                <h4 className="text-lg font-semibold text-slate-900">Your Patients</h4>
                                                <p className="text-slate-600 text-sm mt-1">Select a patient to view their complete medical records</p>
                                            </div>

                                            {patientsLoading ? (
                                                <div className="p-8 text-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
                                                    <p className="text-slate-600">Loading patients...</p>
                                                </div>
                                            ) : patients.length === 0 ? (
                                                <div className="p-12 text-center">
                                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                                        <HeartIcon className="w-8 h-8 text-slate-400" />
                                                    </div>
                                                    <h4 className="text-lg font-semibold text-slate-900 mb-2">No Patients Found</h4>
                                                    <p className="text-slate-600 max-w-md mx-auto">
                                                        You haven't seen any patients yet. Patients you've had appointments with will appear here.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-slate-200">
                                                    {patients
                                                        .filter(patient => 
                                                            !searchTerm || 
                                                            patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                            patient.species?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                            patient.owner?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
                                                        )
                                                        .map((patient) => (
                                                            <div
                                                                key={patient.id}
                                                                onClick={() => setSelectedPatientId(patient.id.toString())}
                                                                className="p-6 hover:bg-slate-50 cursor-pointer transition-colors group"
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center space-x-4">
                                                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                                                                            <HeartIcon className="w-6 h-6 text-blue-600" />
                                                                        </div>
                                                                        <div>
                                                                            <h5 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                                                {patient.name}
                                                                            </h5>
                                                                            <p className="text-sm text-slate-600">
                                                                                {patient.species} • {patient.breed || 'Mixed breed'}
                                                                            </p>
                                                                            <p className="text-sm text-slate-500">
                                                                                Owner: {patient.owner?.full_name || 'Unknown'}
                                                                            </p>
                                                                            {patient.medical_conditions && patient.medical_conditions.length > 0 && (
                                                                                <div className="flex flex-wrap gap-1 mt-2">
                                                                                    {patient.medical_conditions.slice(0, 2).map((condition, idx) => (
                                                                                        <span
                                                                                            key={idx}
                                                                                            className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full"
                                                                                        >
                                                                                            {condition}
                                                                                        </span>
                                                                                    ))}
                                                                                    {patient.medical_conditions.length > 2 && (
                                                                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                                                            +{patient.medical_conditions.length - 2} more
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center space-x-3">
                                                                        {patient.weight && (
                                                                            <div className="text-right">
                                                                                <p className="text-sm font-medium text-slate-600">Weight</p>
                                                                                <p className="text-lg font-bold text-slate-900">{patient.weight} kg</p>
                                                                            </div>
                                                                        )}
                                                                        <EyeIcon className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Back to Patient List Button */}
                                        <div className="mb-6">
                                            <button
                                                onClick={() => setSelectedPatientId(null)}
                                                className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                </svg>
                                                <span>Back to Patient List</span>
                                            </button>
                                        </div>

                                        {/* Medical Records Component */}
                                        <PatientMedicalRecords 
                                            patientId={selectedPatientId}
                                            showActions={true}
                                        />
                                    </>
                                )}
                            </div>
                        )}


                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                {/* Enhanced Profile Header */}
                                <div className="bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 rounded-xl shadow-lg overflow-hidden">
                                    <div className="px-6 py-8">
                                        <div className="flex flex-col md:flex-row items-center gap-6">
                                            {/* Profile Avatar */}
                                            <div className="relative">
                                                <div className="w-24 h-24 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center ring-4 ring-white ring-opacity-30">
                                                    <UserCircleIcon className="w-16 h-16 text-white" />
                                                </div>
                                                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                                                    VET
                                                </div>
                                            </div>

                                            {/* Profile Info */}
                                            <div className="text-center md:text-left text-white">
                                                <h2 className="text-2xl font-bold">Dr. {vetProfile?.full_name || userProfile?.full_name}</h2>
                                                <p className="text-teal-100 text-lg">{vetProfile?.specialization || 'General Practice'}</p>
                                                <p className="text-teal-200 text-sm">{userProfile?.email}</p>
                                                <div className="flex items-center justify-center md:justify-start space-x-4 mt-3">
                                                    <div className="flex items-center space-x-1">
                                                        <AcademicCapIcon className="w-4 h-4" />
                                                        <span className="text-sm">{vetProfile?.years_experience || 0} years experience</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <StarIcon className="w-4 h-4 fill-current text-yellow-300" />
                                                        <span className="text-sm">{vetStats.averageRating.toFixed(1)} rating</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Profile Details Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Personal Information Card */}
                                    <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-lg font-semibold text-stone-900 flex items-center">
                                                <UserCircleIcon className="w-5 h-5 text-teal-600 mr-2" />
                                                Personal Information
                                            </h3>
                                            <button className="text-teal-600 hover:text-teal-700">
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between py-3 border-b border-stone-100">
                                                <span className="text-sm font-medium text-stone-600">Full Name</span>
                                                <span className="text-sm text-stone-900">{vetProfile?.full_name || 'Not specified'}</span>
                                            </div>
                                            <div className="flex items-center justify-between py-3 border-b border-stone-100">
                                                <span className="text-sm font-medium text-stone-600">Email</span>
                                                <span className="text-sm text-stone-900">{userProfile?.email || 'Not specified'}</span>
                                            </div>
                                            <div className="flex items-center justify-between py-3 border-b border-stone-100">
                                                <span className="text-sm font-medium text-stone-600">Specialization</span>
                                                <span className="text-sm text-stone-900">{vetProfile?.specialization || 'General Practice'}</span>
                                            </div>
                                            <div className="flex items-center justify-between py-3 border-b border-stone-100">
                                                <span className="text-sm font-medium text-stone-600">License Number</span>
                                                <span className="text-sm text-stone-900">{vetProfile?.license_number || 'Not specified'}</span>
                                            </div>
                                            <div className="flex items-center justify-between py-3">
                                                <span className="text-sm font-medium text-stone-600">Experience</span>
                                                <span className="text-sm text-stone-900">{vetProfile?.years_experience || 'Not specified'} years</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Statistics Card */}
                                    <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                                        <h3 className="text-lg font-semibold text-stone-900 mb-6 flex items-center">
                                            <ChartBarIcon className="w-5 h-5 text-teal-600 mr-2" />
                                            Professional Statistics
                                        </h3>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="text-center p-4 bg-teal-50 rounded-lg">
                                                <div className="text-2xl font-bold text-teal-600">{vetStats.totalAppointments}</div>
                                                <div className="text-xs text-teal-700">Total Appointments</div>
                                            </div>
                                            <div className="text-center p-4 bg-emerald-50 rounded-lg">
                                                <div className="text-2xl font-bold text-emerald-600">{vetStats.completedToday}</div>
                                                <div className="text-xs text-emerald-700">Today Completed</div>
                                            </div>
                                            <div className="text-center p-4 bg-amber-50 rounded-lg">
                                                <div className="text-2xl font-bold text-amber-600">{vetStats.pendingAppointments}</div>
                                                <div className="text-xs text-amber-700">Pending</div>
                                            </div>
                                            <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                                <div className="text-2xl font-bold text-yellow-600">{vetStats.averageRating.toFixed(1)}</div>
                                                <div className="text-xs text-yellow-700">Avg Rating</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Clinic Information & Map */}
                                <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-stone-200 bg-stone-50">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-semibold text-stone-900 flex items-center">
                                                <BuildingOffice2Icon className="w-5 h-5 text-teal-600 mr-2" />
                                                Clinic Information & Location
                                            </h3>
                                            <button
                                                onClick={() => setShowLocationPicker(!showLocationPicker)}
                                                className="flex items-center space-x-2 px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
                                            >
                                                <MapPinIcon className="w-4 h-4" />
                                                <span>{vetProfile?.clinic_id ? 'Update Location' : 'Set Location'}</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        {clinicLoading ? (
                                            <div className="flex items-center justify-center py-8">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                                                <span className="ml-3 text-stone-600">Loading clinic information...</span>
                                            </div>
                                        ) : !vetProfile?.clinic_id ? (
                                            <div className="bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-lg p-4 mb-6">
                                                <div className="flex items-start space-x-3">
                                                    <MapPinIcon className="w-6 h-6 text-blue-600 mt-0.5" />
                                                    <div>
                                                        <p className="text-sm font-medium text-blue-800">Set Up Your Clinic Location</p>
                                                        <p className="text-xs text-blue-700 mt-1">
                                                            Configure your clinic details and location to help pet owners find you on the map.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4 mb-6">
                                                <div className="flex items-start space-x-3">
                                                    <BuildingOffice2Icon className="w-6 h-6 text-emerald-600 mt-0.5" />
                                                    <div>
                                                        <p className="text-sm font-medium text-emerald-800">Clinic Configured</p>
                                                        <p className="text-xs text-emerald-700 mt-1">
                                                            Your clinic is set up and visible to pet owners. You can update the details anytime.
                                                        </p>
                                                        {clinicData.latitude && clinicData.longitude && (
                                                            <div className="mt-2 text-xs text-emerald-600">
                                                                📍 Location: {clinicData.latitude.toFixed(4)}, {clinicData.longitude.toFixed(4)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Clinic Details Form */}
                                            <div className="space-y-4">
                                                <h4 className="font-medium text-stone-900 flex items-center">
                                                    <DocumentTextIcon className="w-4 h-4 text-stone-600 mr-2" />
                                                    Clinic Details
                                                </h4>

                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-stone-700 mb-1">Clinic Name</label>
                                                        <input
                                                            type="text"
                                                            value={clinicData.name}
                                                            onChange={(e) => setClinicData(prev => ({ ...prev, name: e.target.value }))}
                                                            className="w-full px-3 py-2 border border-stone-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm text-stone-900 placeholder-stone-500"
                                                            placeholder="Enter clinic name"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-stone-700 mb-1">Address</label>
                                                        <textarea
                                                            value={clinicData.address}
                                                            onChange={(e) => setClinicData(prev => ({ ...prev, address: e.target.value }))}
                                                            rows={3}
                                                            className="w-full px-3 py-2 border border-stone-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm text-stone-900 placeholder-stone-500"
                                                            placeholder="Enter clinic address"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-stone-700 mb-1">Phone Number</label>
                                                        <div className="relative">
                                                            <PhoneIcon className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                                                            <input
                                                                type="tel"
                                                                value={clinicData.phone}
                                                                onChange={(e) => setClinicData(prev => ({ ...prev, phone: e.target.value }))}
                                                                className="w-full pl-10 pr-3 py-2 border border-stone-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm text-stone-900 placeholder-stone-500"
                                                                placeholder="Enter phone number"
                                                            />
                                                        </div>
                                                    </div>

                                                    {clinicData.latitude && clinicData.longitude && (
                                                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                                                            <div className="flex items-center space-x-2 text-sm text-emerald-700">
                                                                <MapPinIcon className="w-4 h-4" />
                                                                <span className="font-medium">Location Set:</span>
                                                                <span>{clinicData.latitude.toFixed(4)}, {clinicData.longitude.toFixed(4)}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Clinic Map Display */}
                                            <div className="space-y-4">
                                                <h4 className="font-medium text-stone-900 flex items-center">
                                                    <MapPinIcon className="w-4 h-4 text-stone-600 mr-2" />
                                                    Clinic Location Map
                                                </h4>

                                                {clinicData.latitude && clinicData.longitude ? (
                                                    <div className="space-y-4">
                                                        <div className="border border-stone-200 rounded-lg overflow-hidden">
                                                            <ClinicMapView
                                                                latitude={clinicData.latitude}
                                                                longitude={clinicData.longitude}
                                                                clinicName={clinicData.name || 'Your Clinic'}
                                                                address={clinicData.address}
                                                                height="300px"
                                                            />
                                                        </div>
                                                        
                                                        {/* Clinic Summary Info */}
                                                        <div className="bg-stone-50 rounded-lg p-4">
                                                            <h5 className="font-medium text-stone-900 mb-3">Clinic Summary</h5>
                                                            <div className="grid grid-cols-1 gap-2 text-sm">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-stone-600">Status:</span>
                                                                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                                                                        Active
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-stone-600">Location:</span>
                                                                    <span className="text-stone-900 text-xs">
                                                                        {clinicData.latitude.toFixed(4)}, {clinicData.longitude.toFixed(4)}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-stone-600">Data Source:</span>
                                                                    <span className="text-stone-900 text-xs">API Endpoint</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="h-72 bg-stone-100 rounded-lg flex flex-col items-center justify-center text-stone-500 border-2 border-dashed border-stone-300">
                                                        <MapPinIcon className="w-12 h-12 mb-3 text-stone-400" />
                                                        <p className="text-sm font-medium">No location set</p>
                                                        <p className="text-xs text-center mt-1">Click &quot;Set Location&quot; to pin your clinic on the map</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Location Picker */}
                                {showLocationPicker && (
                                    <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-lg font-medium text-stone-900">Select Clinic Location</h4>
                                            <button
                                                onClick={() => setShowLocationPicker(false)}
                                                className="text-stone-400 hover:text-stone-600"
                                            >
                                                <XCircleIcon className="w-6 h-6" />
                                            </button>
                                        </div>

                                        <LocationPicker
                                            onLocationSelect={handleLocationSelect}
                                            initialPosition={
                                                clinicData.latitude && clinicData.longitude
                                                    ? [clinicData.latitude, clinicData.longitude]
                                                    : [13.7563, 100.5018] // Default to Bangkok
                                            }
                                            height="400px"
                                        />

                                        <div className="flex justify-end space-x-3 mt-4">
                                            <button
                                                onClick={() => setShowLocationPicker(false)}
                                                className="px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 rounded-md hover:bg-stone-200 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleUpdateClinicLocation}
                                                disabled={!clinicData.latitude || !clinicData.longitude || isUpdatingProfile}
                                                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {isUpdatingProfile ? 'Saving...' : (vetProfile?.clinic_id ? 'Update Clinic' : 'Create Clinic')}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Patient Reviews Tab */}
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

                    {/* Appointment Detail Modal */}
                    {showAppointmentModal && selectedAppointment && (
                        <div className="fixed inset-0 bg-slate-900 bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200">
                                <div className="bg-blue-600 px-8 py-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                                <CalendarDaysIcon className="w-7 h-7 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold text-white">Appointment Details</h3>
                                                <p className="text-blue-100 text-sm mt-1">Complete patient appointment information</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowAppointmentModal(false)}
                                            className="text-blue-100 hover:text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                                        >
                                            <XCircleIcon className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-8 space-y-8">
                                    {/* Patient Information */}
                                    <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                                        <h4 className="font-bold text-slate-900 mb-4 flex items-center">
                                            <UserCircleIcon className="w-6 h-6 text-blue-600 mr-3" />
                                            Patient Information
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-600 mb-1">Pet Name</label>
                                                <p className="text-slate-900 font-medium">{selectedAppointment.patients?.name}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-600 mb-1">Species & Breed</label>
                                                <p className="text-slate-900 font-medium">{selectedAppointment.patients?.species}, {selectedAppointment.patients?.breed}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-600 mb-1">Weight</label>
                                                <p className="text-slate-900 font-medium">{selectedAppointment.patients?.weight ? `${selectedAppointment.patients.weight} kg` : 'Not recorded'}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-600 mb-1">Date of Birth</label>
                                                <p className="text-slate-900 font-medium">
                                                    {selectedAppointment.patients?.date_of_birth 
                                                        ? new Date(selectedAppointment.patients.date_of_birth).toLocaleDateString()
                                                        : 'Not recorded'
                                                    }
                                                </p>
                                            </div>
                                            {selectedAppointment.patients?.medical_conditions && selectedAppointment.patients.medical_conditions.length > 0 && (
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-semibold text-slate-600 mb-1">Medical Conditions</label>
                                                    <p className="text-slate-900 font-medium">{selectedAppointment.patients.medical_conditions.join(', ')}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Owner Information */}
                                    <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                                        <h4 className="font-bold text-slate-900 mb-4 flex items-center">
                                            <PhoneIcon className="w-6 h-6 text-blue-600 mr-3" />
                                            Owner Information
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-600 mb-1">Full Name</label>
                                                <p className="text-slate-900 font-medium">{selectedAppointment.pet_owner_profiles?.full_name}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-600 mb-1">Phone</label>
                                                <p className="text-slate-900 font-medium">{selectedAppointment.pet_owner_profiles?.phone}</p>
                                            </div>
                                            {selectedAppointment.pet_owner_profiles?.address && (
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-semibold text-slate-600 mb-1">Address</label>
                                                    <p className="text-slate-900 font-medium">{selectedAppointment.pet_owner_profiles.address}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Appointment Details */}
                                    <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                                        <h4 className="font-bold text-slate-900 mb-4 flex items-center">
                                            <CalendarDaysIcon className="w-6 h-6 text-blue-600 mr-3" />
                                            Appointment Details
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-600 mb-1">Date</label>
                                                <p className="text-slate-900 font-medium">{new Date(selectedAppointment.appointment_date).toLocaleDateString()}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-600 mb-1">Time</label>
                                                <p className="text-slate-900 font-medium">{selectedAppointment.appointment_time}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-600 mb-1">Service</label>
                                                <p className="text-slate-900 font-medium">{selectedAppointment.services?.name || 'General Consultation'}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-600 mb-1">Duration</label>
                                                <p className="text-slate-900 font-medium">{selectedAppointment.services?.duration_minutes || 30} minutes</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-600 mb-1">Status</label>
                                                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                                                    selectedAppointment.status === 'completed'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : selectedAppointment.status === 'confirmed'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : selectedAppointment.status === 'pending'
                                                                ? 'bg-slate-100 text-slate-800'
                                                                : selectedAppointment.status === 'cancelled'
                                                                    ? 'bg-slate-200 text-slate-800'
                                                                    : 'bg-slate-100 text-slate-800'
                                                }`}>
                                                    {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                                                </span>
                                            </div>
                                            {selectedAppointment.services?.price && (
                                                <div>
                                                    <label className="block text-sm font-semibold text-slate-600 mb-1">Price</label>
                                                    <p className="text-slate-900 font-medium">₱{selectedAppointment.services.price}</p>
                                                </div>
                                            )}
                                            {selectedAppointment.reason_for_visit && (
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-semibold text-slate-600 mb-1">Reason for Visit</label>
                                                    <p className="text-slate-900 font-medium">{selectedAppointment.reason_for_visit}</p>
                                                </div>
                                            )}
                                            {selectedAppointment.symptoms && (
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-semibold text-slate-600 mb-1">Symptoms</label>
                                                    <p className="text-slate-900 font-medium">{selectedAppointment.symptoms}</p>
                                                </div>
                                            )}
                                            {selectedAppointment.notes && (
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-semibold text-slate-600 mb-1">Notes</label>
                                                    <p className="text-slate-900 font-medium">{selectedAppointment.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-200">
                                        {selectedAppointment.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleAcceptAppointment(Number(selectedAppointment.id))}
                                                    disabled={appointmentLoading}
                                                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center space-x-2 shadow-sm"
                                                >
                                                    <CheckCircleIcon className="w-5 h-5" />
                                                    <span>Approve Appointment</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowAppointmentModal(false);
                                                        handleDeclineAppointment(selectedAppointment);
                                                    }}
                                                    disabled={appointmentLoading}
                                                    className="flex-1 px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center space-x-2 shadow-sm"
                                                >
                                                    <XCircleIcon className="w-5 h-5" />
                                                    <span>Decline Appointment</span>
                                                </button>
                                            </>
                                        )}
                                        {selectedAppointment.status === 'confirmed' && (
                                            <button
                                                onClick={() => handleCompleteAppointment(Number(selectedAppointment.id))}
                                                disabled={appointmentLoading}
                                                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center space-x-2 shadow-sm"
                                            >
                                                <DocumentTextIcon className="w-5 h-5" />
                                                <span>Mark as Completed</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setShowAppointmentModal(false)}
                                            className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-semibold"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Decline Appointment Modal */}
                    {showDeclineModal && selectedAppointment && (
                        <div className="fixed inset-0 bg-slate-900 bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-xl max-w-md w-full shadow-xl border border-slate-200">
                                <div className="bg-slate-600 px-8 py-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                                            <XCircleIcon className="w-7 h-7 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-white">Decline Appointment</h3>
                                            <p className="text-slate-200 text-sm mt-1">Please provide a professional reason</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8">
                                    <div className="mb-8">
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                                            <p className="text-slate-800 font-medium">
                                                <strong>Patient:</strong> {selectedAppointment.patients?.name}
                                            </p>
                                            <p className="text-slate-700 mt-1">
                                                <strong>Scheduled:</strong> {new Date(selectedAppointment.appointment_date).toLocaleDateString()} at {selectedAppointment.appointment_time}
                                            </p>
                                            <p className="text-slate-700 mt-1">
                                                <strong>Owner:</strong> {selectedAppointment.pet_owner_profiles?.full_name}
                                            </p>
                                        </div>

                                        <label htmlFor="decline-reason" className="block text-sm font-semibold text-slate-700 mb-3">
                                            Professional Reason for Declining *
                                        </label>
                                        <textarea
                                            id="decline-reason"
                                            rows={5}
                                            value={declineReason}
                                            onChange={(e) => setDeclineReason(e.target.value)}
                                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 placeholder-slate-500 font-medium"
                                            placeholder="Please provide a professional reason for declining this appointment..."
                                            required
                                        />
                                        <p className="text-xs text-slate-500 mt-2">
                                            This reason will be communicated to the pet owner professionally.
                                        </p>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-200">
                                        <button
                                            onClick={() => {
                                                setShowDeclineModal(false);
                                                setDeclineReason('');
                                                setSelectedAppointment(null);
                                            }}
                                            className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-semibold"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={confirmDeclineAppointment}
                                            disabled={!declineReason.trim() || appointmentLoading}
                                            className="flex-1 px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center space-x-2 shadow-sm"
                                        >
                                            {appointmentLoading ? (
                                                <div className="flex items-center space-x-2">
                                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                                    <span>Processing...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <XCircleIcon className="w-5 h-5" />
                                                    <span>Confirm Decline</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
