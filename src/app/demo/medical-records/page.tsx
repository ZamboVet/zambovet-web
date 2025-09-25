'use client';

import { useState } from 'react';
import PatientMedicalRecords from '@/components/medical/PatientMedicalRecords';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { 
  DocumentTextIcon, 
  HeartIcon, 
  PlusIcon,
  ArrowLeftIcon 
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function MedicalRecordsDemo() {
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [customPatientId, setCustomPatientId] = useState<string>('');

  // Sample patient IDs for demonstration
  const samplePatients = [
    { id: '1', name: 'Bella (Dog)', description: 'Golden Retriever with vaccination history' },
    { id: '2', name: 'Whiskers (Cat)', description: 'Persian cat with medical conditions' },
    { id: '3', name: 'Charlie (Rabbit)', description: 'Holland Lop with appointment history' },
  ];

  const handlePatientSelect = (patientId: string) => {
    setSelectedPatientId(patientId);
    setCustomPatientId('');
  };

  const handleCustomPatientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customPatientId.trim()) {
      setSelectedPatientId(customPatientId.trim());
    }
  };

  return (
    <ProtectedRoute requiredRole={["pet_owner", "veterinarian", "admin"]}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-200"
              >
                <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <DocumentTextIcon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Patient Medical Records Demo
                  </h1>
                  <p className="text-gray-600">
                    View comprehensive medical records with real-time updates
                  </p>
                </div>
              </div>
            </div>

            {/* Patient Selection */}
            {!selectedPatientId && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Select a Patient to View Records
                </h2>
                
                {/* Sample Patients */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {samplePatients.map((patient) => (
                    <div
                      key={patient.id}
                      onClick={() => handlePatientSelect(patient.id)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center transition-colors">
                          <HeartIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{patient.name}</p>
                          <p className="text-sm text-gray-500">{patient.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Custom Patient ID */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Or Enter Custom Patient ID
                  </h3>
                  <form onSubmit={handleCustomPatientSubmit} className="flex space-x-3">
                    <input
                      type="text"
                      value={customPatientId}
                      onChange={(e) => setCustomPatientId(e.target.value)}
                      placeholder="Enter patient ID (e.g., 123)"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={!customPatientId.trim()}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      View Records
                    </button>
                  </form>
                </div>

                {/* Feature Highlights */}
                <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    ✨ Features Included
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Real-time data updates</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Comprehensive appointment history</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Medical conditions tracking</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Vaccination records</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Reviews and ratings</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Emergency request history</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Statistical overview</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Role-based access control</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Back Button when viewing records */}
            {selectedPatientId && (
              <div className="mb-6">
                <button
                  onClick={() => {
                    setSelectedPatientId('');
                    setCustomPatientId('');
                  }}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  <span>Back to Patient Selection</span>
                </button>
              </div>
            )}
          </div>

          {/* Medical Records Component */}
          {selectedPatientId && (
            <PatientMedicalRecords 
              patientId={selectedPatientId}
              showActions={true}
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
