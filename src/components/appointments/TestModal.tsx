'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';

interface TestModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointmentId: number;
}

export default function TestModal({ isOpen, onClose, appointmentId }: TestModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 backdrop-blur-md bg-white/20 flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-md w-full p-6 shadow-2xl border border-white/20">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Test Modal</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <XMarkIcon className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
                
                <div className="space-y-4">
                    <p className="text-gray-600">
                        This is a test modal for appointment #{appointmentId}
                    </p>
                    
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                            Close
                        </button>
                        <button
                            onClick={() => alert('Modal button clicked!')}
                            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Test Action
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}