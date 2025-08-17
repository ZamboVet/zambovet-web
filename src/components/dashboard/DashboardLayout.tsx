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
  BellIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  HeartIcon as HeartIconSolid,
  CalendarDaysIcon as CalendarIconSolid,
  BuildingOffice2Icon as BuildingIconSolid,
  UserIcon as UserIconSolid
} from '@heroicons/react/24/solid';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { signOut, userProfile } = useAuth();
  const pathname = usePathname();

  const navigation = [
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

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-lime-500 rounded-lg flex items-center justify-center">
              <HeartIconSolid className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800">ZamboVet</span>
          </Link>
          
          <div className="flex items-center space-x-3">
            <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
              <BellIcon className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-lime-400 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {userProfile?.roleProfile?.full_name?.charAt(0) || 'U'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div>
        <main className="pt-16 lg:pt-0">
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
                    ? 'text-teal-600'
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