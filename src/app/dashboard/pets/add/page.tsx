'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/lib/supabase';
import {
    ArrowLeftIcon,
    PhotoIcon,
    PlusIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function AddPetPage() {
    const router = useRouter();
    const { userProfile } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        species: '',
        breed: '',
        gender: '',
        date_of_birth: '',
        weight: '',
        medical_conditions: [] as string[],
        vaccination_records: [] as any[]
    });

    const [newCondition, setNewCondition] = useState('');

    const species = [
        'Dog', 'Cat', 'Bird', 'Rabbit', 'Hamster', 'Guinea Pig', 'Fish', 'Reptile', 'Other'
    ];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (error) setError('');
    };

    const addMedicalCondition = () => {
        if (newCondition.trim() && !formData.medical_conditions.includes(newCondition.trim())) {
            setFormData(prev => ({
                ...prev,
                medical_conditions: [...prev.medical_conditions, newCondition.trim()]
            }));
            setNewCondition('');
        }
    };

    const removeMedicalCondition = (condition: string) => {
        setFormData(prev => ({
            ...prev,
            medical_conditions: prev.medical_conditions.filter(c => c !== condition)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.name.trim()) {
            setError('Pet name is required');
            return;
        }

        if (!formData.species) {
            setError('Please select a species');
            return;
        }

        setIsLoading(true);

        try {
            const petData = {
                owner_id: userProfile?.roleProfile?.id,
                name: formData.name.trim(),
                species: formData.species,
                breed: formData.breed.trim() || null,
                gender: formData.gender || null,
                date_of_birth: formData.date_of_birth || null,
                weight: formData.weight ? parseFloat(formData.weight) : null,
                medical_conditions: formData.medical_conditions,
                vaccination_records: formData.vaccination_records,
                is_active: true
            };

            const { data, error: insertError } = await supabase
                .from('patients')
                .insert([petData])
                .select()
                .single();

            if (insertError) throw insertError;

            router.push(`/dashboard/pets/${data.id}`);
        } catch (err: any) {
            console.error('Error adding pet:', err);
            setError(err.message || 'Failed to add pet. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ProtectedRoute requiredRole="pet_owner">
            <DashboardLayout>
                <div className="min-h-screen bg-[#faf9f7] p-4 lg:p-8">
                    <div className="max-w-2xl mx-auto">
                        {/* Header */}
                        <div className="flex items-center mb-8">
                            <Link
                                href="/dashboard/pets"
                                className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-200 mr-4"
                            >
                                <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
                            </Link>
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                                    Add New Pet
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    Register your pet to start managing their health records
                                </p>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <XMarkIcon className="h-5 w-5 text-red-400" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-800">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Basic Information */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h2 className="text-lg font-semibold text-gray-800 mb-6">Basic Information</h2>

                                {/* Pet Photo Upload */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Pet Photo (Optional)
                                    </label>
                                    <div className="flex items-center justify-center w-32 h-32 mx-auto border-2 border-dashed border-gray-300 rounded-full hover:border-gray-400 transition-colors cursor-pointer">
                                        <div className="text-center">
                                            <PhotoIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                            <span className="text-xs text-gray-500">Upload Photo</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Pet Name */}
                                    <div className="md:col-span-2">
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                            Pet Name *
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            required
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                                            placeholder="Enter your pet's name"
                                        />
                                    </div>

                                    {/* Species */}
                                    <div>
                                        <label htmlFor="species" className="block text-sm font-medium text-gray-700 mb-2">
                                            Species *
                                        </label>
                                        <select
                                            id="species"
                                            name="species"
                                            required
                                            value={formData.species}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                                        >
                                            <option value="">Select species</option>
                                            {species.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Breed */}
                                    <div>
                                        <label htmlFor="breed" className="block text-sm font-medium text-gray-700 mb-2">
                                            Breed
                                        </label>
                                        <input
                                            type="text"
                                            id="breed"
                                            name="breed"
                                            value={formData.breed}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                                            placeholder="Enter breed (optional)"
                                        />
                                    </div>

                                    {/* Gender */}
                                    <div>
                                        <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                                            Gender
                                        </label>
                                        <select
                                            id="gender"
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                                        >
                                            <option value="">Select gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                        </select>
                                    </div>

                                    {/* Date of Birth */}
                                    <div>
                                        <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-2">
                                            Date of Birth
                                        </label>
                                        <input
                                            type="date"
                                            id="date_of_birth"
                                            name="date_of_birth"
                                            value={formData.date_of_birth}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                                        />
                                    </div>

                                    {/* Weight */}
                                    <div className="md:col-span-2">
                                        <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
                                            Weight (kg)
                                        </label>
                                        <input
                                            type="number"
                                            id="weight"
                                            name="weight"
                                            step="0.1"
                                            min="0"
                                            value={formData.weight}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                                            placeholder="Enter weight in kilograms"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Medical Information */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h2 className="text-lg font-semibold text-gray-800 mb-6">Medical Information</h2>

                                {/* Medical Conditions */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Medical Conditions
                                    </label>
                                    <div className="flex gap-2 mb-3">
                                        <input
                                            type="text"
                                            value={newCondition}
                                            onChange={(e) => setNewCondition(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMedicalCondition())}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                                            placeholder="Add medical condition"
                                        />
                                        <button
                                            type="button"
                                            onClick={addMedicalCondition}
                                            className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                                        >
                                            <PlusIcon className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {formData.medical_conditions.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {formData.medical_conditions.map((condition, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full"
                                                >
                                                    {condition}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeMedicalCondition(condition)}
                                                        className="ml-2 hover:text-orange-900"
                                                    >
                                                        <XMarkIcon className="w-4 h-4" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-6">
                                <Link
                                    href="/dashboard/pets"
                                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 text-center rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-lime-500 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'Adding Pet...' : 'Add Pet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}
