'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  HomeIcon,
  HeartIcon,
  CalendarDaysIcon,
  BuildingOffice2Icon,
  UserIcon,
  BellIcon,
  ChartBarIcon,
  CogIcon,
  ClockIcon,
  DocumentTextIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  HeartIcon as HeartIconSolid,
  CalendarDaysIcon as CalendarIconSolid,
  BuildingOffice2Icon as BuildingIconSolid,
  UserIcon as UserIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  CogIcon as CogIconSolid
} from '@heroicons/react/24/solid';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { signOut, userProfile } = useAuth();
  const pathname = usePathname();

  // Different navigation based on user role
  const getNavigation = () => {
    if (userProfile?.user_role === 'admin') {
      return [
        {
          name: 'System Overview',
          href: '/admin',
          icon: HomeIcon,
          iconSolid: HomeIconSolid,
          current: pathname === '/admin',
          desc: 'Dashboard overview'
        },
        {
          name: 'User Management',
          href: '/admin/users',
          icon: UserGroupIcon,
          iconSolid: UserGroupIcon,
          current: pathname?.startsWith('/admin/users') || false,
          desc: 'Manage accounts'
        },
        {
          name: 'Clinic Management',
          href: '/admin/clinics',
          icon: BuildingOffice2Icon,
          iconSolid: BuildingIconSolid,
          current: pathname?.startsWith('/admin/clinics') || false,
          desc: 'Clinic listings'
        },
        {
          name: 'Appointment System',
          href: '/admin/appointments',
          icon: CalendarDaysIcon,
          iconSolid: CalendarDaysIcon,
          current: pathname?.startsWith('/admin/appointments') || false,
          desc: 'Booking system'
        },
        {
          name: 'Veterinarian Registry',
          href: '/admin/veterinarians',
          icon: UserIcon,
          iconSolid: UserIcon,
          current: pathname?.startsWith('/admin/veterinarians') || false,
          desc: 'Medical professionals'
        },
        {
          name: 'System Analytics',
          href: '/admin/analytics',
          icon: ChartBarIcon,
          iconSolid: ChartBarIconSolid,
          current: pathname?.startsWith('/admin/analytics') || false,
          desc: 'Reports & insights'
        },
        {
          name: 'Recent Activity',
          href: '/admin/activity',
          icon: ClockIcon,
          iconSolid: ClockIcon,
          current: pathname?.startsWith('/admin/activity') || false,
          desc: 'Activity logs'
        },
        {
          name: 'Service Management',
          href: '/admin/services',
          icon: DocumentTextIcon,
          iconSolid: DocumentTextIcon,
          current: pathname?.startsWith('/admin/services') || false,
          desc: 'Service config'
        }
      ];
    }
    
    // Default user navigation
    return [
      {
        name: 'Home',
        href: '/dashboard',
        icon: HomeIcon,
        iconSolid: HomeIconSolid,
        current: pathname === '/dashboard'
      },
      {
        name: 'My Pets',
        href: '/dashboard/pets',
        icon: HeartIcon,
        iconSolid: HeartIconSolid,
        current: pathname?.startsWith('/dashboard/pets') || false
      },
      {
        name: 'Appointments',
        href: '/dashboard/appointments',
        icon: CalendarDaysIcon,
        iconSolid: CalendarIconSolid,
        current: pathname?.startsWith('/dashboard/appointments') || false
      },
      {
        name: 'Clinics',
        href: '/dashboard/clinics',
        icon: BuildingOffice2Icon,
        iconSolid: BuildingIconSolid,
        current: pathname?.startsWith('/dashboard/clinics') || false
      },
      {
        name: 'Profile',
        href: '/dashboard/profile',
        icon: UserIcon,
        iconSolid: UserIconSolid,
        current: pathname?.startsWith('/dashboard/profile') || false
      }
    ];
  };

  const navigation = getNavigation();

  const isAdmin = userProfile?.user_role === 'admin';

  return (
    <div className="min-h-screen bg-[#faf9f7] flex">
      {/* Admin Sidebar */}
      <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 shadow-lg overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center justify-center px-6 py-8 bg-gray-900">
            <Link href={isAdmin ? '/admin' : '/dashboard'} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-700 rounded-xl flex items-center justify-center">
                {isAdmin ? (
                  <CogIcon className="w-6 h-6 text-white" />
                ) : (
                  <HeartIconSolid className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="text-left">
                <div className="text-xl font-bold text-white tracking-tight">
                  {isAdmin ? 'Admin Portal' : 'ZamboVet'}
                </div>
                <div className="text-xs text-gray-300 font-medium">
                  {isAdmin ? 'Dashboard Control' : 'Veterinary Care'}
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <div className="flex-1 px-4 py-6">
            <div className="mb-6">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">MAIN NAVIGATION</h3>
            </div>
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.current ? item.iconSolid : item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`w-full group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 border ${
                      item.current
                        ? 'bg-gray-900 text-white border-gray-800 shadow-lg'
                        : 'hover:bg-gray-50 border-transparent hover:border-gray-200 hover:shadow-sm'
                    }`}
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-200 mr-3 ${
                      item.current
                        ? 'bg-gray-700'
                        : 'bg-gray-100 group-hover:bg-gray-200'
                    }`}>
                      <Icon
                        className={`h-4 w-4 ${
                          item.current ? 'text-white' : 'text-gray-600 group-hover:text-gray-700'
                        }`}
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <div className={`font-semibold ${
                        item.current ? 'text-white' : 'text-gray-900'
                      }`}>{item.name}</div>
                      <div className={`text-xs ${
                        item.current ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        {item.desc}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Profile Section */}
          <div className="px-4 py-4 mt-auto">
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center space-x-3 p-4 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all duration-200">
                <div className="relative">
                  <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {(userProfile?.full_name || 'U').charAt(0)}
                    </span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {userProfile?.full_name || 'Cabasag Halon'}
                  </p>
                  <p className="text-xs text-gray-600 truncate font-medium">
                    {userProfile?.user_role === 'admin' ? 'System Administrator' : userProfile?.user_role || 'User'}
                  </p>
                </div>
                <button
                  onClick={signOut}
                  className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-all duration-200"
                  title="Sign Out"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href={isAdmin ? '/admin' : '/dashboard'} className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center">
              {isAdmin ? (
                <CogIcon className="w-5 h-5 text-white" />
              ) : (
                <HeartIconSolid className="w-5 h-5 text-white" />
              )}
            </div>
            <span className="text-xl font-bold text-gray-800">
              {isAdmin ? 'Admin' : 'ZamboVet'}
            </span>
          </Link>
          
          <div className="flex items-center space-x-3">
            <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
              <BellIcon className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {(userProfile?.full_name || 'U').charAt(0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-72 flex flex-col flex-1">
        <main className="pt-16 lg:pt-0 flex-1">
          {children}
        </main>
      </div>

      {/* Bottom Navigation (Mobile) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="grid grid-cols-5 py-2">
          {navigation.map((item) => {
            const Icon = item.current ? item.iconSolid : item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-1 transition-colors ${
                  item.current
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}