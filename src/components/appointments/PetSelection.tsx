'use client';

import { differenceInYears, parseISO } from 'date-fns';

interface PetSelectionProps {
  pets: any[];
  selectedPet: any;
  onSelect: (pet: any) => void;
}

export default function PetSelection({ pets, selectedPet, onSelect }: PetSelectionProps) {
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

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Select Your Pet
        </h2>
        <p className="text-gray-600">
          Choose which pet this appointment is for
        </p>
      </div>

      {pets.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🐾</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            No pets registered
          </h3>
          <p className="text-gray-600 mb-6">
            You need to add a pet before booking an appointment.
          </p>
          <a
            href="/dashboard/pets/add"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-teal-500 to-lime-500 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
          >
            Add Your First Pet
          </a>
        </div>
      ) : (
        <div className="grid gap-4">
          {pets.map((pet) => (
            <div
              key={pet.id}
              onClick={() => onSelect(pet)}
              className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedPet?.id === pet.id
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-lime-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-3xl">
                      {getSpeciesEmoji(pet.species)}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      {pet.name}
                    </h3>
                    <p className="text-gray-600 mb-2">
                      {pet.breed ? `${pet.breed} • ` : ''}{calculateAge(pet.date_of_birth)}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="capitalize">{pet.species}</span>
                      {pet.gender && (
                        <span className="capitalize">{pet.gender}</span>
                      )}
                      {pet.weight && (
                        <span>{pet.weight} kg</span>
                      )}
                    </div>

                    {pet.medical_conditions && pet.medical_conditions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
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
                    )}
                  </div>
                </div>

                {selectedPet?.id === pet.id && (
                  <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center">
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