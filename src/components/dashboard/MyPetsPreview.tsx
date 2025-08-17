'use client';

import Link from 'next/link';
import { differenceInYears, parseISO } from 'date-fns';
import {
    HeartIcon,
    PlusIcon,
    ChevronRightIcon,
    ShieldCheckIcon
} from '@heroicons/react/24/outline';

interface MyPetsPreviewProps {
    pets: any[];
    loading: boolean;
}

export default function MyPetsPreview({ pets, loading }: MyPetsPreviewProps) {
    const calculateAge = (birthDate: string) => {
        if (!birthDate) return 'Unknown';
        const age = differenceInYears(new Date(), parseISO(birthDate));
        return age === 0 ? '< 1 year' : `${age} year${age > 1 ? 's' : ''}`;
    };

    const getSpeciesEmoji = (species: string) => {
        switch (species?.toLowerCase()) {
            case 'dog':
                return '🐕';
            case 'cat':
                return '🐱';
            case 'bird':
                return '🐦';
            case 'rabbit':
                return '🐰';
            case 'hamster':
                return '🐹';
            case 'fish':
                return '🐠';
            default:
                return '🐾';
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="border border-gray-100 rounded-xl p-4">
                                <div className="w-12 h-12 bg-gray-200 rounded-full mb-3"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">My Pets</h2>
                <Link
                    href="/dashboard/pets"
                    className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center"
                >
                    View all
                    <ChevronRightIcon className="w-4 h-4 ml-1" />
                </Link>
            </div>

            {pets.length === 0 ? (
                <div className="text-center py-8">
                    <HeartIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">No pets registered yet</p>
                    <Link
                        href="/dashboard/pets/add"
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-teal-500 to-lime-500 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all duration-200"
                    >
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Add Your First Pet
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {pets.map((pet) => (
                        <Link
                            key={pet.id}
                            href={`/dashboard/pets/${pet.id}`}
                            className="group border border-gray-100 rounded-xl p-4 hover:border-gray-200 hover:shadow-md transition-all duration-200 hover:-translate-y-1"
                        >
                            <div className="text-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-lime-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200">
                                    <span className="text-2xl">
                                        {getSpeciesEmoji(pet.species)}
                                    </span>
                                </div>

                                <h3 className="font-medium text-gray-800 mb-1 truncate">
                                    {pet.name}
                                </h3>

                                <div className="text-xs text-gray-500 space-y-1">
                                    <p>{pet.species} • {calculateAge(pet.date_of_birth)}</p>
                                    {pet.breed && <p className="truncate">{pet.breed}</p>}
                                </div>

                                {/* Vaccination Status */}
                                <div className="mt-3 flex items-center justify-center">
                                    <div className="flex items-center text-xs">
                                        <ShieldCheckIcon className="w-3 h-3 text-green-500 mr-1" />
                                        <span className="text-green-600">Up to date</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}

                    {pets.length < 4 && (
                        <Link
                            href="/dashboard/pets/add"
                            className="group border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-teal-300 hover:bg-teal-50 transition-all duration-200 flex flex-col items-center justify-center min-h-[140px]"
                        >
                            <div className="w-12 h-12 bg-gray-100 group-hover:bg-teal-100 rounded-full flex items-center justify-center mb-2 transition-colors duration-200">
                                <PlusIcon className="w-6 h-6 text-gray-400 group-hover:text-teal-600" />
                            </div>
                            <span className="text-sm text-gray-500 group-hover:text-teal-600 font-medium">
                                Add Pet
                            </span>
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
