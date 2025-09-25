'use client';

import { useState } from 'react';
import {
    DocumentTextIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';

interface ReasonFormProps {
    reason: string;
    symptoms: string;
    notes: string;
    onChange: (data: { reason: string; symptoms: string; notes: string }) => void;
}

export default function ReasonForm({ reason, symptoms, notes, onChange }: ReasonFormProps) {
    const commonReasons = [
        'Regular checkup',
        'Vaccination',
        'Illness/Not feeling well',
        'Injury',
        'Behavioral issues',
        'Dental care',
        'Grooming',
        'Follow-up visit',
        'Emergency',
        'Other'
    ];

    const handleReasonSelect = (selectedReason: string) => {
        onChange({ reason: selectedReason, symptoms, notes });
    };

    const handleInputChange = (field: string, value: string) => {
        onChange({
            reason,
            symptoms,
            notes,
            [field]: value
        });
    };

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    Appointment Details
                </h2>
                <p className="text-gray-600">
                    Tell us about the reason for your visit and any symptoms
                </p>
            </div>

            <div className="space-y-6">
                {/* Reason for Visit */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Reason for Visit *
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {commonReasons.map((reasonOption) => (
                            <button
                                key={reasonOption}
                                type="button"
                                onClick={() => handleReasonSelect(reasonOption)}
                                className={`p-3 text-sm font-medium rounded-lg border-2 transition-all duration-200 text-left ${reason === reasonOption
                                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                                        : 'border-gray-200 text-gray-700 hover:border-teal-300 hover:bg-teal-50'
                                    }`}
                            >
                                {reasonOption}
                            </button>
                        ))}
                    </div>

                    {reason === 'Other' && (
                        <div className="mt-4">
                            <input
                                type="text"
                                placeholder="Please specify the reason"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                                onChange={(e) => handleInputChange('reason', e.target.value)}
                            />
                        </div>
                    )}
                </div>

                {/* Symptoms */}
                <div>
                    <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center">
                            <ExclamationTriangleIcon className="w-4 h-4 mr-2 text-orange-500" />
                            Current Symptoms (if any)
                        </div>
                    </label>
                    <textarea
                        id="symptoms"
                        rows={4}
                        value={symptoms}
                        onChange={(e) => handleInputChange('symptoms', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 resize-none"
                        placeholder="Describe any symptoms your pet is experiencing (e.g., loss of appetite, lethargy, vomiting, limping, etc.)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Be as specific as possible to help the veterinarian prepare for your visit
                    </p>
                </div>

                {/* Additional Notes */}
                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center">
                            <InformationCircleIcon className="w-4 h-4 mr-2 text-blue-500" />
                            Additional Notes (Optional)
                        </div>
                    </label>
                    <textarea
                        id="notes"
                        rows={3}
                        value={notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 resize-none"
                        placeholder="Any additional information you'd like the veterinarian to know (e.g., recent changes in behavior, diet, medications, etc.)"
                    />
                </div>

                {/* Emergency Notice */}
                {reason === 'Emergency' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex">
                            <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">
                                    Emergency Appointment
                                </h3>
                                <p className="text-sm text-red-700 mt-1">
                                    For life-threatening emergencies, please call the clinic directly or visit the nearest emergency veterinary hospital.
                                    This booking system is for urgent but non-life-threatening situations.
                                </p>
                                <p className="text-sm font-medium text-red-800 mt-2">
                                    Emergency Hotline: (555) 123-EMERGENCY
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Helpful Tips */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex">
                        <InformationCircleIcon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">
                                Preparing for Your Visit
                            </h3>
                            <ul className="text-sm text-blue-700 mt-2 space-y-1">
                                <li>• Bring any previous medical records or test results</li>
                                <li>• List current medications and supplements</li>
                                <li>• Note when symptoms first appeared</li>
                                <li>• Bring a list of questions you want to ask</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
