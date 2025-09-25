'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PatientMedicalRecords from '@/components/medical/PatientMedicalRecords';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  HeartIcon,
  UserIcon,
  CalendarDaysIcon,
  StarIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  PhoneIcon,
  MapPinIcon,
  XMarkIcon,
  ChevronRightIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartIconSolid,
  StarIcon as StarIconSolid
} from '@heroicons/react/24/solid';

interface Patient {
  id: string;
  name: string;
  species: string;
  breed?: string;
  gender?: string;
  date_of_birth?: string;
  weight?: number;
  medical_conditions?: string[];
  vaccination_records?: any[];
  created_at: string;
  updated_at: string;
  owner_id: string;
  pet_owner_profiles: {
    id: string;
    full_name: string;
    phone?: string;
    address?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
  };
  age?: {
    years: number;
    months: number;
    formatted: string;
  };
  stats?: {
    totalAppointments: number;
    lastAppointment?: string;
    averageRating?: string;
  };
}

interface FilterOptions {
  species: string;
  hasConditions: boolean;
  recentAppointments: boolean;
}

export default function VeterinarianPatients() {
  const { userProfile } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    species: '',
    hasConditions: false,
    recentAppointments: false
  });
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeCases: 0,
    recentAppointments: 0,
    criticalCases: 0
  });

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError('');

      // Get the current session to include the auth token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error('User not authenticated');
      }

      // Fetch patients using the API route
      const response = await fetch('/api/patients', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include'
      });
      
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch patients');
      }

      const patientsWithStats = result.data || [];
      setPatients(patientsWithStats);
      setFilteredPatients(patientsWithStats);

      // Calculate statistics
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const newStats = {
        totalPatients: patientsWithStats.length,
        activeCases: patientsWithStats.filter(p => 
          p.stats?.lastAppointment && 
          new Date(p.stats.lastAppointment) > thirtyDaysAgo
        ).length,
        recentAppointments: patientsWithStats.filter(p => 
          p.stats?.totalAppointments && p.stats.totalAppointments > 0
        ).length,
        criticalCases: patientsWithStats.filter(p => 
          p.medical_conditions && p.medical_conditions.length > 0
        ).length
      };
      
      setStats(newStats);

    } catch (err: any) {
      let errorMessage = err.message || 'Failed to load patients';
      
      // Provide more helpful error messages based on the error type
      if (err.message === 'User not authenticated' || errorMessage.includes('Authentication required')) {
        errorMessage = 'Please log in as a veterinarian to access patient records.';
      } else if (errorMessage.includes('Access denied')) {
        errorMessage = 'You need veterinarian privileges to access patient records.';
      }
      
      setError(errorMessage);
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // Filter and search patients
  useEffect(() => {
    let filtered = patients;

    // Apply search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(patient => 
        patient.name.toLowerCase().includes(searchLower) ||
        patient.species.toLowerCase().includes(searchLower) ||
        (patient.breed && patient.breed.toLowerCase().includes(searchLower)) ||
        patient.pet_owner_profiles.full_name.toLowerCase().includes(searchLower)
      );
    }

    // Apply filters
    if (filters.species) {
      filtered = filtered.filter(patient => 
        patient.species.toLowerCase() === filters.species.toLowerCase()
      );
    }

    if (filters.hasConditions) {
      filtered = filtered.filter(patient => 
        patient.medical_conditions && patient.medical_conditions.length > 0
      );
    }

    if (filters.recentAppointments) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(patient => 
        patient.stats?.lastAppointment && 
        new Date(patient.stats.lastAppointment) > thirtyDaysAgo
      );
    }

    setFilteredPatients(filtered);
  }, [searchTerm, filters, patients]);

  const resetFilters = () => {
    setFilters({
      species: '',
      hasConditions: false,
      recentAppointments: false
    });
    setSearchTerm('');
    setShowFilters(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSpeciesIcon = (species: string) => {
    const lowerSpecies = species.toLowerCase();
    if (lowerSpecies.includes('dog')) return '🐕';
    if (lowerSpecies.includes('cat')) return '🐱';
    if (lowerSpecies.includes('bird')) return '🐦';
    if (lowerSpecies.includes('rabbit')) return '🐰';
    if (lowerSpecies.includes('hamster')) return '🐹';
    if (lowerSpecies.includes('fish')) return '🐠';
    return '🐾';
  };

  // If viewing a specific patient's medical records
  if (selectedPatient) {
    return (
      <ProtectedRoute requiredRole="veterinarian">
        <DashboardLayout>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Back Button */}
              <button
                onClick={() => setSelectedPatient(null)}
                className="mb-6 flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span>Back to Patient List</span>
              </button>

              {/* Patient Medical Records */}
              <PatientMedicalRecords patientId={selectedPatient} />
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="veterinarian">
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Patient Records</h1>
                  <p className="text-slate-600 mt-2">
                    Manage and access comprehensive medical records for all patients
                  </p>
                </div>
                
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search patients, owners, species..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-3 w-full sm:w-80 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center space-x-2 px-4 py-3 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      <FunnelIcon className="w-4 h-4" />
                      <span>Filters</span>
                    </button>
                    
                    {(filters.species || filters.hasConditions || filters.recentAppointments || searchTerm) && (
                      <button
                        onClick={resetFilters}
                        className="flex items-center space-x-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <XMarkIcon className="w-4 h-4" />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Filter Panel */}
              {showFilters && (
                <div className="mt-6 bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Filter Options</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Species
                      </label>
                      <select
                        value={filters.species}
                        onChange={(e) => setFilters(prev => ({ ...prev, species: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">All Species</option>
                        <option value="dog">Dog</option>
                        <option value="cat">Cat</option>
                        <option value="bird">Bird</option>
                        <option value="rabbit">Rabbit</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={filters.hasConditions}
                          onChange={(e) => setFilters(prev => ({ ...prev, hasConditions: e.target.checked }))}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>Has Medical Conditions</span>
                      </label>
                    </div>
                    
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={filters.recentAppointments}
                          onChange={(e) => setFilters(prev => ({ ...prev, recentAppointments: e.target.checked }))}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>Recent Appointments (30 days)</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{stats.totalPatients}</p>
                    <p className="text-sm text-slate-600">Total Patients</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <HeartIconSolid className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{stats.activeCases}</p>
                    <p className="text-sm text-slate-600">Active Cases</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <CalendarDaysIcon className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{stats.recentAppointments}</p>
                    <p className="text-sm text-slate-600">With Appointments</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{stats.criticalCases}</p>
                    <p className="text-sm text-slate-600">Critical Cases</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Patients List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              {loading ? (
                <div className="p-8">
                  <div className="animate-pulse space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                          <div className="h-3 bg-slate-200 rounded w-1/6"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Patients</h3>
                  <p className="text-red-600 mb-4">{error}</p>
                  <div className="flex justify-center space-x-4">
                    {error.includes('log in') || error.includes('Authentication') ? (
                      <>
                        <a
                          href="/login"
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Go to Login
                        </a>
                        <button
                          onClick={fetchPatients}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Try Again
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={fetchPatients}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Try Again
                      </button>
                    )}
                  </div>
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="p-8 text-center">
                  <UserIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">No Patients Found</h3>
                  <p className="text-slate-600">
                    {searchTerm || filters.species || filters.hasConditions || filters.recentAppointments
                      ? 'No patients match your search criteria.'
                      : 'No patients registered yet.'}
                  </p>
                </div>
              ) : (
                <div>
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-slate-900">
                        Patient Records ({filteredPatients.length})
                      </h2>
                      {searchTerm && (
                        <span className="text-sm text-slate-500">
                          Showing results for "{searchTerm}"
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Patients List */}
                  <div className="divide-y divide-slate-200">
                    {filteredPatients.map((patient) => (
                      <div
                        key={patient.id}
                        className="p-6 hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => setSelectedPatient(patient.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {/* Pet Avatar */}
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                              {getSpeciesIcon(patient.species)}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-1">
                                <h3 className="text-lg font-semibold text-slate-900">
                                  {patient.name}
                                </h3>
                                <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                                  {patient.species}
                                </span>
                                {patient.breed && (
                                  <span className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded-full">
                                    {patient.breed}
                                  </span>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-slate-600">
                                <div className="flex items-center space-x-2">
                                  <UserIcon className="w-4 h-4" />
                                  <span>Owner: {patient.pet_owner_profiles.full_name}</span>
                                </div>
                                
                                {patient.age && (
                                  <div className="flex items-center space-x-2">
                                    <ClockIcon className="w-4 h-4" />
                                    <span>Age: {patient.age.formatted}</span>
                                  </div>
                                )}
                                
                                {patient.pet_owner_profiles.phone && (
                                  <div className="flex items-center space-x-2">
                                    <PhoneIcon className="w-4 h-4" />
                                    <span>{patient.pet_owner_profiles.phone}</span>
                                  </div>
                                )}
                                
                                {patient.stats && (
                                  <div className="flex items-center space-x-2">
                                    <CalendarDaysIcon className="w-4 h-4" />
                                    <span>{patient.stats.totalAppointments} appointments</span>
                                  </div>
                                )}
                              </div>
                              
                              {patient.medical_conditions && patient.medical_conditions.length > 0 && (
                                <div className="mt-2 flex items-center space-x-2">
                                  <ExclamationTriangleIcon className="w-4 h-4 text-amber-500" />
                                  <span className="text-sm text-amber-700">
                                    {patient.medical_conditions.length} medical condition{patient.medical_conditions.length > 1 ? 's' : ''}
                                  </span>
                                </div>
                              )}
                              
                              {patient.stats?.lastAppointment && (
                                <div className="mt-2 flex items-center space-x-2">
                                  <CalendarDaysIcon className="w-4 h-4 text-green-500" />
                                  <span className="text-sm text-green-700">
                                    Last visit: {formatDate(patient.stats.lastAppointment)}
                                  </span>
                                </div>
                              )}
                              
                              {patient.stats?.averageRating && (
                                <div className="mt-2 flex items-center space-x-2">
                                  <div className="flex items-center">
                                    <StarIconSolid className="w-4 h-4 text-yellow-400" />
                                    <span className="text-sm text-yellow-700 ml-1">
                                      {patient.stats.averageRating} rating
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <p className="text-sm text-slate-500">Added</p>
                              <p className="text-sm font-medium text-slate-900">
                                {formatDate(patient.created_at)}
                              </p>
                            </div>
                            <ChevronRightIcon className="w-5 h-5 text-slate-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
