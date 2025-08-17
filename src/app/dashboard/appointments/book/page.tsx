'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import BookingSteps from '@/components/appointments/BookingSteps';
import ClinicSelection from '@/components/appointments/ClinicSelection';
import VeterinarianSelection from '@/components/appointments/VeterinarianSelection';
import ServiceSelection from '@/components/appointments/ServiceSelection';
import DateTimeSelection from '@/components/appointments/DateTimeSelection';
import PetSelection from '@/components/appointments/PetSelection';
import ReasonForm from '@/components/appointments/ReasonForm';
import BookingConfirmation from '@/components/appointments/BookingConfirmation';
import { supabase } from '@/lib/supabase';
import { ArrowLeftIcon, MapPinIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically import the MapView component with no SSR
const DynamicMapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => <div className="h-[300px] md:h-[400px] bg-gray-100 animate-pulse rounded-lg"></div>
});

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

export default function BookAppointmentPage() {
    const { userProfile } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [bookingData, setBookingData] = useState<Partial<BookingData>>({});
    const [clinics, setClinics] = useState<any[]>([]);
    const [pets, setPets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showMap, setShowMap] = useState(false);

    const totalSteps = 6;

    useEffect(() => {
        if (userProfile?.roleProfile?.id) {
            fetchInitialData();
        }
    }, [userProfile]);

    const fetchInitialData = async () => {
        try {
            // Fetch clinics
            const { data: clinicsData } = await supabase
                .from('clinics')
                .select('*')
                .eq('is_active', true)
                .order('name');

            // Fetch user's pets
            const { data: petsData } = await supabase
                .from('patients')
                .select('*')
                .eq('owner_id', userProfile?.roleProfile?.id)
                .eq('is_active', true)
                .order('name');

            setClinics(clinicsData || []);
            setPets(petsData || []);
        } catch (error) {
            console.error('Error fetching initial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateBookingData = (data: Partial<BookingData>) => {
        setBookingData(prev => ({ ...prev, ...data }));
    };

    const nextStep = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
            // Scroll to top when changing steps on mobile
            if (window.innerWidth < 768) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            // Scroll to top when changing steps on mobile
            if (window.innerWidth < 768) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    };

    const canProceed = () => {
        switch (currentStep) {
            case 1:
                return bookingData.clinic;
            case 2:
                return bookingData.veterinarian;
            case 3:
                return bookingData.service;
            case 4:
                return bookingData.date && bookingData.time;
            case 5:
                return bookingData.pet;
            case 6:
                return bookingData.reason;
            default:
                return false;
        }
    };

    if (loading) {
        return (
            <ProtectedRoute requiredRole="pet_owner">
                <DashboardLayout>
                    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center p-4">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading booking form...</p>
                        </div>
                    </div>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute requiredRole="pet_owner">
            <DashboardLayout>
                <div className="min-h-screen bg-[#faf9f7] p-4 lg:p-8">
                    <div className="max-w-4xl mx-auto">
                        {/* Header */}
                        <div className="flex items-center mb-6 md:mb-8">
                            <Link
                                href="/dashboard/appointments"
                                className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-200 mr-2 md:mr-4"
                            >
                                <ArrowLeftIcon className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
                            </Link>
                            <div>
                                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800">
                                    Book Appointment
                                </h1>
                                <p className="text-sm md:text-base text-gray-600 mt-1">
                                    Schedule a visit for your pet
                                </p>
                            </div>
                        </div>

                        {/* Progress Steps */}
                        <div className="mb-6">
                            <BookingSteps currentStep={currentStep} totalSteps={totalSteps} />
                        </div>

                        {/* Map Toggle Button */}
                        <div className="mb-4">
                            <button 
                                onClick={() => setShowMap(!showMap)}
                                className="flex items-center text-teal-600 hover:text-teal-700 font-medium text-sm md:text-base"
                            >
                                <MapPinIcon className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                                {showMap ? 'Hide Map' : 'Show Map Location'}
                            </button>
                        </div>

                        {/* Map View */}
                        {showMap && (
                            <div className="mb-6">
                                <DynamicMapView 
                                    latitude={6.90915} 
                                    longitude={122.06566} 
                                    markerTitle="Pilar College, RT Lim Boulevard, Zamboanga City"
                                    height={window.innerWidth < 768 ? "300px" : "400px"}
                                />
                                <p className="text-xs md:text-sm text-gray-500 mt-2 text-center">
                                    Pilar College, RT Lim Boulevard, Zamboanga City
                                </p>
                            </div>
                        )}

                        {/* Step Content */}
                        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 lg:p-8 mb-6 md:mb-8">
                            {currentStep === 1 && (
                                <ClinicSelection
                                    clinics={clinics}
                                    selectedClinic={bookingData.clinic}
                                    onSelect={(clinic) => updateBookingData({ clinic })}
                                />
                            )}

                            {currentStep === 2 && (
                                <VeterinarianSelection
                                    clinicId={bookingData.clinic?.id}
                                    selectedVeterinarian={bookingData.veterinarian}
                                    onSelect={(veterinarian) => updateBookingData({ veterinarian })}
                                />
                            )}

                            {currentStep === 3 && (
                                <ServiceSelection
                                    clinicId={bookingData.clinic?.id}
                                    selectedService={bookingData.service}
                                    onSelect={(service) => updateBookingData({ service })}
                                />
                            )}

                            {currentStep === 4 && (
                                <DateTimeSelection
                                    veterinarianId={bookingData.veterinarian?.id}
                                    selectedDate={bookingData.date}
                                    selectedTime={bookingData.time}
                                    onSelect={(date, time) => updateBookingData({ date, time })}
                                />
                            )}

                            {currentStep === 5 && (
                                <PetSelection
                                    pets={pets}
                                    selectedPet={bookingData.pet}
                                    onSelect={(pet) => updateBookingData({ pet })}
                                />
                            )}

                            {currentStep === 6 && (
                                <ReasonForm
                                    reason={bookingData.reason || ''}
                                    symptoms={bookingData.symptoms || ''}
                                    notes={bookingData.notes || ''}
                                    onChange={(data) => updateBookingData(data)}
                                />
                            )}
                        </div>

                        {/* Navigation */}
                        <div className="flex justify-between gap-3">
                            <button
                                onClick={prevStep}
                                disabled={currentStep === 1}
                                className="flex-1 px-4 md:px-6 py-2.5 md:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                            >
                                Previous
                            </button>

                            {currentStep < totalSteps ? (
                                <button
                                    onClick={nextStep}
                                    disabled={!canProceed()}
                                    className="flex-1 px-4 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-teal-500 to-lime-500 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                                >
                                    Continue
                                </button>
                            ) : (
                                <div className="flex-1">
                                    <BookingConfirmation
                                        bookingData={bookingData as BookingData}
                                        userProfile={userProfile}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
