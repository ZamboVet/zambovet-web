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

  // Pagination state
  const PAGE_SIZE = 10;
  const [applicationsPage, setApplicationsPage] = useState(1);
  const [activeVetsPage, setActiveVetsPage] = useState(1);
  const [totalApplications, setTotalApplications] = useState(0);
  const [totalActiveVets, setTotalActiveVets] = useState(0);
  
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

  // Reset pagination when filters change
  useEffect(() => {
    setApplicationsPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    setActiveVetsPage(1);
  }, [searchTerm, availabilityFilter]);

  // Refetch data when page or filters change
  useEffect(() => {
    if (activeTab === 'applications') {
      fetchApplications();
    }
  }, [applicationsPage, searchTerm, statusFilter]);

  useEffect(() => {
    if (activeTab === 'active') {
      fetchActiveVeterinarians();
    }
  }, [activeVetsPage, searchTerm, availabilityFilter]);

  const fetchApplications = async () => {
    try {
      setApplicationsLoading(true);
      
      const offset = (applicationsPage - 1) * PAGE_SIZE;
      let dataQuery = supabase
        .from('veterinarian_applications')
        .select('*');
      let countQuery = supabase
        .from('veterinarian_applications')
        .select('*', { count: 'exact', head: true });
      
      // Apply search filter
      if (searchTerm.trim()) {
        const searchFilter = `full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,specialization.ilike.%${searchTerm}%`;
        dataQuery = dataQuery.or(searchFilter);
        countQuery = countQuery.or(searchFilter);
      }
      
      // Apply status filter
      if (statusFilter !== 'all') {
        dataQuery = dataQuery.eq('status', statusFilter);
        countQuery = countQuery.eq('status', statusFilter);
      }
      
      const [{ data, error: dataError }, { count, error: countError }] = await Promise.all([
        dataQuery.order('created_at', { ascending: false }).range(offset, offset + PAGE_SIZE - 1),
        countQuery
      ]);

      if (dataError || countError) {
        console.error('Error fetching applications:', dataError || countError);
        return;
      }

      setApplications(data || []);
      setTotalApplications(count || 0);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setApplicationsLoading(false);
    }
  };

  const fetchActiveVeterinarians = async () => {
    try {
      setActiveVetsLoading(true);
      
      const offset = (activeVetsPage - 1) * PAGE_SIZE;
      let dataQuery = supabase
        .from('veterinarians')
        .select(`
          *,
          profiles!inner(email, phone, is_active),
          clinics(name, address, phone)
        `);
      let countQuery = supabase
        .from('veterinarians')
        .select('*', { count: 'exact', head: true });
      
      // Apply search filter
      if (searchTerm.trim()) {
        const searchFilter = `full_name.ilike.%${searchTerm}%,specialization.ilike.%${searchTerm}%`;
        dataQuery = dataQuery.or(searchFilter);
        countQuery = countQuery.or(searchFilter);
      }
      
      // Apply availability filter
      if (availabilityFilter !== 'all') {
        dataQuery = dataQuery.eq('is_available', availabilityFilter === 'available');
        countQuery = countQuery.eq('is_available', availabilityFilter === 'available');
      }
      
      const [{ data, error: dataError }, { count, error: countError }] = await Promise.all([
        dataQuery.order('created_at', { ascending: false }).range(offset, offset + PAGE_SIZE - 1),
        countQuery
      ]);

      if (dataError || countError) {
        console.error('Error fetching active veterinarians:', dataError || countError);
        return;
      }

      setActiveVets(data || []);
      setTotalActiveVets(count || 0);
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
        // Update user profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ verification_status: 'approved', is_active: true })
          .eq('email', application.email);

        if (profileError) console.error('Error updating profile:', profileError);

        // Create veterinarian record
        const { error: vetError } = await supabase
          .from('veterinarians')
          .insert({
            user_id: (await supabase.from('profiles').select('id').eq('email', application.email).single()).data?.id,
            full_name: application.full_name,
            specialization: application.specialization || 'General Practice',
            license_number: application.license_number,
            years_experience: application.years_experience,
            consultation_fee: application.consultation_fee,
            clinic_id: application.clinic_id ? parseInt(application.clinic_id) : null,
            is_available: true,
            average_rating: 0
          });

        if (vetError) console.error('Error creating veterinarian:', vetError);

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

  // Use applications and activeVets directly since filtering is now done server-side
  const filteredApplications = applications;
  const filteredActiveVets = activeVets;

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
    <ProtectedRoute requiredRole="admin">
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
                  { id: "analytics", name: "System Analytics", icon: ChartBarIcon, desc: 'Reports & insights', href: "/admin" },
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
                  { id: "analytics", name: "System Analytics", icon: ChartBarIcon, href: "/admin" },
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
              {/* Tab Navigation */}
              <div className="mb-8">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    {[
                      { id: 'applications', name: 'Applications', count: applicationStats.pending, icon: DocumentCheckIcon },
                      { id: 'active', name: 'Active Veterinarians', count: vetStats.total, icon: UserGroupIcon },
                      { id: 'create', name: 'Create Veterinarian', icon: PlusIcon }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <tab.icon
                          className={`mr-2 h-5 w-5 transition-colors duration-200 ${
                            activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                          }`}
                        />
                        {tab.name}
                        {tab.count !== undefined && (
                          <span className={`ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium transition-colors duration-200 ${
                            activeTab === tab.id
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            {tab.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Applications Tab */}
              {activeTab === 'applications' && (
                <div className="space-y-6">
                  {/* Statistics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <DocumentCheckIcon className="h-8 w-8 text-gray-400" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">Total Applications</dt>
                              <dd className="text-lg font-medium text-gray-900">{applicationStats.total}</dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <ClockIcon className="h-8 w-8 text-yellow-400" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">Pending Review</dt>
                              <dd className="text-lg font-medium text-gray-900">{applicationStats.pending}</dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <CheckCircleIcon className="h-8 w-8 text-green-400" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">Approved</dt>
                              <dd className="text-lg font-medium text-gray-900">{applicationStats.approved}</dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <XCircleIcon className="h-8 w-8 text-red-400" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">Rejected</dt>
                              <dd className="text-lg font-medium text-gray-900">{applicationStats.rejected}</dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Search and Filter */}
                  <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                    <div className="p-6">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="text"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              placeholder="Search by name, email, or license number..."
                            />
                          </div>
                        </div>
                        <div className="sm:w-48">
                          <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                          >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Applications List */}
                  <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                    {applicationsLoading ? (
                      <div className="p-12 text-center">
                        <div className="inline-flex items-center">
                          <ArrowPathIcon className="animate-spin h-5 w-5 text-blue-500 mr-3" />
                          Loading applications...
                        </div>
                      </div>
                    ) : filteredApplications.length === 0 ? (
                      <div className="p-12 text-center">
                        <DocumentCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
                        <p className="mt-1 text-sm text-gray-500">No veterinarian applications match your search criteria.</p>
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Veterinarian</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {filteredApplications.map((app) => (
                                <tr key={app.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="flex-shrink-0 h-10 w-10">
                                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                          <UserIcon className="h-6 w-6 text-gray-600" />
                                        </div>
                                      </div>
                                      <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">{app.full_name}</div>
                                        <div className="text-sm text-gray-500">{app.email}</div>
                                        <div className="text-sm text-gray-500">{app.specialization || 'General Practice'}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {app.license_number}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {app.years_experience} years
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                                      {getStatusIcon(app.status)}
                                      <span className="ml-1 capitalize">{app.status}</span>
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(app.created_at).toLocaleDateString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                      onClick={() => {
                                        setSelectedApplication(app);
                                        setShowApplicationModal(true);
                                        setRemarks('');
                                      }}
                                      className="text-blue-600 hover:text-blue-900 mr-4"
                                    >
                                      <EyeIcon className="h-4 w-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {totalApplications > PAGE_SIZE && (
                          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-gray-200">
                            <div className="text-sm text-gray-600">
                              Page {applicationsPage} of {Math.max(1, Math.ceil(totalApplications / PAGE_SIZE))}
                            </div>
                            <div className="space-x-2">
                              <button
                                className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                                disabled={applicationsPage <= 1}
                                onClick={() => setApplicationsPage(p => Math.max(1, p - 1))}
                              >
                                Previous
                              </button>
                              <button
                                className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                                disabled={applicationsPage >= Math.ceil(totalApplications / PAGE_SIZE)}
                                onClick={() => setApplicationsPage(p => p + 1)}
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Active Veterinarians Tab */}
              {activeTab === 'active' && (
                <div className="space-y-6">
                  {/* Statistics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <UserGroupIcon className="h-8 w-8 text-blue-400" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">Total Veterinarians</dt>
                              <dd className="text-lg font-medium text-gray-900">{vetStats.total}</dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <CheckCircleIcon className="h-8 w-8 text-green-400" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">Available</dt>
                              <dd className="text-lg font-medium text-gray-900">{vetStats.available}</dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <XCircleIcon className="h-8 w-8 text-red-400" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">Unavailable</dt>
                              <dd className="text-lg font-medium text-gray-900">{vetStats.unavailable}</dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <UserIcon className="h-8 w-8 text-purple-400" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">Active Profiles</dt>
                              <dd className="text-lg font-medium text-gray-900">{vetStats.activeProfiles}</dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Search and Filter */}
                  <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                    <div className="p-6">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="text"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              placeholder="Search by name, email, or license number..."
                            />
                          </div>
                        </div>
                        <div className="sm:w-48">
                          <select
                            value={availabilityFilter}
                            onChange={(e) => setAvailabilityFilter(e.target.value as any)}
                            className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                          >
                            <option value="all">All Availability</option>
                            <option value="available">Available</option>
                            <option value="unavailable">Unavailable</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Veterinarians List */}
                  <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                    {activeVetsLoading ? (
                      <div className="p-12 text-center">
                        <div className="inline-flex items-center">
                          <ArrowPathIcon className="animate-spin h-5 w-5 text-blue-500 mr-3" />
                          Loading veterinarians...
                        </div>
                      </div>
                    ) : filteredActiveVets.length === 0 ? (
                      <div className="p-12 text-center">
                        <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No veterinarians found</h3>
                        <p className="mt-1 text-sm text-gray-500">No active veterinarians match your search criteria.</p>
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Veterinarian</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {filteredActiveVets.map((vet) => (
                                <tr key={vet.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="flex-shrink-0 h-10 w-10">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                          <AcademicCapIcon className="h-6 w-6 text-blue-600" />
                                        </div>
                                      </div>
                                      <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">Dr. {vet.full_name}</div>
                                        <div className="text-sm text-gray-500">{vet.profiles.email}</div>
                                        <div className="text-sm text-gray-500">{vet.specialization || 'General Practice'}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {vet.license_number}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {vet.years_experience} years
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    ₱{vet.consultation_fee}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    ⭐ {vet.average_rating}/5.0
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
                                    <button
                                      onClick={() => {
                                        setSelectedVet(vet);
                                        setShowVetModal(true);
                                      }}
                                      className="text-blue-600 hover:text-blue-900 mr-2"
                                    >
                                      <EyeIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleToggleVetAvailability(vet.id, !vet.is_available)}
                                      className={`${
                                        vet.is_available ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                                      }`}
                                    >
                                      {vet.is_available ? '🚫' : '✅'}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {totalActiveVets > PAGE_SIZE && (
                          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-gray-200">
                            <div className="text-sm text-gray-600">
                              Page {activeVetsPage} of {Math.max(1, Math.ceil(totalActiveVets / PAGE_SIZE))}
                            </div>
                            <div className="space-x-2">
                              <button
                                className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                                disabled={activeVetsPage <= 1}
                                onClick={() => setActiveVetsPage(p => Math.max(1, p - 1))}
                              >
                                Previous
                              </button>
                              <button
                                className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                                disabled={activeVetsPage >= Math.ceil(totalActiveVets / PAGE_SIZE)}
                                onClick={() => setActiveVetsPage(p => p + 1)}
                              >
                                Next
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Create Veterinarian Tab */}
              {activeTab === 'create' && (
                <div className="max-w-2xl mx-auto">
                  <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">Create New Veterinarian Account</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Create a veterinarian account directly in the system with pre-defined credentials.
                      </p>
                    </div>
                    <form onSubmit={handleCreateVeterinarian} className="px-6 py-6 space-y-6">
                      {createError && (
                        <div className="rounded-md bg-red-50 p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-red-800">
                                Error creating veterinarian
                              </h3>
                              <div className="mt-2 text-sm text-red-700">
                                {createError}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {createSuccess && (
                        <div className="rounded-md bg-green-50 p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <CheckCircleIcon className="h-5 w-5 text-green-400" />
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-green-800">
                                Success!
                              </h3>
                              <div className="mt-2 text-sm text-green-700">
                                {createSuccess}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={createFormData.full_name}
                            onChange={(e) => setCreateFormData({...createFormData, full_name: e.target.value})}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Dr. John Doe"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            required
                            value={createFormData.email}
                            onChange={(e) => setCreateFormData({...createFormData, email: e.target.value})}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="john.doe@veterinary.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Password *
                          </label>
                          <input
                            type="password"
                            required
                            value={createFormData.password}
                            onChange={(e) => setCreateFormData({...createFormData, password: e.target.value})}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Secure password"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            License Number *
                          </label>
                          <input
                            type="text"
                            required
                            value={createFormData.license_number}
                            onChange={(e) => setCreateFormData({...createFormData, license_number: e.target.value})}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="VET-12345"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Specialization
                          </label>
                          <input
                            type="text"
                            value={createFormData.specialization}
                            onChange={(e) => setCreateFormData({...createFormData, specialization: e.target.value})}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="General Practice"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Years of Experience
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={createFormData.years_experience}
                            onChange={(e) => setCreateFormData({...createFormData, years_experience: parseInt(e.target.value) || 0})}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="5"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Consultation Fee (₱)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={createFormData.consultation_fee}
                            onChange={(e) => setCreateFormData({...createFormData, consultation_fee: parseInt(e.target.value) || 0})}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Clinic ID (Optional)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={createFormData.clinic_id || ''}
                            onChange={(e) => setCreateFormData({...createFormData, clinic_id: e.target.value ? parseInt(e.target.value) : null})}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="1"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={createLoading}
                          className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {createLoading ? (
                            <>
                              <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                              Creating...
                            </>
                          ) : (
                            'Create Veterinarian'
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Application Detail Modal */}
              {showApplicationModal && selectedApplication && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Veterinarian Application Review - {selectedApplication.full_name}
                      </h3>
                      
                      <div className="space-y-4">
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
                            <p className="text-sm font-medium text-gray-700">Applied</p>
                            <p className="text-sm text-gray-900">{new Date(selectedApplication.created_at).toLocaleDateString()}</p>
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

                      <div className="flex justify-end space-x-3 mt-6">
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
                                <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
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
                                <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
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
                            <p className="text-sm text-gray-900">⭐ {selectedVet.average_rating}/5.0</p>
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
      </div>
    </ProtectedRoute>
  );
}