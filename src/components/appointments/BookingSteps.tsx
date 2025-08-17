'use client';

import { CheckIcon } from '@heroicons/react/24/solid';

interface BookingStepsProps {
  currentStep: number;
  totalSteps: number;
}

export default function BookingSteps({ currentStep, totalSteps }: BookingStepsProps) {
  const steps = [
    { id: 1, name: 'Clinic', description: 'Choose clinic' },
    { id: 2, name: 'Veterinarian', description: 'Select vet' },
    { id: 3, name: 'Service', description: 'Pick service' },
    { id: 4, name: 'Date & Time', description: 'Schedule' },
    { id: 5, name: 'Pet', description: 'Select pet' },
    { id: 6, name: 'Details', description: 'Add details' }
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                  step.id < currentStep
                    ? 'bg-teal-500 text-white'
                    : step.id === currentStep
                    ? 'bg-teal-500 text-white ring-4 ring-teal-100'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step.id < currentStep ? (
                  <CheckIcon className="w-6 h-6" />
                ) : (
                  step.id
                )}
              </div>
              <div className="mt-2 text-center">
                <p
                  className={`text-sm font-medium ${
                    step.id <= currentStep ? 'text-teal-600' : 'text-gray-500'
                  }`}
                >
                  {step.name}
                </p>
                <p className="text-xs text-gray-400 hidden sm:block">
                  {step.description}
                </p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-4 transition-all duration-200 ${
                  step.id < currentStep ? 'bg-teal-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}