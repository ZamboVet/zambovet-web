'use client';

import Link from 'next/link';
import {
  BuildingOffice2Icon,
  MapPinIcon,
  PhoneIcon,
  StarIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface NearbyClinicsProps {
  clinics: any[];
  loading: boolean;
}

export default function NearbyClinics({ clinics, loading }: NearbyClinicsProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-4">
                <div className="h-5 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
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
        <h2 className="text-lg font-semibold text-gray-800">Nearby Clinics</h2>
        <Link
          href="/dashboard/clinics"
          className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center"
        >
          View all
          <ChevronRightIcon className="w-4 h-4 ml-1" />
        </Link>
      </div>

      {clinics.length === 0 ? (
        <div className="text-center py-8">
          <BuildingOffice2Icon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No clinics found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {clinics.slice(0, 3).map((clinic) => (
            <Link
              key={clinic.id}
              href={`/dashboard/clinics/${clinic.id}`}
              className="block border border-gray-100 rounded-xl p-4 hover:border-gray-200 hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-lime-400 rounded-lg flex items-center justify-center mr-3">
                      <BuildingOffice2Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">{clinic.name}</h3>
                      <div className="flex items-center mt-1">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <StarIconSolid
                              key={star}
                              className="w-3 h-3 text-yellow-400"
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500 ml-1">4.8 (124 reviews)</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPinIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{clinic.address}</span>
                    </div>
                    {clinic.phone && (
                      <div className="flex items-center">
                        <PhoneIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>{clinic.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center mt-3 space-x-2">
                    {clinic.is_emergency_available && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                        24/7 Emergency
                      </span>
                    )}
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      Open Now
                    </span>
                  </div>
                </div>

                <ChevronRightIcon className="w-5 h-5 text-gray-400 ml-4" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}