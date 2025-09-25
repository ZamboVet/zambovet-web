'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import {
  PlusIcon,
  UserGroupIcon,
  CogIcon,
  HomeIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

export default function TestPage() {
  const { userProfile, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex">
      {/* Test Content */}
      <div className="p-8">
        <h1>Test Page</h1>
      </div>
    </div>
  );
}