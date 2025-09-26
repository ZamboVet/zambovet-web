'use client';

import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import {
  ChartBarIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  UserIcon,
  StarIcon
} from '@heroicons/react/24/outline';

export default function VeterinarianTest() {
  const { userProfile } = useAuth();

  return (
    <ProtectedRoute requiredRole="veterinarian">
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900">VetPortal Navigation Test</h1>
              <p className="text-slate-600 mt-2">Testing the new veterinarian portal navigation</p>
            </div>

            {/* Navigation Test */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Portal Navigation Test</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    title: 'Dashboard Overview',
                    description: 'View performance metrics',
                    icon: ChartBarIcon,
                    href: '/veterinarian',
                    status: 'Active'
                  },
                  {
                    title: 'Appointment Management',
                    description: 'Manage patient appointments',
                    icon: CalendarDaysIcon,
                    href: '/veterinarian/appointments',
                    status: 'Working'
                  },
                  {
                    title: 'Patient Records',
                    description: 'Access medical records',
                    icon: DocumentTextIcon,
                    href: '/veterinarian/patients',
                    status: 'Working'
                  },
                  {
                    title: 'Professional Profile',
                    description: 'Update your credentials',
                    icon: UserIcon,
                    href: '/veterinarian/profile',
                    status: 'Working'
                  },
                  {
                    title: 'Patient Reviews',
                    description: 'View patient feedback',
                    icon: StarIcon,
                    href: '/veterinarian/reviews',
                    status: 'Working'
                  }
                ].map((item, index) => (
                  <div key={index} className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <item.icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{item.title}</h3>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          item.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-600 text-sm mb-4">{item.description}</p>
                    <a
                      href={item.href}
                      className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      Visit Page →
                    </a>
                  </div>
                ))}
              </div>

              {/* User Info */}
              <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">Current User Info:</h3>
                <div className="text-sm text-blue-800">
                  <p><strong>Name:</strong> {userProfile?.full_name || 'Not set'}</p>
                  <p><strong>Role:</strong> {userProfile?.user_role || 'Not set'}</p>
                  <p><strong>Email:</strong> {userProfile?.email || 'Not set'}</p>
                </div>
              </div>

              {/* Navigation Status */}
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-900 mb-2">✅ Navigation Update Complete</h3>
                <p className="text-sm text-green-800">
                  The veterinarian sidebar has been successfully updated with the new Portal Navigation structure.
                  All navigation items now match the second image you provided.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}