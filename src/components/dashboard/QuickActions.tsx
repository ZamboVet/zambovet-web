'use client';

import Link from 'next/link';
import {
  CalendarDaysIcon,
  HeartIcon,
  BuildingOffice2Icon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

export default function QuickActions() {
  const actions = [
    {
      name: 'Book Appointment',
      href: '/dashboard/appointments/book',
      icon: CalendarDaysIcon,
      color: 'from-teal-500 to-teal-600',
      description: 'Schedule a visit'
    },
    {
      name: 'Add Pet',
      href: '/dashboard/pets/add',
      icon: HeartIcon,
      color: 'from-lime-500 to-lime-600',
      description: 'Register new pet'
    },
    {
      name: 'Find Clinics',
      href: '/dashboard/clinics',
      icon: BuildingOffice2Icon,
      color: 'from-teal-400 to-lime-500',
      description: 'Browse nearby'
    },
    {
      name: 'Health Records',
      href: '/dashboard/pets?tab=records',
      icon: DocumentTextIcon,
      color: 'from-lime-400 to-teal-500',
      description: 'View history'
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => (
          <Link
            key={action.name}
            href={action.href}
            className="group flex flex-col items-center p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200 hover:-translate-y-1"
          >
            <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}>
              <action.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-sm font-medium text-gray-800 text-center mb-1">
              {action.name}
            </h3>
            <p className="text-xs text-gray-500 text-center">
              {action.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
