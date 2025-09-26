'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import dynamic from 'next/dynamic';
import {
  UserIcon,
  PencilIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  MapPinIcon,
  ClockIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

// Dynamic imports to avoid SSR issues
const LocationPicker = dynamic(() => import('@/components/maps/LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">Loading map...</div>
});

const ClinicMapView = dynamic(() => import('@/components/maps/ClinicMapView'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">Loading map...</div>
});

interface VeterinarianData {
  id: number;
  full_name: string;
  specialization: string;
  license_number: string;
  years_experience: number;
  consultation_fee: number;
  is_available: boolean;
  average_rating: number;
}

interface ClinicData {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
}

export default function VeterinarianProfile() {
  const { userProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);
  const [veterinarianData, setVeterinarianData] = useState<VeterinarianData | null>(null);
  const [clinicData, setClinicData] = useState<ClinicData | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    specialization: '',
    licenseNumber: '',
    yearsExperience: '',
    consultationFee: '',
    email: '',
    phone: '',
    clinicName: '',
    clinicAddress: '',
    clinicPhone: '',
    clinicEmail: '',
    operatingHours: '',
    latitude: null as number | null,
    longitude: null as number | null
  });
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);

  useEffect(() => {
    fetchVeterinarianData();
  }, []);

  const fetchVeterinarianData = async () => {
    try {
      setLoading(true);
      console.log('Fetching veterinarian data...');
      
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.error('No access token found');
        alert('Please log in to access this page.');
        return;
      }
      
      const response = await fetch('/api/veterinarian/clinic', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('API Response:', result);

      if (response.ok && result.success) {
        const { veterinarian, clinic } = result.data;
        setVeterinarianData(veterinarian);
        setClinicData(clinic);
        
        // Populate form data
        setFormData({
          fullName: veterinarian.full_name || '',
          specialization: veterinarian.specialization || '',
          licenseNumber: veterinarian.license_number || '',
          yearsExperience: veterinarian.years_experience?.toString() || '',
          consultationFee: veterinarian.consultation_fee?.toString() || '',
          email: userProfile?.email || '',
          phone: clinic?.phone || '',
          clinicName: clinic?.name || '',
          clinicAddress: clinic?.address || '',
          clinicPhone: clinic?.phone || '',
          clinicEmail: clinic?.email || '',
          operatingHours: typeof clinic?.operating_hours === 'string' 
            ? clinic.operating_hours 
            : JSON.stringify(clinic?.operating_hours || {}),
          latitude: clinic?.latitude || null,
          longitude: clinic?.longitude || null
        });
      } else {
        console.error('Failed to fetch veterinarian data:', result);
        
        // Handle authentication errors specifically
        if (response.status === 401) {
          console.log('Authentication failed - redirecting to debug page');
          // Show helpful error message instead of redirecting
          alert(`Authentication Error: ${result.error || 'Unauthorized'}\n\nPlease:\n1. Make sure you are logged in\n2. Check your browser's developer console\n3. Visit /auth-debug to troubleshoot\n\nDetails: ${result.details || 'No additional details'}`);
        }
      }
    } catch (error) {
      console.error('Error fetching veterinarian data:', error);
      alert(`Network Error: Unable to fetch veterinarian data.\n\nThis could be due to:\n1. Network connectivity issues\n2. Server being down\n3. Authentication problems\n\nPlease check your connection and try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilityToggle = async () => {
    if (!veterinarianData) return;
    
    try {
      setUpdatingAvailability(true);
      const newAvailability = !veterinarianData.is_available;
      
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        alert('Please log in to update availability.');
        return;
      }
      
      const response = await fetch('/api/veterinarian/availability', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          is_available: newAvailability
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setVeterinarianData(prev => prev ? {
          ...prev,
          is_available: newAvailability
        } : null);
      } else {
        console.error('Failed to update availability:', result.error);
        alert('Failed to update availability status. Please try again.');
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      alert('Error updating availability status. Please try again.');
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const handleLocationSelect = async (lat: number, lng: number, address?: string) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      clinicAddress: address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    }));
    setShowLocationPicker(false);
  };

  const handleClinicUpdate = async () => {
    if (!formData.clinicName || !formData.clinicAddress) {
      alert('Please provide clinic name and address');
      return;
    }

    try {
      setUpdatingLocation(true);
      
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        alert('Please log in to update clinic information.');
        return;
      }
      
      const response = await fetch('/api/veterinarian/clinic', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: formData.clinicName,
          address: formData.clinicAddress,
          phone: formData.clinicPhone,
          email: formData.clinicEmail,
          latitude: formData.latitude,
          longitude: formData.longitude,
          operating_hours: formData.operatingHours
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert('Clinic information updated successfully!');
        // Refresh the data
        await fetchVeterinarianData();
      } else {
        console.error('Failed to update clinic:', result.error);
        alert('Failed to update clinic information. Please try again.');
      }
    } catch (error) {
      console.error('Error updating clinic:', error);
      alert('Error updating clinic information. Please try again.');
    } finally {
      setUpdatingLocation(false);
    }
  };

  const handleSave = async () => {
    if (!userProfile) {
      alert('User profile not found. Please log in again.');
      return;
    }

    try {
      setSaving(true);
      console.log('Saving profile data...');
      
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        alert('Please log in to save profile changes.');
        return;
      }
      
      const response = await fetch('/api/veterinarian/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          specialization: formData.specialization,
          licenseNumber: formData.licenseNumber,
          yearsExperience: formData.yearsExperience,
          consultationFee: formData.consultationFee,
          phone: formData.phone
        })
      });

      const result = await response.json();
      console.log('Profile save response:', result);

      if (response.ok && result.success) {
        alert('Profile updated successfully!');
        setIsEditing(false);
        // Refresh the data to show updated values
        await fetchVeterinarianData();
      } else {
        console.error('Failed to update profile:', result.error);
        alert(`Failed to update profile: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="veterinarian">
        <DashboardLayout>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-slate-600">Loading profile...</p>
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
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Professional Profile</h1>
                  <p className="text-slate-600 mt-2">Update your credentials</p>
                </div>
                
                <div className="flex items-center space-x-3">
                  {isEditing && (
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        // Reset form data to original values
                        fetchVeterinarianData();
                      }}
                      disabled={saving}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                    >
                      <span>Cancel</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    disabled={saving}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <PencilIcon className="w-4 h-4" />
                        <span>{isEditing ? 'Save Changes' : 'Edit Profile'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Personal Information */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Personal Information</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <AcademicCapIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Professional Details</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Specialization</label>
                    <input
                      type="text"
                      value={formData.specialization}
                      onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
                      placeholder="e.g., Small Animal Medicine"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">License Number</label>
                    <input
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Years of Experience</label>
                    <input
                      type="number"
                      value={formData.yearsExperience}
                      onChange={(e) => setFormData({...formData, yearsExperience: e.target.value})}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Consultation Fee (PHP)</label>
                    <input
                      type="number"
                      value={formData.consultationFee}
                      onChange={(e) => setFormData({...formData, consultationFee: e.target.value})}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
                    />
                  </div>
                </div>
              </div>

              {/* Enhanced Clinic Information with Location */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Clinic Information & Location</h2>
                  </div>
                  <button
                    onClick={handleClinicUpdate}
                    disabled={updatingLocation}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {updatingLocation ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <MapPinIcon className="w-4 h-4" />
                        <span>Update Clinic</span>
                      </>
                    )}
                  </button>
                </div>
                
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Clinic Name *</label>
                    <input
                      type="text"
                      value={formData.clinicName}
                      onChange={(e) => setFormData({...formData, clinicName: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your clinic name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.clinicPhone}
                      onChange={(e) => setFormData({...formData, clinicPhone: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Clinic phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={formData.clinicEmail}
                      onChange={(e) => setFormData({...formData, clinicEmail: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="clinic@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Operating Hours</label>
                    <input
                      type="text"
                      value={formData.operatingHours}
                      onChange={(e) => setFormData({...formData, operatingHours: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Mon-Fri: 8AM-6PM, Sat: 8AM-4PM"
                    />
                  </div>
                </div>

                {/* Location Section */}
                <div className="border-t border-slate-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
                      <MapPinIcon className="w-5 h-5 text-green-600" />
                      <span>Clinic Location</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowLocationPicker(!showLocationPicker)}
                      className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                    >
                      <GlobeAltIcon className="w-4 h-4" />
                      <span>{showLocationPicker ? 'Hide Map' : 'Select on Map'}</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Address *</label>
                    <textarea
                      value={formData.clinicAddress}
                      onChange={(e) => setFormData({...formData, clinicAddress: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your clinic's full address or use the map to select location"
                    />
                  </div>

                  {formData.latitude && formData.longitude && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-green-800 font-medium mb-1">📍 Precise Location Set</p>
                      <p className="text-xs text-green-700">
                        Coordinates: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                      </p>
                    </div>
                  )}

                  {showLocationPicker && (
                    <div className="mt-6 border border-slate-200 rounded-lg p-4">
                      <h4 className="font-medium text-slate-900 mb-4">Select Your Clinic Location on Map</h4>
                      <LocationPicker
                        onLocationSelect={handleLocationSelect}
                        initialPosition={formData.latitude && formData.longitude 
                          ? [formData.latitude, formData.longitude] 
                          : [6.9214, 122.0790] // Zamboanga City coordinates
                        }
                        height="400px"
                      />
                    </div>
                  )}

                  {/* Current Location Display */}
                  {clinicData && clinicData.latitude && clinicData.longitude && (
                    <div className="mt-6 border border-slate-200 rounded-lg p-4">
                      <h4 className="font-medium text-slate-900 mb-4 flex items-center space-x-2">
                        <MapPinIcon className="w-4 h-4 text-green-600" />
                        <span>Current Clinic Location</span>
                      </h4>
                      <ClinicMapView
                        latitude={clinicData.latitude}
                        longitude={clinicData.longitude}
                        clinicName={clinicData.name || 'Your Clinic'}
                        address={clinicData.address}
                        height="300px"
                      />
                    </div>
                  )}

                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start space-x-2">
                      <div className="w-4 h-4 text-blue-600 mt-0.5">
                        ℹ️
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-blue-900">Location Benefits</p>
                        <p className="text-blue-800">
                          Setting your precise location helps patients find your clinic easily and enables accurate appointment booking.
                          Your location will be displayed on the public clinic directory.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Availability Status Section */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <ShieldCheckIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Availability Status</h2>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${veterinarianData?.is_available ? 'bg-green-100' : 'bg-red-100'}`}>
                      {veterinarianData?.is_available ? (
                        <CheckCircleIcon className="w-6 h-6 text-green-600" />
                      ) : (
                        <XCircleIcon className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">
                        {veterinarianData?.is_available ? 'Available for Appointments' : 'Currently Unavailable'}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {veterinarianData?.is_available 
                          ? 'Patients can book appointments with you' 
                          : 'New appointment bookings are paused'}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleAvailabilityToggle}
                    disabled={updatingAvailability}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                      veterinarianData?.is_available ? 'bg-green-600' : 'bg-red-400'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        veterinarianData?.is_available ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                {updatingAvailability && (
                  <div className="mt-4 flex items-center justify-center text-sm text-slate-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Updating availability status...
                  </div>
                )}
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start space-x-2">
                    <div className="w-4 h-4 text-blue-600 mt-0.5">
                      ℹ️
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">Availability Control</p>
                      <p className="text-blue-800">
                        Toggle your availability to control whether patients can book new appointments with you. 
                        This won't affect existing confirmed appointments.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Professional Stats Section */}
              {veterinarianData && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <AcademicCapIcon className="w-6 h-6 text-purple-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Professional Statistics</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {veterinarianData.years_experience || 0}
                      </div>
                      <p className="text-sm text-slate-600 mt-1">Years Experience</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {veterinarianData.average_rating ? veterinarianData.average_rating.toFixed(1) : 'N/A'}
                      </div>
                      <p className="text-sm text-slate-600 mt-1">Average Rating</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        ₱{veterinarianData.consultation_fee ? veterinarianData.consultation_fee.toLocaleString() : 'Not Set'}
                      </div>
                      <p className="text-sm text-slate-600 mt-1">Consultation Fee</p>
                    </div>
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
