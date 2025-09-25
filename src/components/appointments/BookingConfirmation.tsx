'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
    CalendarDaysIcon,
    ClockIcon,
    BuildingOffice2Icon,
    UserIcon,
    HeartIcon,
    DocumentTextIcon,
    CurrencyDollarIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

interface BookingData {
    clinic: any;
    veterinarian: any;
    service: any;
    date: string;
    time: string;
    pet: any;
    reason: string;
    symptoms: string;
    notes: string;
}

interface BookingConfirmationProps {
    bookingData: BookingData;
    userProfile: any;
}

export default function BookingConfirmation({ bookingData, userProfile }: BookingConfirmationProps) {
    const [isBooking, setIsBooking] = useState(false);
    const [bookingComplete, setBookingComplete] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleConfirmBooking = async () => {
        setIsBooking(true);
        setError('');

        try {
            // Check appointment limit for pet owner (5 appointments per day)
            const { data: dailyAppointments, error: dailyAppointmentsError } = await supabase
                .from('appointments')
                .select('id')
                .eq('pet_owner_id', userProfile.roleProfile.id)
                .eq('appointment_date', bookingData.date)
                .in('status', ['pending', 'confirmed', 'in_progress']);

            if (dailyAppointmentsError) {
                throw new Error('Failed to check appointment limit');
            }

            if (dailyAppointments && dailyAppointments.length >= 5) {
                throw new Error('You have reached the daily appointment limit of 5 appointments. Please try booking for another date.');
            }

            // Create the appointment
            const { data: appointment, error: appointmentError } = await supabase
                .from('appointments')
                .insert({
                    pet_owner_id: userProfile.roleProfile.id,
                    patient_id: bookingData.pet.id,
                    veterinarian_id: bookingData.veterinarian.id,
                    clinic_id: bookingData.clinic.id,
                    service_id: bookingData.service.id,
                    appointment_date: bookingData.date,
                    appointment_time: bookingData.time,
                    estimated_duration: bookingData.service.duration_minutes || 30,
                    booking_type: 'web',
                    reason_for_visit: bookingData.reason,
                    symptoms: bookingData.symptoms,
                    notes: bookingData.notes,
                    status: 'pending',
                    total_amount: bookingData.service.price || 0,
                    payment_status: 'pending'
                })
                .select()
                .single();

            if (appointmentError) throw appointmentError;

            // Create a notification for the user
            await supabase
                .from('notifications')
                .insert({
                    user_id: userProfile.id,
                    title: 'Appointment Booked Successfully',
                    message: `Your appointment with Dr. ${bookingData.veterinarian.full_name} has been scheduled for ${format(new Date(bookingData.date), 'EEEE, MMMM d, yyyy')} at ${format(new Date(`2000-01-01T${bookingData.time}`), 'h:mm a')}.`,
                    notification_type: 'appointment_created',
                    related_appointment_id: appointment.id
                });

            setBookingComplete(true);
        } catch (err: any) {
            console.error('Error booking appointment:', err);
            setError(err.message || 'Failed to book appointment. Please try again.');
        } finally {
            setIsBooking(false);
        }
    };

    if (bookingComplete) {
        return (
            <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircleIcon className="w-10 h-10 text-green-600" />
                </div>

                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    Appointment Booked Successfully!
                </h2>

                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Your appointment has been scheduled and is pending confirmation from the clinic.
                    You'll receive a notification once it's confirmed.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => router.push('/dashboard/appointments')}
                        className="px-6 py-3 bg-gradient-to-r from-teal-500 to-lime-500 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
                    >
                        View My Appointments
                    </button>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    Confirm Your Appointment
                </h2>
                <p className="text-gray-600">
                    Please review your appointment details before confirming
                </p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-red-800">{error}</p>
                </div>
            )}

            <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <div className="grid gap-6">
                    {/* Clinic & Veterinarian */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="flex items-start">
                            <BuildingOffice2Icon className="w-5 h-5 text-gray-400 mt-1 mr-3 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-gray-500">Clinic</p>
                                <p className="text-gray-800 font-medium">{bookingData.clinic.name}</p>
                                <p className="text-sm text-gray-600">{bookingData.clinic.address}</p>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <UserIcon className="w-5 h-5 text-gray-400 mt-1 mr-3 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-gray-500">Veterinarian</p>
                                <p className="text-gray-800 font-medium">Dr. {bookingData.veterinarian.full_name}</p>
                                {bookingData.veterinarian.specialization && (
                                    <p className="text-sm text-gray-600">{bookingData.veterinarian.specialization}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Date & Time */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="flex items-start">
                            <CalendarDaysIcon className="w-5 h-5 text-gray-400 mt-1 mr-3 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-gray-500">Date</p>
                                <p className="text-gray-800 font-medium">
                                    {format(new Date(bookingData.date), 'EEEE, MMMM d, yyyy')}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start">
                            <ClockIcon className="w-5 h-5 text-gray-400 mt-1 mr-3 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-gray-500">Time</p>
                                <p className="text-gray-800 font-medium">
                                    {format(new Date(`2000-01-01T${bookingData.time}`), 'h:mm a')}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Duration: {bookingData.service.duration_minutes || 30} minutes
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Service & Pet */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="flex items-start">
                            <HeartIcon className="w-5 h-5 text-gray-400 mt-1 mr-3 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-gray-500">Service</p>
                                <p className="text-gray-800 font-medium">{bookingData.service.name}</p>
                                {bookingData.service.description && (
                                    <p className="text-sm text-gray-600">{bookingData.service.description}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-start">
                            <div className="w-5 h-5 mt-1 mr-3 flex-shrink-0 text-center">🐾</div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Pet</p>
                                <p className="text-gray-800 font-medium">{bookingData.pet.name}</p>
                                <p className="text-sm text-gray-600 capitalize">
                                    {bookingData.pet.species} {bookingData.pet.breed && `• ${bookingData.pet.breed}`}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Reason & Cost */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="flex items-start">
                            <DocumentTextIcon className="w-5 h-5 text-gray-400 mt-1 mr-3 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-gray-500">Reason for Visit</p>
                                <p className="text-gray-800 font-medium">{bookingData.reason}</p>
                                {bookingData.symptoms && (
                                    <p className="text-sm text-gray-600 mt-1">
                                        <span className="font-medium">Symptoms:</span> {bookingData.symptoms}
                                    </p>
                                )}
                            </div>
                        </div>

                        {bookingData.service.price && (
                            <div className="flex items-start">
                                <CurrencyDollarIcon className="w-5 h-5 text-gray-400 mt-1 mr-3 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Estimated Cost</p>
                                    <p className="text-gray-800 font-medium text-lg">${bookingData.service.price}</p>
                                    <p className="text-sm text-gray-600">Payment due at appointment</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Terms and Confirmation */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-blue-800 mb-2">Important Notes:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Please arrive 15 minutes early for your appointment</li>
                    <li>• Bring any previous medical records or medications</li>
                    <li>• Cancellations must be made at least 24 hours in advance</li>
                    <li>• You will receive a confirmation email once the appointment is approved</li>
                </ul>
            </div>

            <button
                onClick={handleConfirmBooking}
                disabled={isBooking}
                className="w-full py-4 bg-gradient-to-r from-teal-500 to-lime-500 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isBooking ? (
                    <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Booking Appointment...
                    </div>
                ) : (
                    'Confirm Appointment'
                )}
            </button>
        </div>
    );
}
