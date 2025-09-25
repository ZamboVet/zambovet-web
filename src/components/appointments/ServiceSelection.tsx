'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  HeartIcon,
  ShieldCheckIcon,
  ScissorsIcon,
  EyeIcon,
  ClockIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

interface ServiceSelectionProps {
  clinicId: number;
  selectedService: any;
  onSelect: (service: any) => void;
}

export default function ServiceSelection({ 
  clinicId, 
  selectedService, 
  onSelect 
}: ServiceSelectionProps) {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clinicId) {
      fetchServices();
    }
  }, [clinicId]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const getServiceIcon = (serviceName: string) => {
    const name = serviceName.toLowerCase();
    if (name.includes('checkup') || name.includes('consultation')) {
      return HeartIcon;
    } else if (name.includes('vaccination') || name.includes('vaccine')) {
      return ShieldCheckIcon;
    } else if (name.includes('grooming') || name.includes('nail')) {
      return ScissorsIcon;
    } else if (name.includes('eye') || name.includes('dental')) {
      return EyeIcon;
    }
    return HeartIcon;
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="grid gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg mr-4"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
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
          Select a Service
        </h2>
        <p className="text-gray-600">
          Choose the type of service you need for your pet
        </p>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-12">
          <HeartIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No services available at this clinic</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {services.map((service) => {
            const IconComponent = getServiceIcon(service.name);
            return (
              <div
                key={service.id}
                onClick={() => onSelect(service)}
                className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedService?.id === service.id
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-lime-400 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        {service.name}
                      </h3>
                      
                      {service.description && (
                        <p className="text-gray-600 mb-4">
                          {service.description}
                        </p>
                      )}

                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        {service.duration_minutes && (
                          <div className="flex items-center">
                            <ClockIcon className="w-4 h-4 mr-1" />
                            <span>{service.duration_minutes} minutes</span>
                          </div>
                        )}
                        {service.price && (
                          <div className="flex items-center">
                            <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                            <span className="font-medium">${service.price}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedService?.id === service.id && (
                    <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center ml-4">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}