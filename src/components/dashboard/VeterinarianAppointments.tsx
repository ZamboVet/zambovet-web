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
            <div className="flex flex-col items-center justify-center py-16">
                <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
                        <CalendarDaysIcon className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute inset-0 border-4 border-blue-200 rounded-2xl animate-ping"></div>
                </div>
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Loading Appointments</h3>
                    <p className="text-slate-600">Please wait while we fetch your appointment data...</p>
                </div>
                <div className="flex space-x-1 mt-6">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Enhanced Header with Status Filter Pills */}
            <div className="mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Appointment Management</h2>
                        <p className="text-slate-600">View, manage, and respond to patient appointments</p>
                    </div>
                    
                    {/* Enhanced Status Filter Pills */}
                    <div className="flex flex-wrap gap-3">
                        {[
                            { key: 'pending', label: 'Pending', color: 'orange', count: appointments.filter(a => a.status === 'pending').length },
                            { key: 'confirmed', label: 'Confirmed', color: 'blue', count: appointments.filter(a => a.status === 'confirmed').length },
                            { key: 'completed', label: 'Completed', color: 'green', count: appointments.filter(a => a.status === 'completed').length },
                            { key: 'cancelled', label: 'Cancelled', color: 'red', count: appointments.filter(a => a.status === 'cancelled').length }
                        ].map((status) => {
                            const isActive = selectedStatus === status.key;
                            const colorClasses = {
                                orange: isActive 
                                    ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-200' 
                                    : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
                                blue: isActive 
                                    ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-200' 
                                    : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
                                green: isActive 
                                    ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-200' 
                                    : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
                                red: isActive 
                                    ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-200' 
                                    : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                            };
                            
                            return (
                                <button
                                    key={status.key}
                                    onClick={() => setSelectedStatus(status.key)}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl border-2 font-medium transition-all duration-300 transform ${isActive ? 'scale-105' : 'hover:scale-105'} ${colorClasses[status.color]}`}
                                >
                                    <span>{status.label}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-white/80 text-slate-700'}`}>
                                        {status.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Enhanced Appointments List */}
            {appointments.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CalendarDaysIcon className="w-10 h-10 text-slate-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">No {selectedStatus} appointments</h3>
                    <p className="text-slate-600 max-w-md mx-auto mb-6">
                        You have no appointments in this status. {selectedStatus === 'pending' ? 'New appointment requests will appear here.' : `${selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)} appointments will be listed here.`}
                    </p>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-sm mx-auto">
                        <p className="text-slate-700 font-medium text-sm">💡 Tip</p>
                        <p className="text-slate-600 text-sm mt-1">Use the filter pills above to view appointments in different statuses</p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-6">
                    {appointments.map((appointment) => {
                        const statusColorMap = {
                            pending: 'from-orange-50 to-orange-100 border-orange-200',
                            confirmed: 'from-blue-50 to-blue-100 border-blue-200',
                            completed: 'from-green-50 to-green-100 border-green-200',
                            cancelled: 'from-red-50 to-red-100 border-red-200'
                        };
                        
                        return (
                            <div key={appointment.id} className={`bg-gradient-to-r ${statusColorMap[appointment.status]} rounded-2xl border-2 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-start space-x-4 mb-4">
                                            <div className={`p-3 rounded-xl ${getStatusColor(appointment.status)} shadow-sm`}>
                                                {getStatusIcon(appointment.status)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <h3 className="text-lg font-bold text-slate-900">
                                                        {appointment.patients.name}
                                                    </h3>
                                                    <span className="text-slate-600">•</span>
                                                    <span className="text-slate-700 font-medium">{appointment.patients.species}</span>
                                                </div>
                                                <p className="text-sm text-slate-600 mb-1">
                                                    {appointment.patients.breed}
                                                </p>
                                                <p className="text-sm text-slate-700 font-medium">
                                                    Owner: {appointment.pet_owner_profiles.full_name}
                                                </p>
                                            </div>
                                        </div>
                                    
                                        {/* Enhanced Appointment Details */}
                                        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 mb-4">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                                        <CalendarDaysIcon className="w-4 h-4 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-600 font-medium">Date</p>
                                                        <p className="text-sm font-semibold text-slate-900">
                                                            {new Date(appointment.appointment_date).toLocaleDateString('en-US', {
                                                                weekday: 'short',
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                                                        <ClockIcon className="w-4 h-4 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-600 font-medium">Time</p>
                                                        <p className="text-sm font-semibold text-slate-900">{appointment.appointment_time}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                                                        <BuildingOfficeIcon className="w-4 h-4 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-600 font-medium">Clinic</p>
                                                        <p className="text-sm font-semibold text-slate-900">{appointment.clinics.name}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {appointment.reason_for_visit && (
                                            <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4">
                                                <p className="text-xs text-slate-600 font-medium mb-1">Reason for Visit</p>
                                                <p className="text-sm text-slate-800 font-medium">{appointment.reason_for_visit}</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex flex-col items-end space-y-4">
                                        <div className="text-right">
                                            <p className="text-xs text-slate-600 font-medium">Total Fee</p>
                                            <p className="text-xl font-bold text-slate-900">
                                                ₱{appointment.total_amount.toLocaleString()}
                                            </p>
                                        </div>
                                        
                                        <div className="flex items-center space-x-2">
                                            {/* Enhanced Action Buttons */}
                                            <button
                                                onClick={() => {
                                                    setSelectedAppointment(appointment);
                                                    setShowDetailsModal(true);
                                                }}
                                                className="p-3 bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 rounded-xl transition-all duration-200 transform hover:scale-110 shadow-sm hover:shadow-md"
                                                title="View Details"
                                            >
                                                <EyeIcon className="w-5 h-5" />
                                            </button>
                                            
                                            {appointment.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleStatusUpdate(appointment.id, 'confirmed')}
                                                        disabled={updating}
                                                        className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all duration-200 transform hover:scale-110 shadow-sm hover:shadow-lg disabled:opacity-50 disabled:transform-none"
                                                        title="Confirm Appointment"
                                                    >
                                                        <CheckCircleIcon className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(appointment.id, 'cancelled')}
                                                        disabled={updating}
                                                        className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-200 transform hover:scale-110 shadow-sm hover:shadow-lg disabled:opacity-50 disabled:transform-none"
                                                        title="Cancel Appointment"
                                                    >
                                                        <XCircleIcon className="w-5 h-5" />
                                                    </button>
                                                </>
                                            )}
                                            
                                            {appointment.status === 'confirmed' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(appointment.id, 'completed')}
                                                    disabled={updating}
                                                    className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200 transform hover:scale-110 shadow-sm hover:shadow-lg disabled:opacity-50 disabled:transform-none"
                                                    title="Mark as Completed"
                                                >
                                                    <CheckCircleIcon className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
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