'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
    CalendarDaysIcon,
    ClipboardDocumentListIcon,
    ExclamationTriangleIcon,
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
    ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';

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
    emergencyRequests: number;
    averageRating: number;
    totalReviews: number;
    loading: boolean;
}

export default function VeterinarianDashboard() {
    const { user, userProfile, session } = useAuth();
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
    const [vetStats, setVetStats] = useState<VetStats>({
        totalAppointments: 0,
        pendingAppointments: 0,
        completedToday: 0,
        emergencyRequests: 0,
        averageRating: 0,
        totalReviews: 0,
        loading: true
    });

    const [appointments, setAppointments] = useState<any[]>([]);
    const [vetProfile, setVetProfile] = useState<any>(null);
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    
    // Appointment management states
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
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

    useEffect(() => {
        if (user && userProfile?.user_role === 'veterinarian') {
            fetchVetData();
        }
    }, [user, userProfile]);

    const fetchVetData = async () => {
        try {
            setClinicLoading(true);
            
            // Get veterinarian profile directly with clinic information
            const { data: vetData, error: vetError } = await supabase
                .from('veterinarians')
                .select(`
                    id,
                    clinic_id,
                    full_name,
                    specialization,
                    license_number,
                    years_experience,
                    consultation_fee,
                    is_available,
                    average_rating,
                    clinics (
                        id,
                        name,
                        address,
                        phone,
                        email,
                        latitude,
                        longitude,
                        operating_hours,
                        is_active,
                        is_emergency_available
                    )
                `)
                .eq('user_id', user?.id)
                .single();

            if (vetError) {
                console.error('Error fetching veterinarian data:', vetError);
                throw new Error('Failed to fetch veterinarian data');
            }

            setVetProfile(vetData);

            // Set clinic data if available
            if (vetData?.clinics) {
                const clinic = Array.isArray(vetData.clinics) ? vetData.clinics[0] : vetData.clinics;
                if (clinic) {
                    setClinicData({
                        name: clinic.name || '',
                        address: clinic.address || '',
                        phone: clinic.phone || '',
                        latitude: clinic.latitude || null,
                        longitude: clinic.longitude || null
                    });
                }
            }

            if (!vetData) return;

            // Fetch appointments statistics
            const [
                { data: allAppointments },
                { data: pendingAppointments },
                { data: todayCompleted },
                { data: emergencies },
                { data: reviewsData }
            ] = await Promise.all([
                supabase
                    .from('appointments')
                    .select('*')
                    .eq('veterinarian_id', vetData.id),
                supabase
                    .from('appointments')
                    .select('*')
                    .eq('veterinarian_id', vetData.id)
                    .eq('status', 'pending'),
                supabase
                    .from('appointments')
                    .select('*')
                    .eq('veterinarian_id', vetData.id)
                    .eq('status', 'completed')
                    .eq('appointment_date', new Date().toISOString().split('T')[0]),
                supabase
                    .from('emergency_requests')
                    .select('*')
                    .eq('assigned_clinic_id', vetData.clinic_id)
                    .in('status', ['pending', 'acknowledged']),
                supabase
                    .from('reviews')
                    .select('*')
                    .eq('veterinarian_id', vetData.id)
            ]);

            // Calculate average rating
            const avgRating = reviewsData && reviewsData.length > 0
                ? reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length
                : 0;

            setVetStats({
                totalAppointments: allAppointments?.length || 0,
                pendingAppointments: pendingAppointments?.length || 0,
                completedToday: todayCompleted?.length || 0,
                emergencyRequests: emergencies?.length || 0,
                averageRating: avgRating,
                totalReviews: reviewsData?.length || 0,
                loading: false
            });

        } catch (error) {
            console.error('Error fetching vet data:', error);
            setVetStats(prev => ({ ...prev, loading: false }));
        } finally {
            setClinicLoading(false);
        }
    };

    const fetchTabData = async (tab: string) => {
        if (!vetProfile) return;

        try {
            switch (tab) {
                case 'appointments':
                    const { data: appointmentsData } = await supabase
                        .from('appointments')
                        .select(`
              *,
              patients(name, species, breed, date_of_birth, weight, medical_conditions),
              pet_owner_profiles(full_name, phone, address),
              services(name, description, price, duration_minutes),
              clinics(name, address, phone)
            `)
                        .eq('veterinarian_id', vetProfile.id)
                        .order('appointment_date', { ascending: true })
                        .order('appointment_time', { ascending: true });
                    setAppointments(appointmentsData || []);
                    break;
                case 'patients':
                    // Patient data fetching will be implemented when needed
                    break;
                case 'emergency':
                    // Emergency data fetching will be implemented when needed
                    break;
                case 'reviews':
                    // Reviews data fetching will be implemented when needed
                    break;
            }
        } catch (error) {
            console.error(`Error fetching ${tab} data:`, error);
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
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Error signing out:', error);
                alert('Error signing out. Please try again.');
                return;
            }
            router.push('/login');
        } catch (error) {
            console.error('Error signing out:', error);
            alert('Error signing out. Please try again.');
        }
    };

    // Appointment management functions
    const handleViewAppointment = (appointment: any) => {
        setSelectedAppointment(appointment);
        setShowAppointmentModal(true);
    };

    const testSession = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            console.log('Client-side session check:', {
                sessionExists: !!session,
                userId: session?.user?.id,
                accessToken: session?.access_token ? 'EXISTS' : 'NULL'
            });
        } catch (error) {
            console.error('Client session error:', error);
        }
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
        } catch (error: any) {
            console.error('Error confirming appointment:', error);
            alert(`Failed to confirm appointment: ${error.message}. Please try again.`);
        } finally {
            setAppointmentLoading(false);
        }
    };

    const handleDeclineAppointment = (appointment: any) => {
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
        } catch (error: any) {
            console.error('Error declining appointment:', error);
            alert(`Failed to decline appointment: ${error.message}. Please try again.`);
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

    const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
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
                    <div className="min-h-screen bg-stone-100 flex items-center justify-center">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600 mx-auto"></div>
                            <p className="mt-4 text-stone-600">Loading veterinarian dashboard...</p>
                        </div>
                    </div>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute requiredRole="veterinarian">
            <DashboardLayout>
                <div className="min-h-screen bg-stone-100 pb-20">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-4 pt-16 pb-8">
                        <div className="max-w-7xl mx-auto">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="text-center sm:text-left">
                                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                                        Veterinarian Dashboard 🩺
                                    </h1>
                                    <p className="text-teal-100 mt-1 text-sm sm:text-base">
                                        Welcome back, Dr. {vetProfile?.full_name || userProfile?.full_name}
                                    </p>
                                    {vetProfile?.clinics && (
                                        <p className="text-teal-200 text-xs sm:text-sm">
                                            {vetProfile.clinics.name}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="bg-white bg-opacity-90 px-3 py-2 rounded-lg border border-white border-opacity-30">
                                        <div className="flex items-center space-x-2">
                                            <StarIcon className="w-4 h-4 text-yellow-500" />
                                            <span className="text-stone-800 font-semibold">
                                                {vetStats.averageRating.toFixed(1)}
                                            </span>
                                            <span className="text-stone-600 text-sm">
                                                ({vetStats.totalReviews} reviews)
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={testAuth}
                                            className="bg-yellow-500 hover:bg-yellow-600 px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 text-white text-sm"
                                            title="Test Authentication"
                                        >
                                            <span>Test Auth</span>
                                        </button>
                                        <button
                                            onClick={handleSignOut}
                                            className="bg-white bg-opacity-90 hover:bg-opacity-100 px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 border border-white border-opacity-30"
                                            title="Sign Out"
                                        >
                                            <ArrowRightOnRectangleIcon className="w-4 h-4 text-red-600" />
                                            <span className="text-stone-800 font-semibold text-sm">Sign Out</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="max-w-7xl mx-auto px-4 -mt-4">
                        {/* Navigation Tabs */}
                        <div className="bg-white rounded-xl shadow-sm mb-6">
                            <div className="border-b border-stone-200">
                                <nav className="-mb-px flex overflow-x-auto scrollbar-hide px-3 sm:px-6">
                                    {[
                                        { id: 'overview', name: 'Overview', icon: ChartBarIcon },
                                        { id: 'appointments', name: 'Appointments', icon: CalendarDaysIcon },
                                        { id: 'patients', name: 'Patients', icon: ClipboardDocumentListIcon },
                                        { id: 'emergency', name: 'Emergency', icon: ExclamationTriangleIcon },
                                        { id: 'profile', name: 'Profile', icon: UserCircleIcon },
                                        { id: 'reviews', name: 'Reviews', icon: StarIcon }
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => handleTabChange(tab.id)}
                                            className={`group inline-flex items-center py-4 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${activeTab === tab.id
                                                    ? 'border-teal-600 text-teal-700'
                                                    : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
                                                }`}
                                        >
                                            <tab.icon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                                            <span className="hidden sm:inline">{tab.name}</span>
                                            <span className="sm:hidden">{tab.name}</span>
                                        </button>
                                    ))}
                                </nav>
                            </div>
                        </div>

                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* Stats Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                                    <StatCard
                                        title="Total Appointments"
                                        value={vetStats.totalAppointments}
                                        icon={CalendarDaysIcon}
                                        color="bg-teal-600"
                                    />
                                    <StatCard
                                        title="Pending Requests"
                                        value={vetStats.pendingAppointments}
                                        icon={ClockIcon}
                                        color="bg-amber-500"
                                    />
                                    <StatCard
                                        title="Completed Today"
                                        value={vetStats.completedToday}
                                        icon={CheckCircleIcon}
                                        color="bg-emerald-600"
                                    />
                                    <StatCard
                                        title="Emergency Alerts"
                                        value={vetStats.emergencyRequests}
                                        icon={ExclamationTriangleIcon}
                                        color="bg-red-600"
                                    />
                                </div>

                                {/* Quick Actions & Recent Activity */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                    {/* Quick Actions */}
                                    <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4 sm:p-6">
                                        <h3 className="text-base sm:text-lg font-semibold text-stone-900 mb-4">Quick Actions</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => handleTabChange('appointments')}
                                                className="p-4 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition-colors group"
                                            >
                                                <CalendarDaysIcon className="w-6 h-6 text-teal-600 mb-2 mx-auto" />
                                                <p className="text-sm font-medium text-teal-700">View Schedule</p>
                                            </button>
                                            <button
                                                onClick={() => handleTabChange('patients')}
                                                className="p-4 bg-stone-50 hover:bg-stone-100 rounded-lg border border-stone-200 transition-colors group"
                                            >
                                                <ClipboardDocumentListIcon className="w-6 h-6 text-stone-600 mb-2 mx-auto" />
                                                <p className="text-sm font-medium text-stone-700">Patient Records</p>
                                            </button>
                                            <button
                                                onClick={() => handleTabChange('emergency')}
                                                className="p-4 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors group"
                                            >
                                                <ExclamationTriangleIcon className="w-6 h-6 text-red-600 mb-2 mx-auto" />
                                                <p className="text-sm font-medium text-red-700">Emergency</p>
                                            </button>
                                            <button
                                                onClick={() => handleTabChange('profile')}
                                                className="p-4 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors group"
                                            >
                                                <UserCircleIcon className="w-6 h-6 text-amber-600 mb-2 mx-auto" />
                                                <p className="text-sm font-medium text-amber-700">Update Profile</p>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Today's Summary */}
                                    <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4 sm:p-6">
                                        <h3 className="text-base sm:text-lg font-semibold text-stone-900 mb-4">Today's Summary</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-stone-600">Appointments Completed</span>
                                                <span className="font-semibold text-emerald-600">{vetStats.completedToday}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-stone-600">Pending Approvals</span>
                                                <span className="font-semibold text-amber-600">{vetStats.pendingAppointments}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-stone-600">Emergency Requests</span>
                                                <span className="font-semibold text-red-600">{vetStats.emergencyRequests}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-stone-600">Average Rating</span>
                                                <div className="flex items-center space-x-1">
                                                    <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                                                    <span className="font-semibold text-stone-900">{vetStats.averageRating.toFixed(1)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Appointments Tab */}
                        {activeTab === 'appointments' && (
                            <div className="space-y-6">
                                {/* Appointments Header */}
                                <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-stone-900 flex items-center">
                                                <CalendarDaysIcon className="w-6 h-6 text-teal-600 mr-2" />
                                                Appointment Management
                                            </h3>
                                            <p className="text-stone-600 text-sm mt-1">
                                                Review and manage your patient appointments
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <div className="text-sm text-stone-600">
                                                Total: <span className="font-semibold text-stone-900">{appointments.length}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Appointment Status Summary */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-amber-100 rounded-lg">
                                                <ClockIcon className="w-5 h-5 text-amber-600" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-stone-900">
                                                    {appointments.filter(apt => apt.status === 'pending').length}
                                                </p>
                                                <p className="text-xs text-stone-600">Pending</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-teal-100 rounded-lg">
                                                <CheckCircleIcon className="w-5 h-5 text-teal-600" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-stone-900">
                                                    {appointments.filter(apt => apt.status === 'confirmed').length}
                                                </p>
                                                <p className="text-xs text-stone-600">Confirmed</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-emerald-100 rounded-lg">
                                                <DocumentTextIcon className="w-5 h-5 text-emerald-600" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-stone-900">
                                                    {appointments.filter(apt => apt.status === 'completed').length}
                                                </p>
                                                <p className="text-xs text-stone-600">Completed</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-red-100 rounded-lg">
                                                <XCircleIcon className="w-5 h-5 text-red-600" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-stone-900">
                                                    {appointments.filter(apt => apt.status === 'cancelled').length}
                                                </p>
                                                <p className="text-xs text-stone-600">Cancelled</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Appointments List */}
                                <div className="bg-white rounded-xl shadow-sm border border-stone-200">
                                    <div className="px-6 py-4 border-b border-stone-200">
                                        <h4 className="text-lg font-semibold text-stone-900">Appointments List</h4>
                                    </div>

                                    {appointments.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <CalendarDaysIcon className="w-16 h-16 text-stone-400 mx-auto mb-4" />
                                            <h4 className="text-lg font-medium text-stone-900 mb-2">No Appointments</h4>
                                            <p className="text-stone-600">
                                                You don't have any appointments scheduled yet.
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
                                                                className="flex-1 bg-teal-50 text-teal-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-teal-100 transition-colors flex items-center justify-center space-x-1"
                                                            >
                                                                <EyeIcon className="w-4 h-4" />
                                                                <span>View</span>
                                                            </button>
                                                            {appointment.status === 'pending' && (
                                                                <>
                                                                    <button 
                                                                        onClick={() => handleAcceptAppointment(Number(appointment.id))}
                                                                        disabled={appointmentLoading}
                                                                        className="flex-1 bg-emerald-50 text-emerald-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
                                                                    >
                                                                        <CheckCircleIcon className="w-4 h-4" />
                                                                        <span>Accept</span>
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleDeclineAppointment(appointment)}
                                                                        disabled={appointmentLoading}
                                                                        className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
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
                                                                    className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors disabled:opacity-50 flex items-center justify-center space-x-1"
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

                        {/* Other tabs would be implemented similarly */}
                        {activeTab === 'patients' && (
                            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                                <h3 className="text-lg font-semibold text-stone-900 mb-4">Patient Medical Records</h3>
                                <p className="text-stone-600">Patient records functionality will be implemented here.</p>
                            </div>
                        )}

                        {activeTab === 'emergency' && (
                            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                                <h3 className="text-lg font-semibold text-stone-900 mb-4">Emergency Requests</h3>
                                <p className="text-stone-600">Emergency assistance functionality will be implemented here.</p>
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
                                                        <p className="text-xs text-center mt-1">Click "Set Location" to pin your clinic on the map</p>
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

                        {activeTab === 'reviews' && (
                            <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
                                <h3 className="text-lg font-semibold text-stone-900 mb-4">Reviews & Feedback</h3>
                                <p className="text-stone-600">Reviews and feedback functionality will be implemented here.</p>
                            </div>
                        )}
                    </div>

                    {/* Appointment Detail Modal */}
                    {showAppointmentModal && selectedAppointment && (
                        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                                <div className="bg-gradient-to-r from-teal-500 to-blue-600 px-6 py-6 rounded-t-2xl">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                                                <CalendarDaysIcon className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white">Appointment Details</h3>
                                                <p className="text-blue-100 text-sm">Complete appointment information</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowAppointmentModal(false)}
                                            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                                        >
                                            <XCircleIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 space-y-6">
                                    {/* Patient Information */}
                                    <div className="bg-stone-50 rounded-lg p-4">
                                        <h4 className="font-semibold text-stone-900 mb-3 flex items-center">
                                            <UserCircleIcon className="w-5 h-5 text-teal-600 mr-2" />
                                            Patient Information
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-stone-600">Pet Name</label>
                                                <p className="text-stone-900">{selectedAppointment.patients?.name}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-stone-600">Species & Breed</label>
                                                <p className="text-stone-900">{selectedAppointment.patients?.species}, {selectedAppointment.patients?.breed}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-stone-600">Weight</label>
                                                <p className="text-stone-900">{selectedAppointment.patients?.weight ? `${selectedAppointment.patients.weight} kg` : 'Not recorded'}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-stone-600">Date of Birth</label>
                                                <p className="text-stone-900">
                                                    {selectedAppointment.patients?.date_of_birth 
                                                        ? new Date(selectedAppointment.patients.date_of_birth).toLocaleDateString()
                                                        : 'Not recorded'
                                                    }
                                                </p>
                                            </div>
                                            {selectedAppointment.patients?.medical_conditions && selectedAppointment.patients.medical_conditions.length > 0 && (
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-stone-600">Medical Conditions</label>
                                                    <p className="text-stone-900">{selectedAppointment.patients.medical_conditions.join(', ')}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Owner Information */}
                                    <div className="bg-stone-50 rounded-lg p-4">
                                        <h4 className="font-semibold text-stone-900 mb-3 flex items-center">
                                            <PhoneIcon className="w-5 h-5 text-teal-600 mr-2" />
                                            Owner Information
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-stone-600">Full Name</label>
                                                <p className="text-stone-900">{selectedAppointment.pet_owner_profiles?.full_name}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-stone-600">Phone</label>
                                                <p className="text-stone-900">{selectedAppointment.pet_owner_profiles?.phone}</p>
                                            </div>
                                            {selectedAppointment.pet_owner_profiles?.address && (
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-stone-600">Address</label>
                                                    <p className="text-stone-900">{selectedAppointment.pet_owner_profiles.address}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Appointment Details */}
                                    <div className="bg-stone-50 rounded-lg p-4">
                                        <h4 className="font-semibold text-stone-900 mb-3 flex items-center">
                                            <CalendarDaysIcon className="w-5 h-5 text-teal-600 mr-2" />
                                            Appointment Details
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-stone-600">Date</label>
                                                <p className="text-stone-900">{new Date(selectedAppointment.appointment_date).toLocaleDateString()}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-stone-600">Time</label>
                                                <p className="text-stone-900">{selectedAppointment.appointment_time}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-stone-600">Service</label>
                                                <p className="text-stone-900">{selectedAppointment.services?.name || 'General Consultation'}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-stone-600">Duration</label>
                                                <p className="text-stone-900">{selectedAppointment.services?.duration_minutes || 30} minutes</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-stone-600">Status</label>
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    selectedAppointment.status === 'completed'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : selectedAppointment.status === 'confirmed'
                                                            ? 'bg-teal-100 text-teal-800'
                                                            : selectedAppointment.status === 'pending'
                                                                ? 'bg-amber-100 text-amber-800'
                                                                : selectedAppointment.status === 'cancelled'
                                                                    ? 'bg-red-100 text-red-800'
                                                                    : 'bg-stone-100 text-stone-800'
                                                }`}>
                                                    {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                                                </span>
                                            </div>
                                            {selectedAppointment.services?.price && (
                                                <div>
                                                    <label className="block text-sm font-medium text-stone-600">Price</label>
                                                    <p className="text-stone-900">₱{selectedAppointment.services.price}</p>
                                                </div>
                                            )}
                                            {selectedAppointment.reason_for_visit && (
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-stone-600">Reason for Visit</label>
                                                    <p className="text-stone-900">{selectedAppointment.reason_for_visit}</p>
                                                </div>
                                            )}
                                            {selectedAppointment.symptoms && (
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-stone-600">Symptoms</label>
                                                    <p className="text-stone-900">{selectedAppointment.symptoms}</p>
                                                </div>
                                            )}
                                            {selectedAppointment.notes && (
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-stone-600">Notes</label>
                                                    <p className="text-stone-900">{selectedAppointment.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        {selectedAppointment.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleAcceptAppointment(Number(selectedAppointment.id))}
                                                    disabled={appointmentLoading}
                                                    className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
                                                >
                                                    <CheckCircleIcon className="w-5 h-5" />
                                                    <span>Accept Appointment</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowAppointmentModal(false);
                                                        handleDeclineAppointment(selectedAppointment);
                                                    }}
                                                    disabled={appointmentLoading}
                                                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
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
                                                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
                                            >
                                                <DocumentTextIcon className="w-5 h-5" />
                                                <span>Mark as Completed</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setShowAppointmentModal(false)}
                                            className="px-4 py-3 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors font-medium"
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
                        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
                                <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-6 rounded-t-2xl">
                                    <div className="flex items-center space-x-3">
                                        <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                                            <XCircleIcon className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">Decline Appointment</h3>
                                            <p className="text-red-100 text-sm">Please provide a reason</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="mb-6">
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                            <p className="text-red-800 text-sm">
                                                <strong>Appointment:</strong> {selectedAppointment.patients?.name} on {new Date(selectedAppointment.appointment_date).toLocaleDateString()} at {selectedAppointment.appointment_time}
                                            </p>
                                            <p className="text-red-700 text-sm mt-1">
                                                <strong>Owner:</strong> {selectedAppointment.pet_owner_profiles?.full_name}
                                            </p>
                                        </div>

                                        <label htmlFor="decline-reason" className="block text-sm font-medium text-stone-700 mb-2">
                                            Reason for declining *
                                        </label>
                                        <textarea
                                            id="decline-reason"
                                            rows={4}
                                            value={declineReason}
                                            onChange={(e) => setDeclineReason(e.target.value)}
                                            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-stone-900 placeholder-stone-500"
                                            placeholder="Please explain why you're declining this appointment..."
                                            required
                                        />
                                        <p className="text-xs text-stone-500 mt-1">
                                            This reason will be sent to the pet owner as a notification.
                                        </p>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <button
                                            onClick={() => {
                                                setShowDeclineModal(false);
                                                setDeclineReason('');
                                                setSelectedAppointment(null);
                                            }}
                                            className="flex-1 px-4 py-3 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors font-medium"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={confirmDeclineAppointment}
                                            disabled={!declineReason.trim() || appointmentLoading}
                                            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
                                        >
                                            {appointmentLoading ? (
                                                <div className="flex items-center space-x-2">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                    <span>Declining...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <XCircleIcon className="w-4 h-4" />
                                                    <span>Decline Appointment</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
