'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  HeartIcon,
  CalendarDaysIcon,
  ClockIcon,
  StarIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  PhoneIcon,
  MapPinIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusCircleIcon,
  EyeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartIconSolid,
  StarIcon as StarIconSolid
} from '@heroicons/react/24/solid';

interface MedicalRecord {
  patient: {
    id: number;
    name: string;
    species: string;
    breed?: string;
    gender?: string;
    date_of_birth?: string;
    weight?: number;
    medical_conditions?: string[];
    vaccination_records?: any[];
    age?: {
      years: number;
      months: number;
      formatted: string;
    };
  };
  owner: {
    full_name: string;
    phone?: string;
    address?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
  };
  appointments: any[];
  reviews: any[];
  emergencyRequests: any[];
  statistics: {
    totalAppointments: number;
    completedAppointments: number;
    pendingAppointments: number;
    cancelledAppointments: number;
    averageRating: string | null;
    totalReviews: number;
    emergencyRequestsCount: number;
    lastAppointmentDate: string | null;
    nextAppointmentDate: string | null;
  };
  medicalHistory: {
    conditions: string[];
    vaccinations: any[];
    lastUpdated: string;
  };
}

interface PatientMedicalRecordsProps {
  patientId: string;
  showActions?: boolean;
}

export default function PatientMedicalRecords({ 
  patientId, 
  showActions = true 
}: PatientMedicalRecordsProps) {
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'medical' | 'reviews' | 'emergency'>('overview');
  const [refreshing, setRefreshing] = useState(false);

  const fetchMedicalRecords = async () => {
    try {
      // Get the current session to include the auth token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`/api/patients/${patientId}/medical-records`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include'
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch medical records');
      }

      setMedicalRecord(result.data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load medical records');
      console.error('Error fetching medical records:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMedicalRecords();
  }, [patientId]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!patientId) return;

    const appointmentSubscription = supabase
      .channel('appointments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `pet_id=eq.${patientId}`
        },
        () => {
          console.log('Appointment data changed, refreshing...');
          fetchMedicalRecords();
        }
      )
      .subscribe();

    const patientSubscription = supabase
      .channel('patient_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patients',
          filter: `id=eq.${patientId}`
        },
        () => {
          console.log('Patient data changed, refreshing...');
          fetchMedicalRecords();
        }
      )
      .subscribe();

    const reviewSubscription = supabase
      .channel('review_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reviews',
          filter: `pet_id=eq.${patientId}`
        },
        () => {
          console.log('Review data changed, refreshing...');
          fetchMedicalRecords();
        }
      )
      .subscribe();

    return () => {
      appointmentSubscription.unsubscribe();
      patientSubscription.unsubscribe();
      reviewSubscription.unsubscribe();
    };
  }, [patientId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMedicalRecords();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string, timeString?: string) => {
    const date = new Date(dateString);
    if (timeString) {
      const [hours, minutes] = timeString.split(':');
      date.setHours(parseInt(hours), parseInt(minutes));
    }
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="animate-pulse">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
            <div className="space-y-2 flex-1">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Medical Records</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError('');
              setLoading(true);
              fetchMedicalRecords();
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!medicalRecord) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Medical Records Found</h3>
          <p className="text-gray-600">Unable to load medical records for this patient.</p>
        </div>
      </div>
    );
  }

  const { patient, owner, appointments, reviews, emergencyRequests, statistics, medicalHistory } = medicalRecord;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <HeartIconSolid className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{patient.name}'s Medical Records</h1>
              <p className="text-blue-100">
                {patient.species} • {patient.breed} 
                {patient.age && ` • ${patient.age.formatted} old`}
              </p>
              <p className="text-blue-100">
                Owner: {owner.full_name}
              </p>
            </div>
          </div>
          {showActions && (
            <div className="flex space-x-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-all disabled:opacity-50"
              >
                <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CalendarDaysIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{statistics.totalAppointments}</p>
              <p className="text-sm text-gray-500">Total Appointments</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{statistics.completedAppointments}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <StarIconSolid className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {statistics.averageRating || 'N/A'}
              </p>
              <p className="text-sm text-gray-500">
                Avg Rating ({statistics.totalReviews} reviews)
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{statistics.emergencyRequestsCount}</p>
              <p className="text-sm text-gray-500">Emergency Requests</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { key: 'overview', label: 'Overview', icon: EyeIcon },
              { key: 'appointments', label: 'Appointments', icon: CalendarDaysIcon },
              { key: 'medical', label: 'Medical History', icon: DocumentTextIcon },
              { key: 'reviews', label: 'Reviews', icon: StarIcon },
              { key: 'emergency', label: 'Emergency', icon: ExclamationTriangleIcon },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeTab === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Patient Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Patient Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <UserIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{patient.name}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <HeartIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">Species:</span>
                      <span className="font-medium">{patient.species}</span>
                    </div>
                    {patient.breed && (
                      <div className="flex items-center space-x-3">
                        <span className="w-5 h-5 text-gray-400">🐕</span>
                        <span className="text-gray-600">Breed:</span>
                        <span className="font-medium">{patient.breed}</span>
                      </div>
                    )}
                    {patient.gender && (
                      <div className="flex items-center space-x-3">
                        <span className="w-5 h-5 text-gray-400">⚥</span>
                        <span className="text-gray-600">Gender:</span>
                        <span className="font-medium capitalize">{patient.gender}</span>
                      </div>
                    )}
                    {patient.weight && (
                      <div className="flex items-center space-x-3">
                        <span className="w-5 h-5 text-gray-400">⚖️</span>
                        <span className="text-gray-600">Weight:</span>
                        <span className="font-medium">{patient.weight} kg</span>
                      </div>
                    )}
                    {patient.age && (
                      <div className="flex items-center space-x-3">
                        <ClockIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-600">Age:</span>
                        <span className="font-medium">{patient.age.formatted}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Owner Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <UserIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{owner.full_name}</span>
                    </div>
                    {owner.phone && (
                      <div className="flex items-center space-x-3">
                        <PhoneIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">{owner.phone}</span>
                      </div>
                    )}
                    {owner.address && (
                      <div className="flex items-center space-x-3">
                        <MapPinIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-600">Address:</span>
                        <span className="font-medium">{owner.address}</span>
                      </div>
                    )}
                    {owner.emergency_contact_name && (
                      <div className="flex items-center space-x-3">
                        <ExclamationTriangleIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-600">Emergency Contact:</span>
                        <span className="font-medium">
                          {owner.emergency_contact_name}
                          {owner.emergency_contact_phone && ` (${owner.emergency_contact_phone})`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {statistics.nextAppointmentDate && (
                    <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                      <CalendarDaysIcon className="w-5 h-5 text-blue-500 mr-3" />
                      <span className="text-blue-800">
                        Next appointment scheduled for {formatDate(statistics.nextAppointmentDate)}
                      </span>
                    </div>
                  )}
                  {statistics.lastAppointmentDate && (
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <CheckCircleIcon className="w-5 h-5 text-gray-500 mr-3" />
                      <span className="text-gray-700">
                        Last appointment was on {formatDate(statistics.lastAppointmentDate)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Appointment History ({appointments.length})
                </h3>
              </div>
              
              {appointments.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarDaysIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No appointments found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((appointment, index) => (
                    <div key={appointment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatDateTime(appointment.appointment_date, appointment.appointment_time)}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Veterinarian:</p>
                              <p className="font-medium">
                                Dr. {appointment.veterinarians?.full_name || 'Not assigned'}
                              </p>
                              {appointment.veterinarians?.specialization && (
                                <p className="text-sm text-gray-500">{appointment.veterinarians.specialization}</p>
                              )}
                            </div>
                            
                            <div>
                              <p className="text-sm text-gray-600">Clinic:</p>
                              <p className="font-medium">{appointment.clinics?.name || 'N/A'}</p>
                              {appointment.clinics?.address && (
                                <p className="text-sm text-gray-500">{appointment.clinics.address}</p>
                              )}
                            </div>
                          </div>
                          
                          {appointment.reason_for_visit && (
                            <div className="mt-3">
                              <p className="text-sm text-gray-600">Reason for visit:</p>
                              <p className="text-sm">{appointment.reason_for_visit}</p>
                            </div>
                          )}
                          
                          {appointment.symptoms && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-600">Symptoms:</p>
                              <p className="text-sm">{appointment.symptoms}</p>
                            </div>
                          )}
                          
                          {appointment.notes && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-600">Notes:</p>
                              <p className="text-sm">{appointment.notes}</p>
                            </div>
                          )}
                        </div>
                        
                        {appointment.total_amount && (
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Amount</p>
                            <p className="text-lg font-semibold text-gray-900">
                              ₱{appointment.total_amount.toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Medical History Tab */}
          {activeTab === 'medical' && (
            <div className="space-y-6">
              {/* Medical Conditions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical Conditions</h3>
                {medicalHistory.conditions.length === 0 ? (
                  <div className="text-center py-6">
                    <CheckCircleIcon className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p className="text-gray-500">No medical conditions recorded</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {medicalHistory.conditions.map((condition, index) => (
                      <div key={index} className="flex items-center p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 mr-3" />
                        <span className="text-amber-800">{condition}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Vaccination Records */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Vaccination Records</h3>
                {medicalHistory.vaccinations.length === 0 ? (
                  <div className="text-center py-6">
                    <DocumentTextIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No vaccination records found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {medicalHistory.vaccinations.map((vaccination, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{vaccination.vaccine_name}</p>
                            <p className="text-sm text-gray-500">
                              Administered: {formatDate(vaccination.date_administered)}
                            </p>
                            {vaccination.veterinarian && (
                              <p className="text-sm text-gray-500">
                                By: Dr. {vaccination.veterinarian}
                              </p>
                            )}
                          </div>
                          <CheckCircleIcon className="w-6 h-6 text-green-500" />
                        </div>
                        {vaccination.next_due_date && (
                          <div className="mt-2 p-2 bg-blue-50 rounded">
                            <p className="text-sm text-blue-800">
                              Next due: {formatDate(vaccination.next_due_date)}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Reviews & Ratings ({reviews.length})
                </h3>
                {statistics.averageRating && (
                  <div className="flex items-center space-x-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <StarIconSolid
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(parseFloat(statistics.averageRating!))
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium">{statistics.averageRating}</span>
                  </div>
                )}
              </div>
              
              {reviews.length === 0 ? (
                <div className="text-center py-8">
                  <StarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No reviews yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review, index) => (
                    <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <StarIconSolid
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatDate(review.created_at)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-3">{review.review_text}</p>
                      
                      {review.veterinarians && (
                        <div className="text-sm text-gray-500">
                          Reviewed Dr. {review.veterinarians.full_name}
                          {review.veterinarians.specialization && (
                            <span> ({review.veterinarians.specialization})</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Emergency Tab */}
          {activeTab === 'emergency' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Emergency Requests ({emergencyRequests.length})
              </h3>
              
              {emergencyRequests.length === 0 ? (
                <div className="text-center py-8">
                  <ExclamationTriangleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No emergency requests recorded</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {emergencyRequests.map((request, index) => (
                    <div key={request.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                            <span className="font-medium text-red-800">Emergency Request</span>
                            <span className="text-sm text-red-600">
                              {formatDateTime(request.request_time)}
                            </span>
                          </div>
                          
                          {request.description && (
                            <p className="text-red-700 mb-3">{request.description}</p>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {request.veterinarians && (
                              <div>
                                <p className="text-sm text-red-600">Attended by:</p>
                                <p className="font-medium text-red-800">
                                  Dr. {request.veterinarians.full_name}
                                </p>
                              </div>
                            )}
                            
                            {request.clinics && (
                              <div>
                                <p className="text-sm text-red-600">Location:</p>
                                <p className="font-medium text-red-800">{request.clinics.name}</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-3">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {new Date(medicalHistory.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
}
