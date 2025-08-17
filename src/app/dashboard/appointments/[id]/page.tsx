'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format, isPast } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {
    CalendarDaysIcon,
    ClockIcon,
    BuildingOffice2Icon,
    UserIcon,
    HeartIcon,
    DocumentTextIcon,
    CurrencyDollarIcon,
    PhoneIcon,
    MapPinIcon,
    ArrowLeftIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function AppointmentDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { userProfile } = useAuth();
    const [appointment, setAppointment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        if (params.id && userProfile?.roleProfile?.id) {
            fetchAppointment();
        }
    }, [params.id, userProfile]);

    const fetchAppointment = async () => {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
          *,
          clinic:clinics(
            name, 
            address, 
            phone, 
            email,
            operating_hours,
            is_emergency_available
          ),
          veterinarian:veterinarians(
            full_name, 
            specialization,
            years_experience,
            consultation_fee,
            license_number
          ),
          service:services(
            name, 
            description,
            duration_minutes,
            price
          ),
          patient:patients(
            name, 
            species, 
            breed, 
            gender,
            date_of_birth,
            weight,
            medical_conditions
          )
        `)
                .eq('id', params.id)
                .eq('pet_owner_id', userProfile.roleProfile.id)
                .single();

            if (error) throw error;
            setAppointment(data);
        } catch (error) {
            console.error('Error fetching appointment:', error);
            router.push('/dashboard/appointments');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelAppointment = async () => {
        if (!confirm('Are you sure you want to cancel this appointment?')) return;

        setCancelling(true);
        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status: 'cancelled' })
                .eq('id', params.id);

            if (error) throw error;

            // Refresh appointment data
            await fetchAppointment();
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            alert('Failed to cancel appointment. Please try again.');
        } finally {
            setCancelling(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'completed':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'cancelled':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'no_show':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'confirmed':
                return <CheckCircleIcon className="w-5 h-5" />;
            case 'pending':
                return <ExclamationTriangleIcon className="w-5 h-5" />;
            case 'cancelled':
                return <XCircleIcon className="w-5 h-5" />;
            default:
                return <ClockIcon className="w-5 h-5" />;
        }
    };

    if (loading) {
        return (
            <ProtectedRoute>
                <DashboardLayout>
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                        <div className="bg-white rounded-xl p-6 border border-gray-100">
                            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                            <div className="space-y-3">
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            </div>
                        </div>
                    </div>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    if (!appointment) {
        return (
            <ProtectedRoute>
                <DashboardLayout>
                    <div className="text-center py-12">
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">
                            Appointment not found
                        </h2>
                        <p className="text-gray-600 mb-6">
                            The appointment you're looking for doesn't exist or you don't have permission to view it.
                        </p>
                        <button
                            onClick={() => router.push('/dashboard/appointments')}
                            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-lime-500 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
                        >
                            Back to Appointments
                        </button>
                    </div>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    const canCancel = (appointment.status === 'pending' || appointment.status === 'confirmed') &&
        !isPast(new Date(appointment.appointment_date));

    return (
        <ProtectedRoute>
            <DashboardLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <button
                                onClick={() => router.push('/dashboard/appointments')}
                                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                                    Appointment Details
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    {format(new Date(appointment.appointment_date), 'EEEE, MMMM d, yyyy')} at{' '}
                                    {format(new Date(`2000-01-01T${appointment.appointment_time}`), 'h:mm a')}
                                </p>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className={`inline-flex items-center px-4 py-2 rounded-lg border ${getStatusColor(appointment.status)}`}>
                            {getStatusIcon(appointment.status)}
                            <span className="ml-2 font-medium capitalize">{appointment.status}</span>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Main Details */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Appointment Info */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h2 className="text-xl font-semibold text-gray-800 mb-6">
                                    Appointment Information
                                </h2>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="flex items-start">
                                        <CalendarDaysIcon className="w-5 h-5 text-gray-400 mt-1 mr-3 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Date & Time</p>
                                            <p className="text-gray-800 font-medium">
                                                {format(new Date(appointment.appointment_date), 'EEEE, MMMM d, yyyy')}
                                            </p>
                                            <p className="text-gray-600">
                                                {format(new Date(`2000-01-01T${appointment.appointment_time}`), 'h:mm a')}
                                                ({appointment.service.duration_minutes} minutes)
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <HeartIcon className="w-5 h-5 text-gray-400 mt-1 mr-3 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Service</p>
                                            <p className="text-gray-800 font-medium">{appointment.service.name}</p>
                                            {appointment.service.description && (
                                                <p className="text-gray-600 text-sm">{appointment.service.description}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <span className="text-lg mt-1 mr-3">🐾</span>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Pet</p>
                                            <p className="text-gray-800 font-medium">{appointment.patient.name}</p>
                                            <p className="text-gray-600 capitalize">
                                                {appointment.patient.species}
                                                {appointment.patient.breed && ` • ${appointment.patient.breed}`}
                                                {appointment.patient.gender && ` • ${appointment.patient.gender}`}
                                            </p>
                                        </div>
                                    </div>

                                    {appointment.service.price && (
                                        <div className="flex items-start">
                                            <CurrencyDollarIcon className="w-5 h-5 text-gray-400 mt-1 mr-3 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">Cost</p>
                                                <p className="text-gray-800 font-medium text-lg">${appointment.service.price}</p>
                                                <p className="text-gray-600 text-sm">Payment due at appointment</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Visit Details */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h2 className="text-xl font-semibold text-gray-800 mb-6">
                                    Visit Details
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 mb-2">Reason for Visit</p>
                                        <p className="text-gray-800">{appointment.reason_for_visit}</p>
                                    </div>

                                    {appointment.symptoms && (
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 mb-2">Symptoms</p>
                                            <p className="text-gray-800">{appointment.symptoms}</p>
                                        </div>
                                    )}

                                    {appointment.notes && (
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 mb-2">Additional Notes</p>
                                            <p className="text-gray-800">{appointment.notes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Pet Medical Info */}
                            {appointment.patient.medical_conditions && appointment.patient.medical_conditions.length > 0 && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <h2 className="text-xl font-semibold text-gray-800 mb-6">
                                        Pet Medical Information
                                    </h2>

                                    <div>
                                        <p className="text-sm font-medium text-gray-500 mb-3">Known Medical Conditions</p>
                                        <div className="flex flex-wrap gap-2">
                                            {appointment.patient.medical_conditions.map((condition: string, index: number) => (
                                                <span
                                                    key={index}
                                                    className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full"
                                                >
                                                    {condition}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Clinic Info */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                    Clinic Information
                                </h3>

                                <div className="space-y-4">
                                    <div className="flex items-start">
                                        <BuildingOffice2Icon className="w-5 h-5 text-gray-400 mt-1 mr-3 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-gray-800">{appointment.clinic.name}</p>
                                            <p className="text-gray-600 text-sm">{appointment.clinic.address}</p>
                                        </div>
                                    </div>

                                    {appointment.clinic.phone && (
                                        <div className="flex items-start">
                                            <PhoneIcon className="w-5 h-5 text-gray-400 mt-1 mr-3 flex-shrink-0" />
                                            <div>
                                                <p className="text-gray-800">{appointment.clinic.phone}</p>
                                                <p className="text-gray-500 text-sm">Phone</p>
                                            </div>
                                        </div>
                                    )}

                                    {appointment.clinic.email && (
                                        <div className="flex items-start">
                                            <svg className="w-5 h-5 text-gray-400 mt-1 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            <div>
                                                <p className="text-gray-800">{appointment.clinic.email}</p>
                                                <p className="text-gray-500 text-sm">Email</p>
                                            </div>
                                        </div>
                                    )}

                                    {appointment.clinic.is_emergency_available && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                            <p className="text-red-800 text-sm font-medium">
                                                🚨 Emergency services available 24/7
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Veterinarian Info */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                    Your Veterinarian
                                </h3>

                                <div className="space-y-4">
                                    <div className="flex items-start">
                                        <UserIcon className="w-5 h-5 text-gray-400 mt-1 mr-3 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-gray-800">Dr. {appointment.veterinarian.full_name}</p>
                                            {appointment.veterinarian.specialization && (
                                                <p className="text-gray-600 text-sm">{appointment.veterinarian.specialization}</p>
                                            )}
                                        </div>
                                    </div>

                                    {appointment.veterinarian.years_experience && (
                                        <div className="text-sm text-gray-600">
                                            <span className="font-medium">{appointment.veterinarian.years_experience}</span> years of experience
                                        </div>
                                    )}

                                    {appointment.veterinarian.license_number && (
                                        <div className="text-sm text-gray-500">
                                            License: {appointment.veterinarian.license_number}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                    Actions
                                </h3>

                                <div className="space-y-3">
                                    {canCancel && (
                                        <button
                                            onClick={handleCancelAppointment}
                                            disabled={cancelling}
                                            className="w-full px-4 py-3 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {cancelling ? 'Cancelling...' : 'Cancel Appointment'}
                                        </button>
                                    )}

                                    <button
                                        onClick={() => window.print()}
                                        className="w-full px-4 py-3 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                                    >
                                        Print Details
                                    </button>

                                    {appointment.status === 'completed' && (
                                        <button
                                            onClick={() => router.push(`/dashboard/appointments/${appointment.id}/review`)}
                                            className="w-full px-4 py-3 bg-gradient-to-r from-teal-500 to-lime-500 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
                                        >
                                            Leave Review
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Important Notes */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h4 className="font-medium text-blue-800 mb-2">Appointment Reminders</h4>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    <li>• Arrive 15 minutes early</li>
                                    <li>• Bring vaccination records</li>
                                    <li>• List current medications</li>
                                    <li>• Prepare questions for the vet</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
