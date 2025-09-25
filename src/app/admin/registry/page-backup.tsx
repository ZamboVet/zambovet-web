'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import {
  PlusIcon,
  UserGroupIcon,
  DocumentCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  AcademicCapIcon,
  BuildingOffice2Icon,
  PhoneIcon,
  EnvelopeIcon,
  BanknotesIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CogIcon,
  ChartBarIcon,
  UserIcon,
  HomeIcon,
  Bars3Icon,
  BellIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface VeterinarianApplication {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  specialization: string;
  license_number: string;
  years_experience: number;
  consultation_fee: number;
  clinic_id?: string;
  business_permit_url: string;
  government_id_url: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

interface ActiveVeterinarian {
  id: string;
  user_id: string;
  full_name: string;
  specialization: string;
  license_number: string;
  years_experience: number;
  consultation_fee: number;
  is_available: boolean;
  average_rating: number;
  created_at: string;
  clinic_id?: number;
  // Profile data
  profiles: {
    email: string;
    phone?: string;
    is_active: boolean;
  };
  clinics?: {
    name: string;
    address: string;
    phone: string;
  };
}

export default function AdminVeterinarianRegistry() {
  const { userProfile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'applications' | 'active' | 'create'>('applications');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Applications state
  const [applications, setApplications] = useState<VeterinarianApplication[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  
  // Active veterinarians state
  const [activeVets, setActiveVets] = useState<ActiveVeterinarian[]>([]);
  const [activeVetsLoading, setActiveVetsLoading] = useState(true);
  
  // Common state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'unavailable'>('all');
  
  // Modal state
  const [selectedApplication, setSelectedApplication] = useState<VeterinarianApplication | null>(null);
  const [selectedVet, setSelectedVet] = useState<ActiveVeterinarian | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showVetModal, setShowVetModal] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Create veterinarian state
  const [createFormData, setCreateFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    specialization: '',
    license_number: '',
    years_experience: 0,
    consultation_fee: 0,
    clinic_id: null as number | null
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  useEffect(() => {
    if (activeTab === 'applications') {
      fetchApplications();
    } else if (activeTab === 'active') {
      fetchActiveVeterinarians();
    }
  }, [activeTab]);

  const fetchApplications = async () => {
    try {
      setApplicationsLoading(true);
      
      const { data, error } = await supabase
        .from('veterinarian_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching applications:', error);
        return;
      }

      setApplications(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setApplicationsLoading(false);
    }
  };

  const fetchActiveVeterinarians = async () => {
    try {
      setActiveVetsLoading(true);
      
      const { data, error } = await supabase
        .from('veterinarians')
        .select(`
          *,
          profiles!inner(email, phone, is_active),
          clinics(name, address, phone)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching active veterinarians:', error);
        return;
      }

      setActiveVets(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setActiveVetsLoading(false);
    }
  };

  const handleApproveApplication = async (applicationId: string) => {
    if (!userProfile?.id) return;
    
    setActionLoading(true);
    try {
      // Step 1: Update application status
      const { error: appError } = await supabase
        .from('veterinarian_applications')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: userProfile.id,
          review_notes: remarks.trim() || null
        })
        .eq('id', applicationId);

      if (appError) throw appError;

      // Step 2: Activate user profile and create veterinarian record
      const application = applications.find(a => a.id === applicationId);
      if (application) {
        // Get user profile
        const { data: profileData, error: findProfileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', application.email)
          .single();

        if (findProfileError || !profileData) {
          throw new Error('User profile not found');
        }

        // Activate profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            is_active: true,
            verification_status: 'approved'
          })
          .eq('id', profileData.id);

        if (profileError) throw profileError;

        // Create veterinarian record
        const { error: vetError } = await supabase
          .from('veterinarians')
          .upsert({
            user_id: profileData.id,
            full_name: application.full_name,
            specialization: application.specialization,
            license_number: application.license_number,
            years_experience: application.years_experience,
            consultation_fee: application.consultation_fee,
            is_available: true,
            average_rating: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (vetError) throw vetError;

        // Send approval notification
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            await fetch('/api/notifications/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({
                type: 'VET_APPROVED',
                to: application.email,
                data: {
                  fullName: application.full_name,
                  adminRemarks: remarks.trim() || null
                }
              })
            });
          }
        } catch (emailError) {
          console.warn('Failed to send approval email:', emailError);
        }
      }

      alert('Application approved successfully!');
      await fetchApplications();
      setShowApplicationModal(false);
      setSelectedApplication(null);
      setRemarks('');

    } catch (error: any) {
      console.error('Error approving application:', error);
      alert('Failed to approve application: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectApplication = async (applicationId: string) => {
    if (!userProfile?.id || !remarks.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    setActionLoading(true);
    try {
      const { error: appError } = await supabase
        .from('veterinarian_applications')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: userProfile.id,
          rejection_reason: remarks.trim()
        })
        .eq('id', applicationId);

      if (appError) throw appError;

      // Update user profile
      const application = applications.find(a => a.id === applicationId);
      if (application) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ verification_status: 'rejected' })
          .eq('email', application.email);

        if (profileError) console.error('Error updating profile:', profileError);

        // Send rejection notification
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            await fetch('/api/notifications/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({
                type: 'VET_REJECTED',
                to: application.email,
                data: {
                  fullName: application.full_name,
                  adminRemarks: remarks.trim()
                }
              })
            });
          }
        } catch (emailError) {
          console.warn('Failed to send rejection email:', emailError);
        }
      }

      alert('Application rejected.');
      await fetchApplications();
      setShowApplicationModal(false);
      setSelectedApplication(null);
      setRemarks('');

    } catch (error: any) {
      console.error('Error rejecting application:', error);
      alert('Failed to reject application: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateVeterinarian = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    setCreateLoading(true);

    try {
      const response = await fetch('/api/admin/create-veterinarian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createFormData),
      });

      const result = await response.json();

      if (response.ok) {
        setCreateSuccess('Veterinarian created successfully!');
        setCreateFormData({
          email: '',
          full_name: '',
          password: '',
          specialization: '',
          license_number: '',
          years_experience: 0,
          consultation_fee: 0,
          clinic_id: null
        });
      } else {
        setCreateError(result.error || 'Failed to create veterinarian');
      }
    } catch (error) {
      console.error('Error creating veterinarian:', error);
      setCreateError('Network error occurred');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleVetAvailability = async (vetId: string, newAvailability: boolean) => {
    try {
      const { error } = await supabase
        .from('veterinarians')
        .update({ is_available: newAvailability })
        .eq('id', vetId);

      if (error) throw error;

      await fetchActiveVeterinarians();
      alert(`Veterinarian availability updated to ${newAvailability ? 'Available' : 'Unavailable'}`);
    } catch (error: any) {
      console.error('Error updating availability:', error);
      alert('Failed to update availability: ' + error.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-800 bg-green-100';
      case 'rejected': return 'text-red-800 bg-red-100';
      case 'pending':
      default: return 'text-yellow-800 bg-yellow-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircleIcon className="w-4 h-4" />;
      case 'rejected': return <XCircleIcon className="w-4 h-4" />;
      case 'pending':
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  // Filter data
  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.license_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredActiveVets = activeVets.filter(vet => {
    const matchesSearch = vet.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vet.profiles.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vet.license_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAvailability = availabilityFilter === 'all' || 
      (availabilityFilter === 'available' && vet.is_available) ||
      (availabilityFilter === 'unavailable' && !vet.is_available);
    return matchesSearch && matchesAvailability;
  });

  const applicationStats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length
  };

  const vetStats = {
    total: activeVets.length,
    available: activeVets.filter(v => v.is_available).length,
    unavailable: activeVets.filter(v => !v.is_available).length,
    activeProfiles: activeVets.filter(v => v.profiles.is_active).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex">
        {/* Admin Sidebar */}
        <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0">
          <div className="flex flex-col flex-grow bg-white border-r border-gray-200 shadow-lg overflow-y-auto">
            {/* Logo */}
            <div className="flex items-center justify-center px-6 py-8 bg-gray-900">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-700 rounded-xl flex items-center justify-center">
                  <CogIcon className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-xl font-bold text-white tracking-tight">Admin Portal</div>
                  <div className="text-xs text-gray-300 font-medium">Dashboard Control</div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 px-4 py-6">
              <div className="mb-6">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">MAIN NAVIGATION</h3>
              </div>
              <nav className="space-y-1">
                {[
                  { id: "overview", name: "System Overview", icon: HomeIcon, desc: 'Dashboard overview', href: '/admin' },
                  { id: "users", name: "User Management", icon: UserGroupIcon, desc: "Manage accounts", href: '/admin' },
                  { id: "clinics", name: "Clinic Management", icon: BuildingOffice2Icon, desc: 'Clinic listings', href: '/admin' },
                  { id: "appointments", name: "Appointment System", icon: CalendarIcon, desc: 'Booking system', href: '/admin' },
                  { id: "veterinarians", name: "Veterinarian Registry", icon: AcademicCapIcon, desc: 'Medical professionals', href: '/admin/registry', active: true },
                  { id: "analytics", name: "System Analytics", icon: ChartBarIcon, desc: 'Reports & insights', href: "/admin/analytics" },
                  { id: "activity", name: 'Recent Activity', icon: ClockIcon, desc: "Activity logs", href: '/admin' },
                  { id: "services", name: "Service Management", icon: DocumentTextIcon, desc: 'Service config', href: '/admin' }
                ].map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`w-full group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 border ${
                      item.active
                        ? 'bg-gray-900 text-white border-gray-800 shadow-lg'
                        : 'hover:bg-gray-50 border-transparent hover:border-gray-200 hover:shadow-sm'
                    }`}
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-200 mr-3 ${
                      item.active
                        ? 'bg-gray-700'
                        : 'bg-gray-100 group-hover:bg-gray-200'
                    }`}>
                      <item.icon
                        className={`h-4 w-4 ${
                          item.active ? 'text-white' : 'text-gray-600 group-hover:text-gray-700'
                        }`}
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <div className={`font-semibold ${
                        item.active ? 'text-white' : 'text-gray-900'
                      }`}>{item.name}</div>
                      <div className={`text-xs ${
                        item.active ? 'text-gray-300' : 'text-gray-500'
                      }`}>{item.desc}</div>
                    </div>
                  </Link>
                ))}
              </nav>
            </div>

            {/* User Profile Section */}
            <div className="px-4 py-4 mt-auto">
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center space-x-3 p-4 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all duration-200">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {userProfile?.full_name || 'Admin User'}
                    </p>
                    <p className="text-xs text-gray-600 truncate font-medium">
                      System Administrator
                    </p>
                  </div>
                  <button
                    onClick={signOut}
                    className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-all duration-200"
                    title="Sign Out"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-20 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
        )}
        
        {/* Mobile Menu */}
        <div className={`fixed inset-y-0 left-0 z-30 w-72 bg-white transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-center px-6 py-8 bg-gray-900">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-700 rounded-xl flex items-center justify-center">
                  <CogIcon className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-xl font-bold text-white tracking-tight">Admin Portal</div>
                  <div className="text-xs text-gray-300 font-medium">Dashboard Control</div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 px-4 py-6">
              <nav className="space-y-1">
                {[
                  { id: "overview", name: "System Overview", icon: HomeIcon, href: '/admin' },
                  { id: "users", name: "User Management", icon: UserGroupIcon, href: '/admin' },
                  { id: "clinics", name: "Clinic Management", icon: BuildingOffice2Icon, href: '/admin' },
                  { id: "appointments", name: "Appointment System", icon: CalendarIcon, href: '/admin' },
                  { id: "veterinarians", name: "Veterinarian Registry", icon: AcademicCapIcon, href: '/admin/registry', active: true },
                  { id: "analytics", name: "System Analytics", icon: ChartBarIcon, href: "/admin/analytics" },
                  { id: "activity", name: 'Recent Activity', icon: ClockIcon, href: '/admin' },
                  { id: "services", name: "Service Management", icon: DocumentTextIcon, href: '/admin' }
                ].map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`w-full group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      item.active
                        ? 'bg-gray-900 text-white'
                        : 'hover:bg-gray-100 text-gray-900'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className={`mr-3 h-5 w-5 ${item.active ? 'text-white' : 'text-gray-500'}`} />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:pl-72 flex flex-col flex-1">
          {/* Enhanced Header */}
          <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
            <div className="px-4 lg:px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Mobile Menu Button */}
                  <button
                    className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  >
                    <Bars3Icon className="w-5 h-5 text-gray-600" />
                  </button>
                  
                  <div className="flex flex-col">
                    {/* Breadcrumb Navigation */}
                    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                      <HomeIcon className="w-4 h-4" />
                      <ChevronRightIcon className="w-4 h-4" />
                      <span className="text-gray-400">Admin</span>
                      <ChevronRightIcon className="w-4 h-4" />
                      <span className="font-medium text-gray-900">Veterinarian Registry</span>
                    </nav>
                    
                    <div>
                      <h1 className="text-xl lg:text-2xl font-bold text-gray-900 tracking-tight flex items-center">
                        <UserGroupIcon className="w-6 h-6 text-blue-600 mr-3" />
                        Veterinarian Registry
                      </h1>
                      <p className="text-sm text-gray-600 mt-1 hidden sm:block">
                        Manage veterinarian applications and active accounts
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* Quick Actions */}
                  <div className="hidden lg:flex items-center space-x-2">
                    <button 
                      onClick={() => setActiveTab('create')}
                      className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 shadow-sm"
                    >
                      <PlusIcon className="w-4 h-4" />
                      <span>Create Vet</span>
                    </button>
                  </div>
                  
                  {/* Notifications */}
                  <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <BellIcon className="w-5 h-5 text-gray-600" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                  </button>
                  
                  {/* System Status */}
                  <div className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium">Online</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="px-6 lg:px-8 py-8">
            <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <UserGroupIcon className="w-8 h-8 text-blue-600 mr-3" />
                  Veterinarian Registry
                </h1>
                <p className="text-gray-600 mt-1">Manage veterinarian applications and active accounts</p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('applications')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'applications'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <DocumentCheckIcon className="w-5 h-5 inline mr-2" />
                Applications ({applicationStats.pending})
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'active'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <CheckCircleIcon className="w-5 h-5 inline mr-2" />
                Active Veterinarians ({vetStats.total})
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'create'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <PlusIcon className="w-5 h-5 inline mr-2" />
                Create New
              </button>
            </nav>
          </div>

          {/* Applications Tab */}
          {activeTab === 'applications' && (
            <div>
              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <DocumentCheckIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Applications</p>
                      <p className="text-2xl font-bold text-gray-900">{applicationStats.total}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <ClockIcon className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-2xl font-bold text-gray-900">{applicationStats.pending}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 rounded-full">
                      <CheckCircleIcon className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Approved</p>
                      <p className="text-2xl font-bold text-gray-900">{applicationStats.approved}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="p-3 bg-red-100 rounded-full">
                      <XCircleIcon className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Rejected</p>
                      <p className="text-2xl font-bold text-gray-900">{applicationStats.rejected}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search applications..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="relative">
                    <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <button
                    onClick={fetchApplications}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <ArrowPathIcon className="w-4 h-4 mr-2" />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Applications List */}
              <div className="bg-white rounded-lg shadow-sm border">
                {applicationsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading applications...</span>
                  </div>
                ) : filteredApplications.length === 0 ? (
                  <div className="text-center py-12">
                    <DocumentCheckIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 text-lg">No applications found</p>
                    <p className="text-gray-400 text-sm">Try adjusting your search or filter criteria</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Veterinarian
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Credentials
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Submitted
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredApplications.map((application) => (
                          <tr key={application.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {application.full_name}
                                </div>
                                <div className="text-sm text-gray-500">{application.email}</div>
                                {application.phone && (
                                  <div className="text-sm text-gray-500">{application.phone}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                <div>License: {application.license_number}</div>
                                <div className="text-gray-500">
                                  {application.specialization || 'General Practice'}
                                </div>
                                <div className="text-gray-500">
                                  {application.years_experience} years exp.
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                                {getStatusIcon(application.status)}
                                <span className="ml-1 capitalize">{application.status}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(application.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => {
                                  setSelectedApplication(application);
                                  setRemarks(application.review_notes || application.rejection_reason || '');
                                  setShowApplicationModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 flex items-center"
                              >
                                <EyeIcon className="w-4 h-4 mr-1" />
                                Review
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Active Veterinarians Tab */}
          {activeTab === 'active' && (
            <div>
              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <UserGroupIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Veterinarians</p>
                      <p className="text-2xl font-bold text-gray-900">{vetStats.total}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 rounded-full">
                      <CheckCircleIcon className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Available</p>
                      <p className="text-2xl font-bold text-gray-900">{vetStats.available}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="p-3 bg-red-100 rounded-full">
                      <XCircleIcon className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Unavailable</p>
                      <p className="text-2xl font-bold text-gray-900">{vetStats.unavailable}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center">
                    <div className="p-3 bg-indigo-100 rounded-full">
                      <AcademicCapIcon className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Profiles</p>
                      <p className="text-2xl font-bold text-gray-900">{vetStats.activeProfiles}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search veterinarians..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="relative">
                    <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={availabilityFilter}
                      onChange={(e) => setAvailabilityFilter(e.target.value as any)}
                      className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="all">All Status</option>
                      <option value="available">Available</option>
                      <option value="unavailable">Unavailable</option>
                    </select>
                  </div>
                  <button
                    onClick={fetchActiveVeterinarians}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <ArrowPathIcon className="w-4 h-4 mr-2" />
                    Refresh
                  </button>
                </div>
              </div>

              {/* Active Veterinarians List */}
              <div className="bg-white rounded-lg shadow-sm border">
                {activeVetsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading veterinarians...</span>
                  </div>
                ) : filteredActiveVets.length === 0 ? (
                  <div className="text-center py-12">
                    <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 text-lg">No veterinarians found</p>
                    <p className="text-gray-400 text-sm">Try adjusting your search or filter criteria</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Veterinarian
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Details
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Clinic
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredActiveVets.map((vet) => (
                          <tr key={vet.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  Dr. {vet.full_name}
                                </div>
                                <div className="text-sm text-gray-500">{vet.profiles.email}</div>
                                {vet.profiles.phone && (
                                  <div className="text-sm text-gray-500">{vet.profiles.phone}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                <div>{vet.specialization || 'General Practice'}</div>
                                <div className="text-gray-500">License: {vet.license_number}</div>
                                <div className="text-gray-500">{vet.years_experience} years exp.</div>
                                <div className="text-gray-500">₱{vet.consultation_fee} fee</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {vet.clinics ? (
                                <div className="text-sm text-gray-900">
                                  <div className="font-medium">{vet.clinics.name}</div>
                                  <div className="text-gray-500 text-xs">{vet.clinics.address}</div>
                                  <div className="text-gray-500 text-xs">{vet.clinics.phone}</div>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-sm">No clinic assigned</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col space-y-1">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  vet.is_available ? 'text-green-800 bg-green-100' : 'text-red-800 bg-red-100'
                                }`}>
                                  {vet.is_available ? 'Available' : 'Unavailable'}
                                </span>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  vet.profiles.is_active ? 'text-blue-800 bg-blue-100' : 'text-gray-800 bg-gray-100'
                                }`}>
                                  {vet.profiles.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleToggleVetAvailability(vet.id, !vet.is_available)}
                                  className={`px-3 py-1 text-xs rounded ${
                                    vet.is_available
                                      ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                                  } transition-colors`}
                                >
                                  {vet.is_available ? 'Set Unavailable' : 'Set Available'}
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedVet(vet);
                                    setShowVetModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-900 flex items-center"
                                >
                                  <EyeIcon className="w-4 h-4 mr-1" />
                                  View
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Create New Tab */}
          {activeTab === 'create' && (
            <div className="max-w-2xl">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Create New Veterinarian Account</h2>
                
                {createError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                      <div className="ml-3">
                        <p className="text-sm text-red-800">{createError}</p>
                      </div>
                    </div>
                  </div>
                )}

                {createSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex">
                      <CheckCircleIcon className="h-5 w-5 text-green-400" />
                      <div className="ml-3">
                        <p className="text-sm text-green-800">{createSuccess}</p>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleCreateVeterinarian} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={createFormData.full_name}
                        onChange={(e) => setCreateFormData(prev => ({...prev, full_name: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={createFormData.email}
                        onChange={(e) => setCreateFormData(prev => ({...prev, email: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password *
                      </label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={createFormData.password}
                        onChange={(e) => setCreateFormData(prev => ({...prev, password: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Specialization
                      </label>
                      <input
                        type="text"
                        value={createFormData.specialization}
                        onChange={(e) => setCreateFormData(prev => ({...prev, specialization: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., General Practice, Surgery"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        License Number
                      </label>
                      <input
                        type="text"
                        value={createFormData.license_number}
                        onChange={(e) => setCreateFormData(prev => ({...prev, license_number: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Years of Experience
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={createFormData.years_experience}
                        onChange={(e) => setCreateFormData(prev => ({...prev, years_experience: parseInt(e.target.value) || 0}))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Consultation Fee (₱)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={createFormData.consultation_fee}
                        onChange={(e) => setCreateFormData(prev => ({...prev, consultation_fee: parseFloat(e.target.value) || 0}))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Clinic ID (Optional)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={createFormData.clinic_id || ''}
                        onChange={(e) => setCreateFormData(prev => ({...prev, clinic_id: e.target.value ? parseInt(e.target.value) : null}))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter clinic ID if available"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={createLoading}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
                    >
                      {createLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <PlusIcon className="w-4 h-4 mr-2" />
                          Create Veterinarian
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Application Review Modal */}
          {showApplicationModal && selectedApplication && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Review Application - {selectedApplication.full_name}
                  </h3>
                  
                  <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Full Name</p>
                        <p className="text-sm text-gray-900">{selectedApplication.full_name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Email</p>
                        <p className="text-sm text-gray-900">{selectedApplication.email}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Phone</p>
                        <p className="text-sm text-gray-900">{selectedApplication.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">License Number</p>
                        <p className="text-sm text-gray-900">{selectedApplication.license_number}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Specialization</p>
                        <p className="text-sm text-gray-900">{selectedApplication.specialization || 'General Practice'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Experience</p>
                        <p className="text-sm text-gray-900">{selectedApplication.years_experience} years</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Consultation Fee</p>
                        <p className="text-sm text-gray-900">₱{selectedApplication.consultation_fee}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Status</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedApplication.status)}`}>
                          {getStatusIcon(selectedApplication.status)}
                          <span className="ml-1 capitalize">{selectedApplication.status}</span>
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Documents</p>
                      <div className="space-y-2">
                        <a
                          href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/veterinarian-documents/${selectedApplication.business_permit_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <DocumentTextIcon className="w-4 h-4 mr-1" />
                          View Business Permit
                        </a>
                        <br />
                        <a
                          href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/veterinarian-documents/${selectedApplication.government_id_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <DocumentTextIcon className="w-4 h-4 mr-1" />
                          View Government ID
                        </a>
                      </div>
                    </div>

                    {(selectedApplication.review_notes || selectedApplication.rejection_reason) && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Previous Remarks</p>
                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">
                          {selectedApplication.review_notes || selectedApplication.rejection_reason}
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admin Remarks
                      </label>
                      <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your remarks here..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowApplicationModal(false);
                        setSelectedApplication(null);
                        setRemarks('');
                      }}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    
                    {selectedApplication.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleRejectApplication(selectedApplication.id)}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
                        >
                          {actionLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <XCircleIcon className="w-4 h-4 mr-2" />
                          )}
                          Reject
                        </button>
                        
                        <button
                          onClick={() => handleApproveApplication(selectedApplication.id)}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
                        >
                          {actionLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <CheckCircleIcon className="w-4 h-4 mr-2" />
                          )}
                          Approve
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Veterinarian Detail Modal */}
          {showVetModal && selectedVet && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Veterinarian Details - Dr. {selectedVet.full_name}
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Full Name</p>
                        <p className="text-sm text-gray-900">Dr. {selectedVet.full_name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Email</p>
                        <p className="text-sm text-gray-900">{selectedVet.profiles.email}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Phone</p>
                        <p className="text-sm text-gray-900">{selectedVet.profiles.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">License Number</p>
                        <p className="text-sm text-gray-900">{selectedVet.license_number}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Specialization</p>
                        <p className="text-sm text-gray-900">{selectedVet.specialization || 'General Practice'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Experience</p>
                        <p className="text-sm text-gray-900">{selectedVet.years_experience} years</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Consultation Fee</p>
                        <p className="text-sm text-gray-900">₱{selectedVet.consultation_fee}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Average Rating</p>
                        <p className="text-sm text-gray-900">{selectedVet.average_rating}/5.0</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Availability</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedVet.is_available ? 'text-green-800 bg-green-100' : 'text-red-800 bg-red-100'
                        }`}>
                          {selectedVet.is_available ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Profile Status</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedVet.profiles.is_active ? 'text-blue-800 bg-blue-100' : 'text-gray-800 bg-gray-100'
                        }`}>
                          {selectedVet.profiles.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm font-medium text-gray-700">Clinic Information</p>
                        {selectedVet.clinics ? (
                          <div className="text-sm text-gray-900">
                            <p className="font-medium">{selectedVet.clinics.name}</p>
                            <p className="text-gray-500">{selectedVet.clinics.address}</p>
                            <p className="text-gray-500">{selectedVet.clinics.phone}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">No clinic assigned</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Joined</p>
                        <p className="text-sm text-gray-900">{new Date(selectedVet.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end mt-6">
                    <button
                      onClick={() => {
                        setShowVetModal(false);
                        setSelectedVet(null);
                      }}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
  );
}