'use client';

import { useState, useEffect } from 'react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {
    CalendarDaysIcon,
    ClockIcon,
    PlusIcon,
    BuildingOffice2Icon,
    UserIcon,
    HeartIcon,
    EllipsisVerticalIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface Appointment {
    id: number;
    appointment_date: string;
    appointment_time: string;
    status: string;
    reason_for_visit: string;
    symptoms?: string;
    total_amount?: number;
    clinic: {
        name: string;
        address: string;
    };
    veterinarian: {
        full_name: string;
        specialization?: string;
    };
    service: {
        name: string;
        duration_minutes: number;
    };
    patient: {
        name: string;
        species: string;
    };
}

export default function AppointmentsPage() {
    const { user, userProfile } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'pending'>('upcoming');

    useEffect(() => {
        if (userProfile?.roleProfile?.id) {
            fetchAppointments();
        }
    }, [userProfile, filter]);

    const fetchAppointments = async () => {
        try {
            // Make sure userProfile exists before accessing it
            if (!userProfile?.roleProfile?.id) {
                setAppointments([]);
                setLoading(false);
                return;
            }

            let query = supabase
                .from('appointments')
                .select(`
          *,
          clinic:clinics(name, address),
          veterinarian:veterinarians(full_name, specialization),
          service:services(name, duration_minutes),
          patient:patients(name, species)
        `)
                .eq('pet_owner_id', userProfile.roleProfile.id)
                .order('appointment_date', { ascending: true })
                .order('appointment_time', { ascending: true });

            // Apply filters
            const today = new Date().toISOString().split('T')[0];

            if (filter === 'upcoming') {
                query = query.gte('appointment_date', today);
            } else if (filter === 'past') {
                query = query.lt('appointment_date', today);
            } else if (filter === 'pending') {
                query = query.eq('status', 'pending');
            }

            const { data, error } = await query;

            if (error) throw error;
            setAppointments(data || []);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'completed':
                return 'bg-blue-100 text-blue-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            case 'no_show':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'confirmed':
                return <CheckCircleIcon className="w-4 h-4" />;
            case 'pending':
                return <ExclamationTriangleIcon className="w-4 h-4" />;
            case 'cancelled':
                return <XCircleIcon className="w-4 h-4" />;
            default:
                return <ClockIcon className="w-4 h-4" />;
        }
    };

    const getDateLabel = (date: string) => {
        const appointmentDate = new Date(date);
        if (isToday(appointmentDate)) return 'Today';
        if (isTomorrow(appointmentDate)) return 'Tomorrow';
        return format(appointmentDate, 'MMM d, yyyy');
    };

    const handleCancelAppointment = async (appointmentId: number) => {
        if (!confirm('Are you sure you want to cancel this appointment?')) return;

        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status: 'cancelled' })
                .eq('id', appointmentId);

            if (error) throw error;

            // Refresh appointments
            fetchAppointments();
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            alert('Failed to cancel appointment. Please try again.');
        }
    };

    if (loading) {
        return (
            <ProtectedRoute>
                <DashboardLayout>
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white rounded-xl p-6 border border-gray-100">
                                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <DashboardLayout>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                                My Appointments
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Manage your pet's veterinary appointments
                            </p>
                        </div>
                        <Link
                            href="/dashboard/appointments/book"
                            className="mt-4 sm:mt-0 inline-flex items-center px-6 py-3 bg-gradient-to-r from-teal-500 to-lime-500 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
                        >
                            <PlusIcon className="w-5 h-5 mr-2" />
                            Book Appointment
                        </Link>
                    </div>

                    {/* Filter Tabs */}
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            {[
                                { key: 'upcoming', label: 'Upcoming', count: appointments.filter(a => !isPast(new Date(a.appointment_date))).length },
                                { key: 'pending', label: 'Pending', count: appointments.filter(a => a.status === 'pending').length },
                                { key: 'past', label: 'Past', count: appointments.filter(a => isPast(new Date(a.appointment_date))).length },
                                { key: 'all', label: 'All', count: appointments.length }
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setFilter(tab.key as any)}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${filter === tab.key
                                            ? 'border-teal-500 text-teal-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    {tab.label}
                                    {tab.count > 0 && (
                                        <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${filter === tab.key
                                                ? 'bg-teal-100 text-teal-600'
                                                : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Appointments List */}
                    {appointments.length === 0 ? (
                        <div className="text-center py-12">
                            <CalendarDaysIcon className="w-16 h-16 text-gray-300 mx-auto mb-6" />
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                {filter === 'upcoming' ? 'No upcoming appointments' :
                                    filter === 'pending' ? 'No pending appointments' :
                                        filter === 'past' ? 'No past appointments' : 'No appointments found'}
                            </h3>
                            <p className="text-gray-600 mb-6">
                                {filter === 'upcoming'
                                    ? "You don't have any upcoming appointments scheduled."
                                    : "No appointments match the selected filter."
                                }
                            </p>
                            <Link
                                href="/dashboard/appointments/book"
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-teal-500 to-lime-500 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
                            >
                                <PlusIcon className="w-5 h-5 mr-2" />
                                Book Your First Appointment
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {appointments.map((appointment) => (
                                <div
                                    key={appointment.id}
                                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            {/* Date and Status */}
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center space-x-4">
                                                    <div className="flex items-center text-gray-600">
                                                        <CalendarDaysIcon className="w-5 h-5 mr-2" />
                                                        <span className="font-medium">
                                                            {getDateLabel(appointment.appointment_date)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center text-gray-600">
                                                        <ClockIcon className="w-5 h-5 mr-2" />
                                                        <span>
                                                            {format(new Date(`2000-01-01T${appointment.appointment_time}`), 'h:mm a')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                                                    {getStatusIcon(appointment.status)}
                                                    <span className="ml-1 capitalize">{appointment.status}</span>
                                                </div>
                                            </div>

                                            {/* Appointment Details */}
                                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                                <div className="flex items-start">
                                                    <BuildingOffice2Icon className="w-4 h-4 text-gray-400 mt-1 mr-2 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-800">{appointment.clinic.name}</p>
                                                        <p className="text-xs text-gray-500">{appointment.clinic.address}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start">
                                                    <UserIcon className="w-4 h-4 text-gray-400 mt-1 mr-2 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-800">Dr. {appointment.veterinarian.full_name}</p>
                                                        {appointment.veterinarian.specialization && (
                                                            <p className="text-xs text-gray-500">{appointment.veterinarian.specialization}</p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-start">
                                                    <HeartIcon className="w-4 h-4 text-gray-400 mt-1 mr-2 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-800">{appointment.service.name}</p>
                                                        <p className="text-xs text-gray-500">{appointment.service.duration_minutes} minutes</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start">
                                                    <span className="text-sm mt-1 mr-2">🐾</span>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-800">{appointment.patient.name}</p>
                                                        <p className="text-xs text-gray-500 capitalize">{appointment.patient.species}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Reason */}
                                            <div className="mb-4">
                                                <p className="text-sm text-gray-600">
                                                    <span className="font-medium">Reason:</span> {appointment.reason_for_visit}
                                                </p>
                                                {appointment.symptoms && (
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        <span className="font-medium">Symptoms:</span> {appointment.symptoms}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                                <div className="flex items-center space-x-4">
                                                    {appointment.total_amount && (
                                                        <span className="text-sm font-medium text-gray-800">
                                                            ${appointment.total_amount}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center space-x-2">
                                                    <Link
                                                        href={`/dashboard/appointments/${appointment.id}`}
                                                        className="px-4 py-2 text-sm font-medium text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                                                    >
                                                        View Details
                                                    </Link>

                                                    {(appointment.status === 'pending' || appointment.status === 'confirmed') &&
                                                        !isPast(new Date(appointment.appointment_date)) && (
                                                            <button
                                                                onClick={() => handleCancelAppointment(appointment.id)}
                                                                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                        )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
