'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
    MagnifyingGlassIcon,
    MapPinIcon,
    PhoneIcon,
    EnvelopeIcon,
    StarIcon,
    ClockIcon,
    UserIcon,
    BuildingOfficeIcon,
    AcademicCapIcon,
    CurrencyDollarIcon,
    CalendarDaysIcon,
    HeartIcon,
    MapIcon
} from '@heroicons/react/24/outline';

// Dynamically import ClinicsMapView to avoid SSR issues with Leaflet
const ClinicsMapView = dynamic(() => import('@/components/maps/ClinicsMapView'), {
    ssr: false,
    loading: () => <div className="h-96 bg-stone-100 rounded-lg flex items-center justify-center">Loading map...</div>
});

// Dynamically import BookingModal
const BookingModal = dynamic(() => import('@/components/appointments/BookingModal'), {
    ssr: false
});

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
    created_at: string;
    veterinarians?: Veterinarian[];
}

interface SearchFilters {
    search: string;
    specialty: string;
}

export default function FindClinics() {
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showMap, setShowMap] = useState(false);
    const [mapLoading, setMapLoading] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
    const [selectedVet, setSelectedVet] = useState<Veterinarian | undefined>(undefined);
    const [filters, setFilters] = useState<SearchFilters>({
        search: '',
        specialty: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 6,
        total: 0,
        totalPages: 0
    });

    const specialties = [
        'General Practice',
        'Emergency Medicine',
        'Surgery',
        'Internal Medicine',
        'Dermatology',
        'Cardiology',
        'Oncology',
        'Orthopedics',
        'Dental Care',
        'Exotic Animals'
    ];

    const fetchClinics = async () => {
        setLoading(true);
        setError(null);
        try {
            const searchParams = new URLSearchParams({
                search: filters.search,
                specialty: filters.specialty,
                page: pagination.page.toString(),
                limit: pagination.limit.toString()
            });

            const response = await fetch(`/api/clinics?${searchParams}`, {
                credentials: 'include'
            });
            const result = await response.json();

            if (response.ok && result.success) {
                setClinics(result.data.clinics);
                setPagination(prev => ({
                    ...prev,
                    total: result.data.pagination.total,
                    totalPages: result.data.pagination.totalPages
                }));
            } else {
                setError(result.error || 'Failed to fetch clinics');
                console.error('Failed to fetch clinics:', result.error);
            }
        } catch (error) {
            setError('Network error occurred while fetching clinics');
            console.error('Error fetching clinics:', error);
        } finally {
            setLoading(false);
        }
    };

    // Debounced search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchClinics();
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [filters.search, filters.specialty]);

    // Immediate fetch on page change
    useEffect(() => {
        fetchClinics();
    }, [pagination.page]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchClinics();
    };

    const resetFilters = () => {
        setFilters({
            search: '',
            specialty: ''
        });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleMapToggle = () => {
        if (!showMap) {
            setMapLoading(true);
            // Small delay to show loading state
            setTimeout(() => {
                setMapLoading(false);
                setShowMap(true);
            }, 300);
        } else {
            setShowMap(false);
        }
    };

    const handleBookAppointment = (clinic: Clinic, vet?: Veterinarian) => {
        setSelectedClinic(clinic);
        setSelectedVet(vet || undefined);
        setShowBookingModal(true);
    };

    const handleCloseBookingModal = () => {
        setShowBookingModal(false);
        setSelectedClinic(null);
        setSelectedVet(undefined);
    };

    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <StarIcon
                key={i}
                className={`w-4 h-4 ${
                    i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                }`}
            />
        ));
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center">
                        <BuildingOfficeIcon className="w-6 h-6 text-teal-600 mr-2" />
                        Find Veterinary Clinics
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                        Discover qualified veterinarians and clinics near you
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>{pagination.total} clinics found</span>
                    </div>
                    <button
                        onClick={handleMapToggle}
                        disabled={mapLoading}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                            showMap 
                                ? 'bg-teal-600 text-white hover:bg-teal-700' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } ${mapLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {mapLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                <span className="hidden sm:inline">Loading...</span>
                                <span className="sm:hidden">Loading...</span>
                            </>
                        ) : (
                            <>
                                <MapIcon className="w-4 h-4" />
                                <span className="hidden sm:inline">{showMap ? 'Hide Map' : 'View Map'}</span>
                                <span className="sm:hidden">{showMap ? 'Hide' : 'Map'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Map View */}
            {showMap && (
                <div className="mb-6">
                    <div className="bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-lg p-3 sm:p-4 mb-4">
                        <div className="flex items-start space-x-3">
                            <MapIcon className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <h3 className="text-sm font-medium text-teal-800">Clinics Map View</h3>
                                <p className="text-xs text-teal-700 mt-1">
                                    Explore all veterinary clinics in Zamboanga City. Tap on markers to view clinic details.
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="relative">
                        <ClinicsMapView 
                            key={`clinics-map-${clinics.length}`}
                            clinics={clinics} 
                            height="400px"
                            className="mb-4"
                            onBookAppointment={handleBookAppointment}
                        />
                        
                        {/* Mobile-friendly map controls */}
                        <div className="sm:hidden mt-3 flex justify-center">
                            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex space-x-2">
                                <button 
                                    onClick={handleMapToggle}
                                    className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                                >
                                    Hide Map
                                </button>
                                <button 
                                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                    className="px-3 py-1 text-xs bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors"
                                >
                                    Back to Top
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Search and Filters */}
            <form onSubmit={handleSearch} className="mb-6">
                <div className="mb-4">
                    {/* Search Input */}
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            placeholder="Search clinics by name or location..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-black placeholder-gray-500"
                        />
                    </div>
                </div>

                <div className="flex justify-between items-center">
                    <button
                        type="button"
                        onClick={resetFilters}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        Clear all filters
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </form>

            {/* Results */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                    <span className="ml-3 text-gray-600">Loading clinics...</span>
                </div>
            ) : (
                <>
                    {clinics.length === 0 ? (
                        <div className="text-center py-12">
                            <BuildingOfficeIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500 text-lg">No clinics found</p>
                            <p className="text-gray-400 text-sm">Try adjusting your search criteria</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {clinics.map((clinic) => (
                                <div key={clinic.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                                    {/* Clinic Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900 text-lg">
                                                {clinic.name}
                                            </h3>
                                            <div className="flex items-center text-gray-600 text-sm mt-1">
                                                <MapPinIcon className="w-4 h-4 mr-1" />
                                                {clinic.address}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contact Info */}
                                    <div className="space-y-2 mb-4">
                                        {clinic.phone && (
                                            <div className="flex items-center text-sm text-gray-600">
                                                <PhoneIcon className="w-4 h-4 mr-2" />
                                                {clinic.phone}
                                            </div>
                                        )}
                                        {clinic.email && (
                                            <div className="flex items-center text-sm text-gray-600">
                                                <EnvelopeIcon className="w-4 h-4 mr-2" />
                                                {clinic.email}
                                            </div>
                                        )}
                                    </div>

                                    {/* Veterinarians */}
                                    <div className="border-t border-gray-100 pt-4">
                                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                            <UserIcon className="w-4 h-4 mr-1" />
                                            Veterinarians ({clinic.veterinarians?.length || 0})
                                        </h4>
                                        
                                        {clinic.veterinarians && clinic.veterinarians.length > 0 ? (
                                            <div className="space-y-3">
                                                {clinic.veterinarians.slice(0, 2).map((vet) => (
                                                    <div key={vet.id} className="bg-gray-50 rounded-lg p-3">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <h5 className="font-medium text-gray-900">
                                                                    Dr. {vet.full_name}
                                                                </h5>
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
                                                                    {renderStars(Math.round(vet.average_rating))}
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
                                                        {vet.is_available && (
                                                            <button
                                                                onClick={() => handleBookAppointment(clinic, vet)}
                                                                className="w-full mt-3 bg-teal-600 text-white py-1 px-3 rounded-md hover:bg-teal-700 transition-colors text-xs font-medium"
                                                            >
                                                                Book with Dr. {vet.full_name.split(' ')[0]}
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                
                                                {clinic.veterinarians.length > 2 && (
                                                    <p className="text-sm text-gray-500 text-center">
                                                        +{clinic.veterinarians.length - 2} more veterinarians
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500">No veterinarians listed</p>
                                        )}
                                    </div>

                                    {/* Action Button */}
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <button 
                                            onClick={() => handleBookAppointment(clinic)}
                                            className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center"
                                        >
                                            <CalendarDaysIcon className="w-4 h-4 mr-2" />
                                            Book Appointment
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-8">
                            <p className="text-sm text-gray-700">
                                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                            </p>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                    disabled={pagination.page === 1}
                                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                
                                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                    const page = i + 1;
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => setPagination(prev => ({ ...prev, page }))}
                                            className={`px-3 py-2 rounded-md text-sm font-medium ${
                                                pagination.page === page
                                                    ? 'bg-teal-600 text-white'
                                                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}
                                
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                    disabled={pagination.page === pagination.totalPages}
                                    className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Booking Modal */}
            {showBookingModal && selectedClinic && (
                <BookingModal
                    isOpen={showBookingModal}
                    onClose={handleCloseBookingModal}
                    clinic={selectedClinic}
                    selectedVet={selectedVet}
                />
            )}
        </div>
    );
}
