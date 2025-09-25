'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
    XMarkIcon,
    CalendarDaysIcon,
    ClockIcon,
    UserIcon,
    HeartIcon,
    BuildingOfficeIcon,
    AcademicCapIcon,
    CurrencyDollarIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface Veterinarian {
    id: number;
    full_name: string;
    specialization: string;
    license_number: string;
    years_experience: number;
    consultation_fee: number;
    is_available: boolean;
    average_rating: number;
}

interface Clinic {
    id: number;
    name: string;
    address: string;
    phone: string;
    email: string;
    latitude: number;
    longitude: number;
    operating_hours: any;
    is_active: boolean;
    is_emergency_available: boolean;
    veterinarians?: Veterinarian[];
}

interface Pet {
    id: number;
    name: string;
    species: string;
    breed: string;
    gender: string;
    date_of_birth: string;
    weight: number;
    medical_conditions: string[];
}

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    clinic: Clinic;
    selectedVet?: Veterinarian;
}

export default function BookingModal({ isOpen, onClose, clinic, selectedVet }: BookingModalProps) {
    const { user, userProfile } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [pets, setPets] = useState<Pet[]>([]);
    const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
    const [selectedVeterinarian, setSelectedVeterinarian] = useState<Veterinarian | null>(selectedVet || null);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [reason, setReason] = useState('');
    const [symptoms, setSymptoms] = useState('');
    const [bookingSuccess, setBookingSuccess] = useState(false);

    // Available time slots (9 AM to 5 PM, 30-minute intervals)
    // Using 12-hour format for display
    const generateTimeSlots = () => {
        const slots = [];
        
        // Morning slots (9:00 AM - 12:00 PM)
        for (let hour = 9; hour <= 12; hour++) {
            const hour12 = hour === 12 ? 12 : hour;
            const ampm = hour === 12 ? 'PM' : 'AM';
            slots.push({
                value: `${hour.toString().padStart(2, '0')}:00`,
                display: `${hour12}:00 ${ampm}`
            });
            if (hour < 12) {
                slots.push({
                    value: `${hour.toString().padStart(2, '0')}:30`,
                    display: `${hour12}:30 ${ampm}`
                });
            }
        }
        
        // Afternoon slots (1:00 PM - 5:00 PM)
        for (let hour = 13; hour <= 17; hour++) {
            const hour12 = hour - 12;
            slots.push({
                value: `${hour.toString().padStart(2, '0')}:00`,
                display: `${hour12}:00 PM`
            });
            if (hour < 17) {
                slots.push({
                    value: `${hour.toString().padStart(2, '0')}:30`,
                    display: `${hour12}:30 PM`
                });
            }
        }
        
        return slots;
    };
    
    const timeSlots = generateTimeSlots();

    // Get minimum date (today)
    const today = new Date().toISOString().split('T')[0];
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30); // Book up to 30 days in advance

    useEffect(() => {
        if (isOpen && user) {
            fetchPets();
        }
    }, [isOpen, user]);

    const fetchPets = async () => {
        try {
            console.log('Fetching pets for user:', user?.id);
            
            // Get pet owner profile first
            const { data: petOwnerProfile, error: profileError } = await supabase
                .from('pet_owner_profiles')
                .select('id')
                .eq('user_id', user?.id)
                .single();

            if (profileError) {
                console.error('Error fetching pet owner profile:', profileError);
                return;
            }

            if (!petOwnerProfile) {
                console.log('No pet owner profile found for user:', user?.id);
                return;
            }

            console.log('Pet owner profile found:', petOwnerProfile);

            const { data: petsData, error: petsError } = await supabase
                .from('patients')
                .select('*')
                .eq('owner_id', petOwnerProfile.id)
                .eq('is_active', true);

            if (petsError) {
                console.error('Error fetching pets:', petsError);
                return;
            }

            console.log('Pets found:', petsData);
            setPets(petsData || []);
        } catch (error) {
            console.error('Error in fetchPets:', error);
        }
    };

    const handleVetSelection = (vet: Veterinarian) => {
        setSelectedVeterinarian(vet);
        setCurrentStep(2);
    };

    const handlePetSelection = (pet: Pet) => {
        setSelectedPet(pet);
        setCurrentStep(3);
    };

    const handleDateTimeSelection = () => {
        if (selectedDate && selectedTime) {
            setCurrentStep(4);
        }
    };

    const handleBooking = async () => {
        if (!selectedPet || !selectedVeterinarian || !selectedDate || !selectedTime) {
            alert('Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            console.log('BookingModal: Starting appointment booking process');
            console.log('BookingModal: Selected pet:', selectedPet);
            console.log('BookingModal: Selected veterinarian:', selectedVeterinarian);
            console.log('BookingModal: User ID:', user?.id);
            console.log('BookingModal: User profile:', userProfile);
            console.log('BookingModal: User authenticated:', !!user);

            // Check if user is authenticated
            if (!user) {
                throw new Error('User not authenticated');
            }

            // Get pet owner profile
            const { data: petOwnerProfile, error: profileError } = await supabase
                .from('pet_owner_profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (profileError || !petOwnerProfile) {
                console.error('BookingModal: Pet owner profile not found:', profileError);
                throw new Error('Pet owner profile not found');
            }

            console.log('BookingModal: Pet owner profile found:', petOwnerProfile.id);

            // Verify that the user owns the pet
            const { data: pet, error: petError } = await supabase
                .from('patients')
                .select('owner_id')
                .eq('id', selectedPet.id)
                .single();

            if (petError || !pet || pet.owner_id !== petOwnerProfile.id) {
                console.error('BookingModal: Pet ownership verification failed:', pet, petError);
                throw new Error('Unauthorized to book appointment for this pet');
            }

            console.log('BookingModal: Pet ownership verified');

            // Check appointment limit for pet owner (5 appointments per day)
            const { data: dailyAppointments, error: dailyAppointmentsError } = await supabase
                .from('appointments')
                .select('id')
                .eq('pet_owner_id', petOwnerProfile.id)
                .eq('appointment_date', selectedDate)
                .in('status', ['pending', 'confirmed', 'in_progress']);

            if (dailyAppointmentsError) {
                console.error('BookingModal: Error checking daily appointments:', dailyAppointmentsError);
                throw new Error('Failed to check appointment limit');
            }

            if (dailyAppointments && dailyAppointments.length >= 5) {
                throw new Error('You have reached the daily appointment limit of 5 appointments. Please try booking for another date.');
            }

            // Create appointment directly using Supabase
            const { data: appointment, error: insertError } = await supabase
                .from('appointments')
                .insert({
                    pet_owner_id: petOwnerProfile.id,
                    patient_id: selectedPet.id,
                    veterinarian_id: selectedVeterinarian.id,
                    clinic_id: clinic.id,
                    appointment_date: selectedDate,
                    appointment_time: selectedTime,
                    reason_for_visit: reason,
                    symptoms: symptoms,
                    status: 'pending',
                    booking_type: 'web',
                    estimated_duration: 30,
                    total_amount: selectedVeterinarian.consultation_fee || 0,
                    payment_status: 'pending'
                })
                .select()
                .single();

            if (insertError) {
                console.error('BookingModal: Error creating appointment:', insertError);
                throw new Error('Failed to create appointment: ' + insertError.message);
            }

            console.log('BookingModal: Appointment created successfully:', appointment);

            setBookingSuccess(true);
            setCurrentStep(5);

            // Reset form after successful booking
            setTimeout(() => {
                resetForm();
                onClose();
            }, 3000);

        } catch (error) {
            console.error('BookingModal: Error booking appointment:', error);
            alert('Failed to book appointment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setCurrentStep(1);
        setSelectedPet(null);
        setSelectedVeterinarian(selectedVet || null);
        setSelectedDate('');
        setSelectedTime('');
        setReason('');
        setSymptoms('');
        setBookingSuccess(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    return (
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
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                                <CalendarDaysIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Book Appointment</h3>
                                <p className="text-teal-100 text-sm">{clinic.name}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        {[1, 2, 3, 4, 5].map((step) => (
                            <div key={step} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                    currentStep >= step 
                                        ? 'bg-teal-600 text-white' 
                                        : 'bg-gray-200 text-gray-600'
                                }`}>
                                    {currentStep > step ? (
                                        <CheckCircleIcon className="w-5 h-5" />
                                    ) : (
                                        step
                                    )}
                                </div>
                                {step < 5 && (
                                    <div className={`w-12 h-1 mx-2 ${
                                        currentStep > step ? 'bg-teal-600' : 'bg-gray-200'
                                    }`} />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>Select Vet</span>
                        <span>Choose Pet</span>
                        <span>Date & Time</span>
                        <span>Details</span>
                        <span>Confirm</span>
                    </div>
                </div>

                {/* Step 1: Veterinarian Selection */}
                {currentStep === 1 && (
                    <div className="p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Select a Veterinarian</h4>
                        <div className="space-y-3">
                            {clinic.veterinarians?.map((vet) => (
                                <div
                                    key={vet.id}
                                    onClick={() => handleVetSelection(vet)}
                                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                        selectedVeterinarian?.id === vet.id
                                            ? 'border-teal-500 bg-teal-50'
                                            : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h5 className="font-medium text-gray-900">Dr. {vet.full_name}</h5>
                                            <p className="text-sm text-gray-600 flex items-center mt-1">
                                                <AcademicCapIcon className="w-3 h-3 mr-1" />
                                                {vet.specialization || 'General Practice'}
                                            </p>
                                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                                <span className="flex items-center">
                                                    <ClockIcon className="w-3 h-3 mr-1" />
                                                    {vet.years_experience}+ years
                                                </span>
                                                {vet.consultation_fee && (
                                                    <span className="flex items-center">
                                                        <CurrencyDollarIcon className="w-3 h-3 mr-1" />
                                                        ₱{vet.consultation_fee.toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center mb-1">
                                                {Array.from({ length: 5 }, (_, i) => (
                                                    <svg
                                                        key={i}
                                                        className={`w-3 h-3 ${
                                                            i < Math.round(vet.average_rating)
                                                                ? 'text-yellow-400 fill-current'
                                                                : 'text-gray-300'
                                                        }`}
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                ))}
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                vet.is_available 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {vet.is_available ? 'Available' : 'Busy'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2: Pet Selection */}
                {currentStep === 2 && (
                    <div className="p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Select Your Pet</h4>
                        {pets.length === 0 ? (
                            <div className="text-center py-8">
                                <HeartIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-500 text-lg font-medium">No pets found</p>
                                <p className="text-gray-400 text-sm mb-4">You need to add a pet to your profile before booking an appointment</p>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-blue-800 text-sm">
                                        <strong>To add a pet:</strong>
                                    </p>
                                    <ol className="text-blue-700 text-sm mt-2 space-y-1">
                                        <li>1. Go back to your dashboard</li>
                                        <li>2. Click "Add Pet" button in the header</li>
                                        <li>3. Fill in your pet's information</li>
                                        <li>4. Try booking an appointment again</li>
                                    </ol>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {pets.map((pet) => (
                                    <div
                                        key={pet.id}
                                        onClick={() => handlePetSelection(pet)}
                                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                            selectedPet?.id === pet.id
                                                ? 'border-teal-500 bg-teal-50'
                                                : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                                                <HeartIcon className="w-6 h-6 text-teal-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h5 className="font-medium text-gray-900">{pet.name}</h5>
                                                <p className="text-sm text-gray-600">{pet.species} • {pet.breed}</p>
                                                <p className="text-xs text-gray-500">
                                                    {pet.gender} • {pet.weight ? `${pet.weight} kg` : 'Weight not recorded'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="mt-4 flex justify-between">
                            <button
                                type="button"
                                onClick={() => setCurrentStep(1)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                ← Back
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Date & Time Selection */}
                {currentStep === 3 && (
                    <div className="p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Select Date & Time</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    min={today}
                                    max={maxDate.toISOString().split('T')[0]}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                                <select
                                    value={selectedTime}
                                    onChange={(e) => setSelectedTime(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white"
                                >
                                    <option value="">Select time</option>
                                    {timeSlots.map((slot) => (
                                        <option key={slot.value} value={slot.value}>
                                            {slot.display}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-between">
                            <button
                                type="button"
                                onClick={() => setCurrentStep(2)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                ← Back
                            </button>
                            <button
                                type="button"
                                onClick={handleDateTimeSelection}
                                disabled={!selectedDate || !selectedTime}
                                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Appointment Details */}
                {currentStep === 4 && (
                    <div className="p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Appointment Details</h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Visit</label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 placeholder-gray-500"
                                    placeholder="Describe the reason for the visit..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Symptoms (Optional)</label>
                                <textarea
                                    value={symptoms}
                                    onChange={(e) => setSymptoms(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 placeholder-gray-500"
                                    placeholder="Describe any symptoms your pet is experiencing..."
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-between">
                            <button
                                type="button"
                                onClick={() => setCurrentStep(3)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                ← Back
                            </button>
                            <button
                                type="button"
                                onClick={() => setCurrentStep(5)}
                                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                            >
                                Review & Book
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 5: Confirmation */}
                {currentStep === 5 && (
                    <div className="p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Confirm Appointment</h4>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                            <div className="flex items-center space-x-3">
                                <BuildingOfficeIcon className="w-5 h-5 text-gray-500" />
                                <div>
                                    <p className="font-medium text-gray-900">{clinic.name}</p>
                                    <p className="text-sm text-gray-600">{clinic.address}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <UserIcon className="w-5 h-5 text-gray-500" />
                                <div>
                                    <p className="font-medium text-gray-900">Dr. {selectedVeterinarian?.full_name}</p>
                                    <p className="text-sm text-gray-600">{selectedVeterinarian?.specialization}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <HeartIcon className="w-5 h-5 text-gray-500" />
                                <div>
                                    <p className="font-medium text-gray-900">{selectedPet?.name}</p>
                                    <p className="text-sm text-gray-600">{selectedPet?.species} • {selectedPet?.breed}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <CalendarDaysIcon className="w-5 h-5 text-gray-500" />
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {new Date(selectedDate).toLocaleDateString()} at {timeSlots.find(slot => slot.value === selectedTime)?.display || selectedTime}
                                    </p>
                                </div>
                            </div>
                            {reason && (
                                <div className="flex items-start space-x-3">
                                    <ExclamationTriangleIcon className="w-5 h-5 text-gray-500 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-gray-900">Reason</p>
                                        <p className="text-sm text-gray-600">{reason}</p>
                                    </div>
                                </div>
                            )}
                            {selectedVeterinarian?.consultation_fee && (
                                <div className="border-t pt-3">
                                    <p className="font-medium text-gray-900">
                                        Consultation Fee: ₱{selectedVeterinarian.consultation_fee.toLocaleString()}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="mt-6 flex justify-between">
                            <button
                                type="button"
                                onClick={() => setCurrentStep(4)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                ← Back
                            </button>
                            <button
                                type="button"
                                onClick={handleBooking}
                                disabled={loading}
                                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>Booking...</span>
                                    </>
                                ) : (
                                    <span>Confirm Booking</span>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Success Message */}
                {bookingSuccess && (
                    <div className="p-6 text-center">
                        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h4 className="text-xl font-semibold text-gray-900 mb-2">Appointment Booked Successfully!</h4>
                        <p className="text-gray-600 mb-4">
                            Your appointment has been submitted and is pending veterinarian approval.
                        </p>
                        <p className="text-sm text-gray-500">
                            You will receive a notification once the veterinarian reviews your request.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
} 