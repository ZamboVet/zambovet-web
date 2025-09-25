'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ArrowRightOnRectangleIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

interface VerificationStatus {
  id: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  admin_remarks?: string;
  full_name: string;
  specialization?: string;
  license_number: string;
}

export default function PendingVerificationPage() {
  const { user, signOut } = useAuth();
  const [verificationData, setVerificationData] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchVerificationStatus();
    }
  }, [user]);

  const fetchVerificationStatus = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('veterinarian_verifications')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching verification status:', error);
        return;
      }

      setVerificationData(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading verification status...</p>
        </div>
      </div>
    );
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: <ClockIcon className="w-16 h-16 text-yellow-500" />,
          title: 'Verification in Progress',
          description: 'Your veterinarian application is being reviewed by our administrative team.',
          color: 'yellow'
        };
      case 'approved':
        return {
          icon: <CheckCircleIcon className="w-16 h-16 text-green-500" />,
          title: 'Account Approved!',
          description: 'Congratulations! Your veterinarian account has been approved.',
          color: 'green'
        };
      case 'rejected':
        return {
          icon: <XCircleIcon className="w-16 h-16 text-red-500" />,
          title: 'Additional Information Required',
          description: 'Your application requires some corrections or additional information.',
          color: 'red'
        };
      default:
        return {
          icon: <ExclamationTriangleIcon className="w-16 h-16 text-gray-500" />,
          title: 'Status Unknown',
          description: 'Unable to determine verification status.',
          color: 'gray'
        };
    }
  };

  const statusInfo = getStatusInfo(verificationData?.verification_status || 'pending');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <HeartIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">ZamboVet</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          {statusInfo.icon}
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            {statusInfo.title}
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            {statusInfo.description}
          </p>
        </div>

        {verificationData && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Application Status</h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Application Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Veterinarian Name</label>
                  <p className="mt-1 text-sm text-gray-900">{verificationData.full_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">License Number</label>
                  <p className="mt-1 text-sm text-gray-900">{verificationData.license_number}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Specialization</label>
                  <p className="mt-1 text-sm text-gray-900">{verificationData.specialization || 'General Practice'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Application Submitted</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(verificationData.submitted_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {/* Status-specific content */}
              {verificationData.verification_status === 'pending' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <ClockIcon className="flex-shrink-0 w-5 h-5 text-yellow-400 mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">What happens next?</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <ul className="list-disc list-inside space-y-1">
                          <li>Our administrative team is reviewing your submitted documents</li>
                          <li>Verification typically takes 2-3 business days</li>
                          <li>You will receive an email notification once the review is complete</li>
                          <li>Please ensure your email notifications are enabled</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {verificationData.verification_status === 'approved' && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex">
                    <CheckCircleIcon className="flex-shrink-0 w-5 h-5 text-green-400 mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Congratulations!</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>Your veterinarian account has been approved. You can now access the full veterinarian dashboard and start managing appointments.</p>
                        {verificationData.reviewed_at && (
                          <p className="mt-2">
                            <strong>Approved on:</strong> {new Date(verificationData.reviewed_at).toLocaleDateString()}
                          </p>
                        )}
                        {verificationData.admin_remarks && (
                          <div className="mt-2">
                            <strong>Admin Notes:</strong>
                            <p className="mt-1 text-green-600">{verificationData.admin_remarks}</p>
                          </div>
                        )}
                      </div>
                      <div className="mt-4">
                        <Link
                          href="/veterinarian"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Access Dashboard
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {verificationData.verification_status === 'rejected' && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <XCircleIcon className="flex-shrink-0 w-5 h-5 text-red-400 mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Application Requires Attention</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>Your application has been reviewed and requires some corrections or additional information before approval.</p>
                        {verificationData.reviewed_at && (
                          <p className="mt-2">
                            <strong>Reviewed on:</strong> {new Date(verificationData.reviewed_at).toLocaleDateString()}
                          </p>
                        )}
                        {verificationData.admin_remarks && (
                          <div className="mt-3 bg-red-100 p-3 rounded">
                            <strong>Admin Feedback:</strong>
                            <p className="mt-1">{verificationData.admin_remarks}</p>
                          </div>
                        )}
                        <div className="mt-4">
                          <h4 className="font-medium">Next Steps:</h4>
                          <ol className="mt-2 list-decimal list-inside space-y-1">
                            <li>Review the feedback provided above</li>
                            <li>Prepare the required documents or corrections</li>
                            <li>Submit a new application with the updated information</li>
                          </ol>
                        </div>
                      </div>
                      <div className="mt-4">
                        <Link
                          href="/signup"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Submit New Application
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                  <DocumentTextIcon className="flex-shrink-0 w-5 h-5 text-blue-400 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Need Help?</h3>
                    <p className="mt-1 text-sm text-blue-700">
                      If you have questions about the verification process or need assistance, please contact our support team.
                    </p>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>📧 Email: support@zambovet.com</p>
                      <p>📞 Phone: (123) 456-7890</p>
                      <p>⏰ Hours: Monday - Friday, 8:00 AM - 5:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
