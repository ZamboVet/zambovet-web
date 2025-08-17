'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PetCard from '@/components/pets/PetCard';
import { supabase } from '@/lib/supabase';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    FunnelIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function PetsPage() {
    const { userProfile } = useAuth();
    const [pets, setPets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSpecies, setSelectedSpecies] = useState('all');

    useEffect(() => {
        if (userProfile?.roleProfile?.id) {
            fetchPets();
        }
    }, [userProfile]);

    const fetchPets = async () => {
        try {
            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .eq('owner_id', userProfile?.roleProfile?.id)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPets(data || []);
        } catch (error) {
            console.error('Error fetching pets:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredPets = pets.filter(pet => {
        const matchesSearch = pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pet.breed?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSpecies = selectedSpecies === 'all' || pet.species.toLowerCase() === selectedSpecies;
        return matchesSearch && matchesSpecies;
    });

    const uniqueSpecies = [...new Set(pets.map(pet => pet.species))];

    return (
        <ProtectedRoute requiredRole="pet_owner">
            <DashboardLayout>
                <div className="min-h-screen bg-[#faf9f7] p-4 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">
                                    My Pets
                                </h1>
                                <p className="text-gray-600">
                                    Manage your pets' profiles and health records
                                </p>
                            </div>
                            <Link
                                href="/dashboard/pets/add"
                                className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-gradient-to-r from-teal-500 to-lime-500 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
                            >
                                <PlusIcon className="w-5 h-5 mr-2" />
                                Add Pet
                            </Link>
                        </div>

                        {/* Search and Filter */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search pets by name or breed..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                                    />
                                </div>
                                <div className="relative">
                                    <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <select
                                        value={selectedSpecies}
                                        onChange={(e) => setSelectedSpecies(e.target.value)}
                                        className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-white"
                                    >
                                        <option value="all">All Species</option>
                                        {uniqueSpecies.map(species => (
                                            <option key={species} value={species.toLowerCase()}>
                                                {species}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Pets Grid */}
                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {[1, 2, 3, 4].map((i) => (
                                    <div
                                        key={i}
                                        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse"
                                    >
                                        <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4"></div>
                                        <div className="h-5 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                                        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
                                        <div className="space-y-2">
                                            <div className="h-3 bg-gray-200 rounded"></div>
                                            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredPets.length === 0 ? (
                            <div className="text-center py-12">
                                {pets.length === 0 ? (
                                    <>
                                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <span className="text-4xl">🐾</span>
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                            No pets registered yet
                                        </h3>
                                        <p className="text-gray-600 mb-6">
                                            Add your first pet to start managing their health records and appointments.
                                        </p>
                                        <Link
                                            href="/dashboard/pets/add"
                                            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-teal-500 to-lime-500 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
                                        >
                                            <PlusIcon className="w-5 h-5 mr-2" />
                                            Add Your First Pet
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <MagnifyingGlassIcon className="w-12 h-12 text-gray-400" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                            No pets found
                                        </h3>
                                        <p className="text-gray-600">
                                            Try adjusting your search or filter criteria.
                                        </p>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredPets.map((pet) => (
                                    <PetCard key={pet.id} pet={pet} onUpdate={fetchPets} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
