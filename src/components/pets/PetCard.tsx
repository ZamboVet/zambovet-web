'use client';

import Link from 'next/link';
import { useState } from 'react';
import { differenceInYears, parseISO } from 'date-fns';
import {
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';

interface PetCardProps {
  pet: any;
  onUpdate: () => void;
}

export default function PetCard({ pet, onUpdate }: PetCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 'Unknown age';
    const age = differenceInYears(new Date(), parseISO(birthDate));
    return age === 0 ? '< 1 year old' : `${age} year${age > 1 ? 's' : ''} old`;
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

  const getVaccinationStatus = () => {
    // This would normally check vaccination records
    // For now, we'll simulate based on age
    const records = pet.vaccination_records || [];
    if (records.length === 0) {
      return { status: 'overdue', text: 'Needs vaccines', color: 'text-red-600 bg-red-100' };
    }
    return { status: 'up-to-date', text: 'Up to date', color: 'text-green-600 bg-green-100' };
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to remove ${pet.name} from your pets?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('patients')
        .update({ is_active: false })
        .eq('id', pet.id);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error deleting pet:', error);
      alert('Failed to remove pet. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };

  const vaccinationStatus = getVaccinationStatus();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 relative">
      {/* Menu Button */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <EllipsisVerticalIcon className="w-5 h-5 text-gray-400" />
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
            <Link
              href={`/dashboard/pets/${pet.id}/edit`}
              className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setShowMenu(false)}
            >
              <PencilIcon className="w-4 h-4 mr-2" />
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              {isDeleting ? 'Removing...' : 'Remove'}
            </button>
          </div>
        )}
      </div>

      <Link href={`/dashboard/pets/${pet.id}`} className="block">
        {/* Pet Avatar */}
        <div className="text-center mb-4">
          <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-lime-100 rounded-full flex items-center justify-center mx-auto mb-3 hover:scale-110 transition-transform duration-200">
            <span className="text-3xl">
              {getSpeciesEmoji(pet.species)}
            </span>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            {pet.name}
          </h3>
          
          <p className="text-sm text-gray-600">
            {pet.breed ? `${pet.breed} • ` : ''}{calculateAge(pet.date_of_birth)}
          </p>
        </div>

        {/* Pet Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Species:</span>
            <span className="font-medium text-gray-800 capitalize">{pet.species}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Gender:</span>
            <span className="font-medium text-gray-800 capitalize">{pet.gender || 'Not specified'}</span>
          </div>
          
          {pet.weight && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Weight:</span>
              <span className="font-medium text-gray-800">{pet.weight} kg</span>
            </div>
          )}

          {/* Vaccination Status */}
          <div className="pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Vaccinations:</span>
              <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${vaccinationStatus.color}`}>
                {vaccinationStatus.status === 'up-to-date' ? (
                  <ShieldCheckIcon className="w-3 h-3 mr-1" />
                ) : (
                  <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                )}
                {vaccinationStatus.text}
              </div>
            </div>
          </div>

          {/* Medical Conditions */}
          {pet.medical_conditions && pet.medical_conditions.length > 0 && (
            <div className="pt-2">
              <span className="text-sm text-gray-600">Conditions:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {pet.medical_conditions.slice(0, 2).map((condition: string, index: number) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full"
                  >
                    {condition}
                  </span>
                ))}
                {pet.medical_conditions.length > 2 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    +{pet.medical_conditions.length - 2} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}