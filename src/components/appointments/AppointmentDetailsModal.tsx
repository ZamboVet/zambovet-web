'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import {
    XMarkIcon,
    CalendarDaysIcon,
    ClockIcon,
    BuildingOffice2Icon,
    UserIcon,
    HeartIcon,
    CurrencyDollarIcon,
    PhoneIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface AppointmentDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointmentId: number;
    onAppointmentUpdate?: () => void;
}

interface AppointmentDetails {
    id: number;
    appointment_date: string;
    appointment_time: string;
    status: string;
    reason_for_visit: string;
    symptoms?: string;
    notes?: string;
    total_amount?: number;
    estimated_duration: number;
    booking_type: string;
    created_at: string;
    clinic: {
        name: string;
        address: string;
        phone?: string;
        email?: string;
        is_emergency_available: boolean;
    };
    veterinarian: {
        full_name: string;
        specialization?: string;
        years_experience?: number;
        license_number?: string;
    };
    patient: {
        name: string;
        species: string;
        breed?: string;
        gender?: string;
        date_of_birth?: string;
        weight?: number;
        medical_conditions?: string[];
    };
    service?: {
        name: string;
        description?: string;
        duration_minutes: number;
        price?: number;
    };
}

export default function AppointmentDetailsModal({
    isOpen,
    onClose,
    appointmentId,
    onAppointmentUpdate
}: AppointmentDetailsModalProps) {
    const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && appointmentId) {
            fetchAppointmentDetails();
        }
    }, [isOpen, appointmentId]);

    const fetchAppointmentDetails = async () => {
        setLoading(true);
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
                        is_emergency_available
                    ),
                    veterinarian:veterinarians(
                        full_name,
                        specialization,
                        years_experience,
                        license_number
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
                .eq('id', appointmentId)
                .single();

            if (error) throw error;
            setAppointment(data);
        } catch (error) {
            console.error('Error fetching appointment details:', error);
        } finally {
            setLoading(false);
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

    const handleCancelAppointment = async () => {
        if (!appointment || !confirm('Are you sure you want to cancel this appointment?')) return;

        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status: 'cancelled' })
                .eq('id', appointmentId);

            if (error) throw error;

            // Update local state
            setAppointment({ ...appointment, status: 'cancelled' });
            
            // Notify parent component
            if (onAppointmentUpdate) {
                onAppointmentUpdate();
            }
            
            // Close modal after successful cancellation
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            alert('Failed to cancel appointment. Please try again.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 backdrop-blur-md bg-white/20 flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
                {/* Header */}
                <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-white/30 p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Appointment Details</h2>
                            <p className="text-gray-600 mt-1">
                                Appointment #{appointmentId}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <XMarkIcon className="w-6 h-6 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="p-6">
                        <div className="animate-pulse space-y-4">
                            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                        </div>
                    </div>
                ) : appointment ? (
                    <div className="p-6 space-y-6">
                        {/* Status and Date */}
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center space-x-4 mb-2">
                                    <div className="flex items-center text-gray-600">
                                        <CalendarDaysIcon className="w-5 h-5 mr-2" />
                                        <span className="font-medium">
                                            {format(new Date(appointment.appointment_date), 'EEEE, MMMM d, yyyy')}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                        <ClockIcon className="w-5 h-5 mr-2" />
                                        <span>
                                            {format(new Date(`2000-01-01T${appointment.appointment_time}`), 'h:mm a')}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-500">
                                    Duration: {appointment.estimated_duration} minutes
                                </div>
                            </div>
                            <div className={`inline-flex items-center px-4 py-2 rounded-lg border ${getStatusColor(appointment.status)}`}>
                                {getStatusIcon(appointment.status)}
                                <span className="ml-2 font-medium capitalize">{appointment.status}</span>
                            </div>
                        </div>

                        {/* Main Details Grid */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Pet Information */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">Pet Information</h3>
                                <div className="flex items-start">
                                    <span className="text-2xl mr-3">🐾</span>
                                    <div>
                                        <p className="font-medium text-gray-800">{appointment.patient.name}</p>
                                        <p className="text-gray-600 capitalize">
                                            {appointment.patient.species}
                                            {appointment.patient.breed && ` • ${appointment.patient.breed}`}
                                        </p>
                                        {appointment.patient.gender && (
                                            <p className="text-sm text-gray-500 capitalize">
                                                {appointment.patient.gender}
                                                {appointment.patient.weight && ` • ${appointment.patient.weight}kg`}
                                            </p>
                                        )}
                                        {appointment.patient.medical_conditions && appointment.patient.medical_conditions.length > 0 && (
                                            <div className="mt-2">
                                                <p className="text-xs text-gray-500 mb-1">Medical Conditions:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {appointment.patient.medical_conditions.map((condition, index) => (
                                                        <span
                                                            key={index}
                                                            className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full"
                                                        >
                                                            {condition}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Clinic Information */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">Clinic Information</h3>
                                <div className="flex items-start">
                                    <BuildingOffice2Icon className="w-5 h-5 text-gray-400 mt-1 mr-3 flex-shrink-0" />
                                    <div>
                                        <p className="font-medium text-gray-800">{appointment.clinic.name}</p>
                                        <p className="text-gray-600 text-sm">{appointment.clinic.address}</p>
                                        {appointment.clinic.phone && (
                                            <div className="flex items-center mt-2">
                                                <PhoneIcon className="w-4 h-4 text-gray-400 mr-2" />
                                                <p className="text-sm text-gray-600">{appointment.clinic.phone}</p>
                                            </div>
                                        )}
                                        {appointment.clinic.is_emergency_available && (
                                            <div className="mt-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full inline-block">
                                                🚨 Emergency Available
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Veterinarian Information */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">Veterinarian</h3>
                                <div className="flex items-start">
                                    <UserIcon className="w-5 h-5 text-gray-400 mt-1 mr-3 flex-shrink-0" />
                                    <div>
                                        <p className="font-medium text-gray-800">Dr. {appointment.veterinarian.full_name}</p>
                                        {appointment.veterinarian.specialization && (
                                            <p className="text-gray-600 text-sm">{appointment.veterinarian.specialization}</p>
                                        )}
                                        {appointment.veterinarian.years_experience && (
                                            <p className="text-gray-500 text-sm">
                                                {appointment.veterinarian.years_experience} years experience
                                            </p>
                                        )}
                                        {appointment.veterinarian.license_number && (
                                            <p className="text-gray-400 text-xs">
                                                License: {appointment.veterinarian.license_number}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Cost Information */}
                            {appointment.total_amount && (
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Cost</h3>
                                    <div className="flex items-start">
                                        <CurrencyDollarIcon className="w-5 h-5 text-gray-400 mt-1 mr-3 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-gray-800 text-lg">₱{appointment.total_amount}</p>
                                            <p className="text-gray-600 text-sm">Total Amount</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Visit Details */}
                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Visit Details</h3>
                            
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Reason for Visit</p>
                                    <p className="text-gray-800">{appointment.reason_for_visit}</p>
                                </div>

                                {appointment.symptoms && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Symptoms</p>
                                        <p className="text-gray-800">{appointment.symptoms}</p>
                                    </div>
                                )}

                                {appointment.notes && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Additional Notes</p>
                                        <p className="text-gray-800">{appointment.notes}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="font-medium text-gray-500">Booking Type</p>
                                        <p className="text-gray-800 capitalize">{appointment.booking_type}</p>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-500">Created</p>
                                        <p className="text-gray-800">
                                            {format(new Date(appointment.created_at), 'MMM d, yyyy')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                            {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                                <button
                                    onClick={handleCancelAppointment}
                                    className="flex-1 px-6 py-3 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors font-medium"
                                >
                                    Cancel Appointment
                                </button>
                            )}
                            
                            <button
                                onClick={() => window.print()}
                                className="flex-1 px-6 py-3 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                            >
                                Print Details
                            </button>
                            
                            <button
                                onClick={onClose}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-lime-500 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 text-center">
                        <p className="text-gray-600">Failed to load appointment details.</p>
                    </div>
                )}
            </div>
        </div>
    );
}