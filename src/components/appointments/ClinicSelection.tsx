'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';

interface ClinicSelectionProps {
  clinics: any[];
  selectedClinic: any;
  onSelect: (clinic: any) => void;
}

export default function ClinicSelection({ clinics, selectedClinic, onSelect }: ClinicSelectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredClinics = clinics.filter(clinic => 
    clinic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (clinic.address && clinic.address.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Select a Clinic</h2>
      
      {/* Search input */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
          placeholder="Search clinics by name or location"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {/* Clinics list */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredClinics.length > 0 ? (
          filteredClinics.map((clinic) => (
            <div
              key={clinic.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedClinic?.id === clinic.id
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
              }`}
              onClick={() => onSelect(clinic)}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 p-2 bg-teal-100 rounded-lg">
                  <BuildingOffice2Icon className="h-6 w-6 text-teal-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{clinic.name}</h3>
                  <p className="text-sm text-gray-500">{clinic.address}</p>
                  {clinic.phone && <p className="text-sm text-gray-500">{clinic.phone}</p>}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center py-8">
            <p className="text-gray-500">No clinics found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}