'use client';

import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface UpcomingAppointmentsProps {
  appointments: any[];
  loading: boolean;
}

export default function UpcomingAppointments({ appointments, loading }: UpcomingAppointmentsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-4">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
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
        <h2 className="text-lg font-semibold text-gray-800">Upcoming Appointments</h2>
        <Link
          href="/dashboard/appointments"
          className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center"
        >
          View all
          <ChevronRightIcon className="w-4 h-4 ml-1" />
        </Link>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-8">
          <CalendarDaysIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No upcoming appointments</p>
          <Link
            href="/dashboard/appointments/book"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-teal-500 to-lime-500 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all duration-200"
          >
            Book Your First Appointment
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-medium text-gray-800">
                      {appointment.patients?.name} - {appointment.services?.name || 'General Checkup'}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                      {appointment.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center">
                      <CalendarDaysIcon className="w-4 h-4 mr-2" />
                      {format(parseISO(appointment.appointment_date), 'EEEE, MMMM d, yyyy')}
                    </div>
                    <div className="flex items-center">
                      <ClockIcon className="w-4 h-4 mr-2" />
                      {appointment.appointment_time}
                    </div>
                    <div className="flex items-center">
                      <MapPinIcon className="w-4 h-4 mr-2" />
                      {appointment.clinics?.name}
                    </div>
                  </div>
                </div>
                
                <Link
                  href={`/dashboard/appointments/${appointment.id}`}
                  className="text-teal-600 hover:text-teal-700 p-1"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </Link>
              </div>

              {appointment.veterinarians && (
                <div className="flex items-center pt-3 border-t border-gray-100">
                  <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-lime-400 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-xs font-semibold">
                      {appointment.veterinarians.full_name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      Dr. {appointment.veterinarians.full_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {appointment.veterinarians.specialization}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}