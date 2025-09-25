'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ClockIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';

interface VeterinarianVerification {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  specialization: string;
  license_number: string;
  years_experience: number;
  consultation_fee: number;
  clinic_id?: string;
  business_permit_url: string;
  professional_license_url?: string;
  government_id_url: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  // Profile data
  profiles?: {
    email: string;
    phone: string;
  };
}

export default function AdminVerificationDashboard() {
  const { userProfile } = useAuth();
  const [verifications, setVerifications] = useState<VeterinarianVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<VeterinarianVerification | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('veterinarian_applications')
        .select(`
          *,
          profiles(email, phone)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching verifications:', error);
        return;
      }

      // Use the data as is since email and phone are directly in veterinarian_applications
      const enrichedData = data || [];

      setVerifications(enrichedData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewVerification = (verification: VeterinarianVerification) => {
    setSelectedVerification(verification);
    setRemarks(verification.review_notes || verification.rejection_reason || '');
    setShowModal(true);
  };

  const handleApproveVerification = async (verificationId: string) => {
    if (!userProfile?.id) return;
    
    setActionLoading(true);
    try {
      // Step 1: Update verification status
      const { error: verificationError } = await supabase
        .from('veterinarian_applications')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: userProfile.id,
          review_notes: remarks.trim() || null
        })
        .eq('id', verificationId);

      if (verificationError) {
        throw verificationError;
      }

      // Step 2: Get the user_id from profiles table using the email
      const verification = verifications.find(v => v.id === verificationId);
      if (verification) {
        // First get the user_id from profiles table
        const { data: profileData, error: findProfileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', verification.email)
          .single();

        if (findProfileError || !profileData) {
          throw new Error('User profile not found');
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            is_active: true,
            verification_status: 'approved'
          })
          .eq('id', profileData.id);

        if (profileError) {
          throw profileError;
        }

        // Step 3: Create veterinarian record
        const { error: vetError } = await supabase
          .from('veterinarians')
          .upsert({
            user_id: profileData.id,
            full_name: verification.full_name,
            specialization: verification.specialization,
            license_number: verification.license_number,
            years_experience: verification.years_experience,
            consultation_fee: verification.consultation_fee,
            is_available: true,
            average_rating: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (vetError) {
          console.error('Error creating veterinarian record:', vetError);
        }
        
        // Send approval notification email
        try {
          if (verification.email) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
              const response = await fetch('/api/notifications/send', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                  type: 'VET_APPROVED',
                  to: verification.email,
                  data: {
                    fullName: verification.full_name,
                    adminRemarks: remarks.trim() || null
                  }
                })
              });
              
              if (response.ok) {
                console.log('Approval email sent successfully');
              } else {
                console.warn('Failed to send approval email:', await response.text());
              }
            }
          }
        } catch (emailError) {
          console.warn('Failed to send approval email:', emailError);
        }
      }

      alert('Veterinarian application approved successfully!');
      await fetchVerifications();
      setShowModal(false);
      setSelectedVerification(null);

    } catch (error: any) {
      console.error('Error approving verification:', error);
      alert('Failed to approve application: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectVerification = async (verificationId: string) => {
    if (!userProfile?.id || !remarks.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    setActionLoading(true);
    try {
      // Update verification status
      const { error: verificationError } = await supabase
        .from('veterinarian_applications')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: userProfile.id,
          rejection_reason: remarks.trim()
        })
        .eq('id', verificationId);

      if (verificationError) {
        throw verificationError;
      }

      // Update user profile
      const verification = verifications.find(v => v.id === verificationId);
      if (verification) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            verification_status: 'rejected'
          })
          .eq('email', verification.email);

        if (profileError) {
          console.error('Error updating profile:', profileError);
        }
        
        // Send rejection notification email
        try {
          if (verification.email) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
              const response = await fetch('/api/notifications/send', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                  type: 'VET_REJECTED',
                  to: verification.email,
                  data: {
                    fullName: verification.full_name,
                    adminRemarks: remarks.trim()
                  }
                })
              });
              
              if (response.ok) {
                console.log('Rejection email sent successfully');
              } else {
                console.warn('Failed to send rejection email:', await response.text());
              }
            }
          }
        } catch (emailError) {
          console.warn('Failed to send rejection email:', emailError);
        }
      }

      alert('Veterinarian application rejected with remarks.');
      await fetchVerifications();
      setShowModal(false);
      setSelectedVerification(null);

    } catch (error: any) {
      console.error('Error rejecting verification:', error);
      alert('Failed to reject application: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-800 bg-green-100';
      case 'rejected':
        return 'text-red-800 bg-red-100';
      case 'pending':
      default:
        return 'text-yellow-800 bg-yellow-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'rejected':
        return <XCircleIcon className="w-4 h-4" />;
      case 'pending':
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  const filteredVerifications = verifications.filter(v => 
    filter === 'all' ? true : v.status === filter
  );

  const stats = {
    total: verifications.length,
    pending: verifications.filter(v => v.status === 'pending').length,
    approved: verifications.filter(v => v.status === 'approved').length,
    rejected: verifications.filter(v => v.status === 'rejected').length
  };

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Veterinarian Verifications
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                  Review and manage veterinarian registration applications
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <ShieldCheckIcon className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-gray-100">
                  <UserGroupIcon className="w-6 h-6 text-gray-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">{stats.total}</h3>
                  <p className="text-sm text-gray-600">Total Applications</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100">
                  <ClockIcon className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">{stats.pending}</h3>
                  <p className="text-sm text-gray-600">Pending Review</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">{stats.approved}</h3>
                  <p className="text-sm text-gray-600">Approved</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100">
                  <XCircleIcon className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">{stats.rejected}</h3>
                  <p className="text-sm text-gray-600">Rejected</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex space-x-4">
                {['all', 'pending', 'approved', 'rejected'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status as any)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      filter === status
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Verifications Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Applications ({filteredVerifications.length})
              </h3>
            </div>
            
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading verifications...</p>
              </div>
            ) : filteredVerifications.length === 0 ? (
              <div className="p-8 text-center">
                <ExclamationTriangleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No applications found</h4>
                <p className="text-gray-600">No veterinarian applications match the current filter.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {filteredVerifications.map((verification) => (
                  <li key={verification.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            <h4 className="text-lg font-medium text-gray-900 truncate">
                              {verification.full_name}
                            </h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(verification.verification_status)}`}>
                              {getStatusIcon(verification.verification_status)}
                              <span className="ml-1">{verification.verification_status}</span>
                            </span>
                          </div>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            <span>{verification.email}</span>
                            <span>•</span>
                            <span>{verification.specialization}</span>
                            <span>•</span>
                            <span>License: {verification.license_number}</span>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            Submitted: {new Date(verification.submitted_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewVerification(verification)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <EyeIcon className="w-4 h-4 mr-2" />
                          Review
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Verification Modal */}
        {showModal && selectedVerification && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    Veterinarian Application Review
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Application Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Full Name</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedVerification.full_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedVerification.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedVerification.phone}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Specialization</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedVerification.specialization}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">License Number</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedVerification.license_number}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedVerification.years_experience}</p>
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="space-y-3">
                    <h4 className="text-md font-medium text-gray-900">Uploaded Documents</h4>
                    <div className="flex space-x-4">
                      <a
                        href={`/api/documents/view?path=${selectedVerification.business_permit_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <DocumentTextIcon className="w-4 h-4 mr-2" />
                        Business Permit
                      </a>
                      <a
                        href={`/api/documents/view?path=${selectedVerification.government_id_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <DocumentTextIcon className="w-4 h-4 mr-2" />
                        Government ID
                      </a>
                    </div>
                  </div>

                  {/* Admin Remarks */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Remarks
                    </label>
                    <textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add your remarks here..."
                    />
                  </div>

                  {/* Actions */}
                  {selectedVerification.verification_status === 'pending' && (
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        onClick={() => handleRejectVerification(selectedVerification.id)}
                        disabled={actionLoading}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        <XCircleIcon className="w-4 h-4 mr-2" />
                        {actionLoading ? 'Processing...' : 'Reject'}
                      </button>
                      <button
                        onClick={() => handleApproveVerification(selectedVerification.id)}
                        disabled={actionLoading}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                        {actionLoading ? 'Processing...' : 'Approve'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
