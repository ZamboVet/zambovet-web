'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ExclamationTriangleIcon,
  PhoneIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function EmergencyButton() {
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const router = useRouter();

  const handleEmergencyCall = () => {
    // In a real app, this would initiate a call
    window.location.href = 'tel:+1-555-EMERGENCY';
  };

  const handleEmergencyRequest = () => {
    setShowEmergencyModal(false);
    router.push('/dashboard/emergency/request');
  };

  return (
    <>
      {/* Floating Emergency Button */}
      <button
        onClick={() => setShowEmergencyModal(true)}
        className="fixed bottom-24 lg:bottom-8 right-4 w-14 h-14 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-40 animate-pulse"
        aria-label="Emergency"
      >
        <ExclamationTriangleIcon className="w-7 h-7" />
      </button>

      {/* Emergency Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          {/* Enhanced Background with Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/90 via-orange-600/85 to-red-700/90 backdrop-blur-lg">
            {/* Additional Background Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(255,119,119,0.3)_0%,transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,69,0,0.3)_0%,transparent_50%)]"></div>
            
            {/* Emergency Icons */}
            <div className="absolute top-10 left-10 opacity-20 animate-pulse">
              <span className="text-4xl">��</span>
            </div>
            <div className="absolute top-20 right-20 opacity-20 animate-pulse" style={{animationDelay: '0.5s'}}>
              <span className="text-3xl">⚡</span>
            </div>
            <div className="absolute bottom-20 left-20 opacity-20 animate-pulse" style={{animationDelay: '1s'}}>
              <span className="text-3xl">🏥</span>
            </div>
            <div className="absolute bottom-10 right-10 opacity-20 animate-pulse" style={{animationDelay: '0.3s'}}>
              <span className="text-4xl">🚑</span>
            </div>
            
            {/* Additional Decorative Elements */}
            <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
            <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-white/40 rounded-full animate-pulse"></div>
            <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-white/25 rounded-full animate-ping" style={{animationDelay: '0.7s'}}></div>
          </div>
          
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600 flex items-center">
                <ExclamationTriangleIcon className="w-6 h-6 mr-2" />
                Emergency
              </h3>
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              Is your pet experiencing a medical emergency? Choose the best option below:
            </p>

            <div className="space-y-3">
              <button
                onClick={handleEmergencyCall}
                className="w-full flex items-center justify-center px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
              >
                <PhoneIcon className="w-5 h-5 mr-2" />
                Call Emergency Line
              </button>

              <button
                onClick={handleEmergencyRequest}
                className="w-full flex items-center justify-center px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
              >
                <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                Request Emergency Visit
              </button>

              <button
                onClick={() => setShowEmergencyModal(false)}
                className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                <strong>For life-threatening emergencies:</strong> Call 911 or go to the nearest emergency animal hospital immediately.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}