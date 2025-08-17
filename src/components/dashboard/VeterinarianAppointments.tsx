'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
    CalendarDaysIcon,
    ClockIcon,
    UserIcon,
    HeartIcon,
    BuildingOfficeIcon,
    CheckCircleIcon,
    XCircleIcon,
    EyeIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface Appointment {
    id: number;
    appointment_date: string;
    appointment_time: string;
    status: string;
    reason_for_visit: string;
    symptoms: string;
    total_amount: number;
    patients: {
        name: string;
        species: string;
        breed: string;
    };
    pet_owner_profiles: {
        full_name: string;
        phone: string;
    };
    clinics: {
        name: string;
        address: string;
    };
}

export default function VeterinarianAppointments() {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState('pending');
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (user) {
            fetchAppointments();
        }
    }, [user, selectedStatus]);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            
            // Get veterinarian profile
            const { data: vetProfile } = await supabase
                .from('veterinarians')
                .select('id')
                .eq('user_id', user?.id)
                .single();

            if (!vetProfile) {
                setLoading(false);
                return;
            }

            // Fetch appointments
            const { data: appointmentsData, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    patients(name, species, breed),
                    pet_owner_profiles(full_name, phone),
                    clinics(name, address)
                `)
                .eq('veterinarian_id', vetProfile.id)
                .eq('status', selectedStatus)
                .order('appointment_date', { ascending: true })
                .order('appointment_time', { ascending: true });

            if (error) {
                console.error('Error fetching appointments:', error);
            } else {
                setAppointments(appointmentsData || []);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (appointmentId: number, newStatus: string) => {
        try {
            setUpdating(true);
            
            const response = await fetch(`/api/appointments/${appointmentId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    status: newStatus
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to update appointment');
            }

            // Refresh appointments
            fetchAppointments();
            
            // Close modal if open
            if (selectedAppointment?.id === appointmentId) {
                setShowDetailsModal(false);
                setSelectedAppointment(null);
            }

        } catch (error) {
            console.error('Error updating appointment:', error);
            alert('Failed to update appointment. Please try again.');
        } finally {
            setUpdating(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'confirmed':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            case 'completed':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <ClockIcon className="w-4 h-4" />;
            case 'confirmed':
                return <CheckCircleIcon className="w-4 h-4" />;
            case 'cancelled':
                return <XCircleIcon className="w-4 h-4" />;
            case 'completed':
                return <CheckCircleIcon className="w-4 h-4" />;
            default:
                return <ClockIcon className="w-4 h-4" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                <span className="ml-3 text-gray-600">Loading appointments...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">My Appointments</h2>
                    <p className="text-gray-600">Manage your scheduled appointments</p>
                </div>
                
                {/* Status Filter */}
                <div className="flex space-x-2">
                    {['pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setSelectedStatus(status)}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                selectedStatus === status
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Appointments List */}
            {appointments.length === 0 ? (
                <div className="text-center py-12">
                    <CalendarDaysIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 text-lg">No {selectedStatus} appointments</p>
                    <p className="text-gray-400 text-sm">You have no appointments in this status</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {appointments.map((appointment) => (
                        <div key={appointment.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <div className={`p-2 rounded-full ${getStatusColor(appointment.status)}`}>
                                            {getStatusIcon(appointment.status)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">
                                                {appointment.patients.name} - {appointment.patients.species}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {appointment.patients.breed} • {appointment.pet_owner_profiles.full_name}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div className="flex items-center space-x-2">
                                            <CalendarDaysIcon className="w-4 h-4 text-gray-500" />
                                            <span className="text-gray-700">
                                                {new Date(appointment.appointment_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <ClockIcon className="w-4 h-4 text-gray-500" />
                                            <span className="text-gray-700">{appointment.appointment_time}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <BuildingOfficeIcon className="w-4 h-4 text-gray-500" />
                                            <span className="text-gray-700">{appointment.clinics.name}</span>
                                        </div>
                                    </div>
                                    
                                    {appointment.reason_for_visit && (
                                        <div className="mt-3">
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">Reason:</span> {appointment.reason_for_visit}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex flex-col items-end space-y-2">
                                    <span className="text-lg font-semibold text-gray-900">
                                        ₱{appointment.total_amount.toLocaleString()}
                                    </span>
                                    
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => {
                                                setSelectedAppointment(appointment);
                                                setShowDetailsModal(true);
                                            }}
                                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                            title="View Details"
                                        >
                                            <EyeIcon className="w-4 h-4" />
                                        </button>
                                        
                                        {appointment.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleStatusUpdate(appointment.id, 'confirmed')}
                                                    disabled={updating}
                                                    className="p-2 text-green-600 hover:text-green-900 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Confirm Appointment"
                                                >
                                                    <CheckCircleIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(appointment.id, 'cancelled')}
                                                    disabled={updating}
                                                    className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Cancel Appointment"
                                                >
                                                    <XCircleIcon className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                        
                                        {appointment.status === 'confirmed' && (
                                            <button
                                                onClick={() => handleStatusUpdate(appointment.id, 'completed')}
                                                disabled={updating}
                                                className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                                                title="Mark as Completed"
                                            >
                                                <CheckCircleIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Appointment Details Modal */}
            {showDetailsModal && selectedAppointment && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                    {/* Enhanced Background with Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-600/90 via-blue-600/85 to-purple-600/90 backdrop-blur-lg">
                        {/* Additional Background Pattern */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(120,119,198,0.3)_0%,transparent_50%)]"></div>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,119,198,0.3)_0%,transparent_50%)]"></div>
                        
                        {/* Floating Pet Icons */}
                        <div className="absolute top-10 left-10 opacity-20 animate-bounce">
                            <span className="text-4xl">🐕</span>
                        </div>
                        <div className="absolute top-20 right-20 opacity-20 animate-bounce" style={{animationDelay: '1s'}}>
                            <span className="text-3xl">🐱</span>
                        </div>
                        <div className="absolute bottom-20 left-20 opacity-20 animate-bounce" style={{animationDelay: '2s'}}>
                            <span className="text-3xl">🐰</span>
                        </div>
                        <div className="absolute bottom-10 right-10 opacity-20 animate-bounce" style={{animationDelay: '0.5s'}}>
                            <span className="text-4xl">🦜</span>
                        </div>
                        
                        {/* Additional Decorative Elements */}
                        <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
                        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-white/40 rounded-full animate-ping"></div>
                        <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-white/25 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                    </div>
                    
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative border border-white/20">
                        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-6 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                                        <CalendarDaysIcon className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Appointment Details</h3>
                                        <p className="text-teal-100 text-sm">
                                            {selectedAppointment.patients.name} - {selectedAppointment.patients.species}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        setSelectedAppointment(null);
                                    }}
                                    className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                                >
                                    <XCircleIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Pet Information */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                    <HeartIcon className="w-4 h-4 mr-2" />
                                    Pet Information
                                </h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600">Name:</span>
                                        <p className="font-medium">{selectedAppointment.patients.name}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Species:</span>
                                        <p className="font-medium">{selectedAppointment.patients.species}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Breed:</span>
                                        <p className="font-medium">{selectedAppointment.patients.breed}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Owner Information */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                    <UserIcon className="w-4 h-4 mr-2" />
                                    Owner Information
                                </h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600">Name:</span>
                                        <p className="font-medium">{selectedAppointment.pet_owner_profiles.full_name}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Phone:</span>
                                        <p className="font-medium">{selectedAppointment.pet_owner_profiles.phone}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Appointment Details */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                    <CalendarDaysIcon className="w-4 h-4 mr-2" />
                                    Appointment Details
                                </h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600">Date:</span>
                                        <p className="font-medium">
                                            {new Date(selectedAppointment.appointment_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Time:</span>
                                        <p className="font-medium">{selectedAppointment.appointment_time}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Clinic:</span>
                                        <p className="font-medium">{selectedAppointment.clinics.name}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Fee:</span>
                                        <p className="font-medium">₱{selectedAppointment.total_amount.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Reason and Symptoms */}
                            {selectedAppointment.reason_for_visit && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                        <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                                        Visit Information
                                    </h4>
                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <span className="text-gray-600 font-medium">Reason for Visit:</span>
                                            <p className="mt-1">{selectedAppointment.reason_for_visit}</p>
                                        </div>
                                        {selectedAppointment.symptoms && (
                                            <div>
                                                <span className="text-gray-600 font-medium">Symptoms:</span>
                                                <p className="mt-1">{selectedAppointment.symptoms}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            {selectedAppointment.status === 'pending' && (
                                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => handleStatusUpdate(selectedAppointment.id, 'confirmed')}
                                        disabled={updating}
                                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
                                    >
                                        <CheckCircleIcon className="w-4 h-4" />
                                        <span>Confirm Appointment</span>
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(selectedAppointment.id, 'cancelled')}
                                        disabled={updating}
                                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center space-x-2"
                                    >
                                        <XCircleIcon className="w-4 h-4" />
                                        <span>Cancel Appointment</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 