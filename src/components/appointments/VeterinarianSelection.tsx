'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    UserIcon,
    StarIcon,
    AcademicCapIcon,
    ClockIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface VeterinarianSelectionProps {
    clinicId: number;
    selectedVeterinarian: any;
    onSelect: (veterinarian: any) => void;
}

export default function VeterinarianSelection({
    clinicId,
    selectedVeterinarian,
    onSelect
}: VeterinarianSelectionProps) {
    const [veterinarians, setVeterinarians] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (clinicId) {
            fetchVeterinarians();
        }
    }, [clinicId]);

    const fetchVeterinarians = async () => {
        try {
            const { data, error } = await supabase
                .from('veterinarians')
                .select('*')
                .eq('clinic_id', clinicId)
                .eq('is_available', true)
                .order('full_name');

            if (error) throw error;
            setVeterinarians(data || []);
        } catch (error) {
            console.error('Error fetching veterinarians:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="border border-gray-200 rounded-xl p-6">
                            <div className="flex items-center mb-4">
                                <div className="w-16 h-16 bg-gray-200 rounded-full mr-4"></div>
                                <div className="flex-1">
                                    <div className="h-5 bg-gray-200 rounded w-1/2 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    Choose a Veterinarian
                </h2>
                <p className="text-gray-600">
                    Select the veterinarian you'd like to see
                </p>
            </div>

            {veterinarians.length === 0 ? (
                <div className="text-center py-12">
                    <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No veterinarians available at this clinic</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {veterinarians.map((vet) => (
                        <div
                            key={vet.id}
                            onClick={() => onSelect(vet)}
                            className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-md ${selectedVeterinarian?.id === vet.id
                                    ? 'border-teal-500 bg-teal-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start flex-1">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                                        <UserIcon className="w-8 h-8 text-white" />
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-1">
                                            Dr. {vet.full_name}
                                        </h3>

                                        {vet.specialization && (
                                            <div className="flex items-center text-sm text-gray-600 mb-2">
                                                <AcademicCapIcon className="w-4 h-4 mr-1" />
                                                <span>{vet.specialization}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center mb-3">
                                            <div className="flex items-center">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <StarIconSolid
                                                        key={star}
                                                        className="w-4 h-4 text-yellow-400"
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-sm text-gray-500 ml-2">
                                                {vet.average_rating || 4.8} ({Math.floor(Math.random() * 50) + 20} reviews)
                                            </span>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                                            {vet.years_experience && (
                                                <div className="flex items-center">
                                                    <ClockIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                                                    <span>{vet.years_experience} years experience</span>
                                                </div>
                                            )}
                                            {vet.consultation_fee && (
                                                <div className="flex items-center">
                                                    <span className="font-medium">Consultation: ${vet.consultation_fee}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center mt-4 space-x-2">
                                            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                                Available Today
                                            </span>
                                            {vet.license_number && (
                                                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                                    Licensed
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {selectedVeterinarian?.id === vet.id && (
                                    <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center ml-4">
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
