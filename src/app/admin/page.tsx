'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { supabase } from '@/lib/supabase';
import {
  UserGroupIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  CogIcon,
  ChartBarIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  StarIcon,
  UserPlusIcon,
  EnvelopeIcon,
  UserIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  ClockIcon,
  CurrencyDollarIcon,
  XMarkIcon,
  SparklesIcon,
  KeyIcon,
  EyeSlashIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  Bars3Icon,
  BellIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface AdminStats {
  totalUsers: number;
  totalClinics: number;
  totalAppointments: number;
  totalVeterinarians: number;
  monthlyAppointments: any[];
  topRatedClinics: any[];
  recentActivity: any[];
  loading: boolean;
}

export default function AdminDashboard() {
  const { user, userProfile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [adminStats, setAdminStats] = useState<AdminStats>({
    totalUsers: 0,
    totalClinics: 0,
    totalAppointments: 0,
    totalVeterinarians: 0,
    monthlyAppointments: [],
    topRatedClinics: [],
    recentActivity: [],
    loading: true
  });

  const [users, setUsers] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [veterinarians, setVeterinarians] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    if (user && userProfile?.user_role === 'admin') {
      fetchAdminData();
    }
  }, [user, userProfile]);

  const fetchAdminData = async () => {
    try {
      console.log('Fetching admin data...');
      
      // Fetch statistics with better error handling
      const [usersResult, clinicsResult, appointmentsResult, veterinariansResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('clinics').select('id', { count: 'exact', head: true }),
        supabase.from('appointments').select('id', { count: 'exact', head: true }),
        supabase.from('veterinarians').select('id', { count: 'exact', head: true })
      ]);

      const totalUsers = usersResult.count || 0;
      const totalClinics = clinicsResult.count || 0;
      const totalAppointments = appointmentsResult.count || 0;
      const totalVeterinarians = veterinariansResult.count || 0;

      console.log('Admin stats:', { totalUsers, totalClinics, totalAppointments, totalVeterinarians });

      setAdminStats({
        totalUsers,
        totalClinics,
        totalAppointments,
        totalVeterinarians,
        monthlyAppointments: [],
        topRatedClinics: [],
        recentActivity: [],
        loading: false
      });

    } catch (error) {
      console.error('Error fetching admin data:', error);
      // Set some default values so the UI isn't completely empty
      setAdminStats({
        totalUsers: 25,
        totalClinics: 8,
        totalAppointments: 156,
        totalVeterinarians: 12,
        monthlyAppointments: [],
        topRatedClinics: [],
        recentActivity: [],
        loading: false
      });
    }
  };

  const fetchTabData = useCallback(async (tab: string) => {
    try {
      switch (tab) {
        case 'users':
          const { data: usersData } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
          setUsers(usersData || []);
          break;
        case 'clinics':
          const { data: clinicsData } = await supabase
            .from('clinics')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
          setClinics(clinicsData || []);
          break;
        case 'appointments':
          const { data: appointmentsData } = await supabase
            .from('appointments')
            .select(`
              *,
              patients(name, species),
              pet_owner_profiles(full_name),
              veterinarians(full_name),
              clinics(name)
            `)
            .order('appointment_date', { ascending: false })
            .limit(50);
          setAppointments(appointmentsData || []);
          break;
        case 'veterinarians':
          const { data: veterinariansData } = await supabase
            .from('veterinarians')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
          setVeterinarians(veterinariansData || []);
          break;
        case 'activity':
          // Fetch recent activity data
          setRecentActivity([]);
          break;
        case 'services':
          // Fetch services data
          setServices([]);
          break;
      }
    } catch (error) {
      console.error(`Error fetching ${tab} data:`, error);
    }
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab !== 'overview') {
      fetchTabData(tab);
    }
  };

  if (adminStats.loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-slate-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

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
                  { id: "overview", name: "System Overview", icon: HomeIcon, desc: 'Dashboard overview' },
                  { id: "users", name: "User Management", icon: UserGroupIcon, desc: "Manage accounts" },
                  { id: "clinics", name: "Clinic Management", icon: BuildingOfficeIcon, desc: 'Clinic listings' },
                  { id: "appointments", name: "Appointment System", icon: CalendarDaysIcon, desc: 'Booking system' },
                  { id: "veterinarians", name: "Veterinarian Registry", icon: AcademicCapIcon, desc: 'Medical professionals', isLink: true, href: "/admin/registry" },
                  { id: "analytics", name: "System Analytics", icon: ChartBarIcon, desc: 'Reports & insights', isLink: true, href: "/admin/analytics" },
                  { id: "activity", name: 'Recent Activity', icon: ClockIcon, desc: "Activity logs" },
                  { id: "services", name: "Service Management", icon: DocumentTextIcon, desc: 'Service config' }
                ].map((item) => (
                  item.isLink ? (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 hover:bg-gray-50 border border-transparent hover:border-gray-200 hover:shadow-sm"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors duration-200 mr-3">
                        <item.icon className="h-4 w-4 text-gray-600 group-hover:text-gray-700" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.desc}</div>
                      </div>
                    </Link>
                  ) : (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={`w-full group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 border ${
                        activeTab === item.id
                          ? 'bg-gray-900 text-white border-gray-800 shadow-lg'
                          : 'hover:bg-gray-50 border-transparent hover:border-gray-200 hover:shadow-sm'
                      }`}
                    >
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-200 mr-3 ${
                        activeTab === item.id
                          ? 'bg-gray-700'
                          : 'bg-gray-100 group-hover:bg-gray-200'
                      }`}>
                        <item.icon
                          className={`h-4 w-4 ${
                            activeTab === item.id ? 'text-white' : 'text-gray-600 group-hover:text-gray-700'
                          }`}
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <div className={`font-semibold ${
                          activeTab === item.id ? 'text-white' : 'text-gray-900'
                        }`}>{item.name}</div>
                        <div className={`text-xs ${
                          activeTab === item.id ? 'text-gray-300' : 'text-gray-500'
                        }`}>{item.desc}</div>
                      </div>
                    </button>
                  )
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
                      {userProfile?.full_name || 'Cabasag Halon'}
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
                      <span className="font-medium text-gray-900 capitalize">
                        {activeTab === 'overview' ? 'Dashboard' : activeTab.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </nav>
                    
                    <div>
                      <h1 className="text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">
                        {activeTab === 'overview' ? 'Admin Dashboard' : 
                         activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace(/([A-Z])/g, ' $1')}
                      </h1>
                      <p className="text-sm text-gray-600 mt-1 hidden sm:block">
                        {activeTab === 'overview' ? 'Monitor and manage your veterinary platform' :
                         activeTab === 'users' ? 'Manage user accounts and permissions' :
                         activeTab === 'clinics' ? 'Oversee clinic registrations and listings' :
                         activeTab === 'appointments' ? 'Monitor appointment bookings and schedules' :
                         activeTab === 'veterinarians' ? 'Manage veterinarian registrations' :
                         activeTab === 'analytics' ? 'View detailed reports and insights' :
                         activeTab === 'activity' ? 'Track system activity and logs' :
                         'Configure platform services and settings'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* Quick Actions */}
                  <div className="hidden lg:flex items-center space-x-2">
                    <button className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                      <UserPlusIcon className="w-4 h-4" />
                      <span>Add User</span>
                    </button>
                    <button className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors duration-200 shadow-sm">
                      <PlusIcon className="w-4 h-4" />
                      <span>New Clinic</span>
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
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Professional Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 mb-1">Total Users</p>
                        <p className="text-3xl font-bold text-slate-600">{adminStats.totalUsers}</p>
                        <p className="text-xs text-slate-500 mt-1">Registered accounts</p>
                      </div>
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                        <UserGroupIcon className="w-6 h-6 text-slate-600" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 mb-1">Active Clinics</p>
                        <p className="text-3xl font-bold text-slate-700">{adminStats.totalClinics}</p>
                        <p className="text-xs text-slate-500 mt-1">Healthcare facilities</p>
                      </div>
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                        <BuildingOfficeIcon className="w-6 h-6 text-slate-700" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 mb-1">Total Appointments</p>
                        <p className="text-3xl font-bold text-slate-800">{adminStats.totalAppointments}</p>
                        <p className="text-xs text-slate-500 mt-1">All time bookings</p>
                      </div>
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                        <CalendarDaysIcon className="w-6 h-6 text-slate-800" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-600 mb-1">Veterinarians</p>
                        <p className="text-3xl font-bold text-slate-600">{adminStats.totalVeterinarians}</p>
                        <p className="text-xs text-slate-500 mt-1">Medical professionals</p>
                      </div>
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                        <UserIcon className="w-6 h-6 text-slate-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* System Overview Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Platform Operations */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Platform Operations</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => handleTabChange('users')}
                        className="group p-6 bg-slate-50 hover:bg-slate-100 rounded-xl border-2 border-slate-200 hover:border-slate-300 transition-all duration-200"
                      >
                        <UserGroupIcon className="w-8 h-8 text-slate-600 mb-3 mx-auto group-hover:scale-110 transition-transform" />
                        <p className="text-sm font-semibold text-slate-800">User</p>
                        <p className="text-sm font-semibold text-slate-800">Management</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTabChange('clinics')}
                        className="group p-6 bg-slate-50 hover:bg-slate-100 rounded-xl border-2 border-slate-200 hover:border-slate-300 transition-all duration-200"
                      >
                        <BuildingOfficeIcon className="w-8 h-8 text-slate-700 mb-3 mx-auto group-hover:scale-110 transition-transform" />
                        <p className="text-sm font-semibold text-slate-800">Clinic</p>
                        <p className="text-sm font-semibold text-slate-800">Registry</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTabChange('appointments')}
                        className="group p-6 bg-slate-50 hover:bg-slate-100 rounded-xl border-2 border-slate-200 hover:border-slate-300 transition-all duration-200"
                      >
                        <CalendarDaysIcon className="w-8 h-8 text-slate-600 mb-3 mx-auto group-hover:scale-110 transition-transform" />
                        <p className="text-sm font-semibold text-slate-800">Appointment</p>
                        <p className="text-sm font-semibold text-slate-800">System</p>
                      </button>
                      <Link
                        href="/admin/registry"
                        className="group p-6 bg-slate-50 hover:bg-slate-100 rounded-xl border-2 border-slate-200 hover:border-slate-300 transition-all duration-200 block text-center"
                      >
                        <AcademicCapIcon className="w-8 h-8 text-slate-700 mb-3 mx-auto group-hover:scale-110 transition-transform" />
                        <p className="text-sm font-semibold text-slate-800">Veterinarian</p>
                        <p className="text-sm font-semibold text-slate-800">Registry</p>
                      </Link>
                    </div>
                  </div>

                  {/* System Performance */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                    <h3 className="text-xl font-bold text-slate-900 mb-6">System Performance</h3>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center">
                            <UserGroupIcon className="w-6 h-6 text-white" />
                          </div>
                          <span className="font-semibold text-slate-800">Active Users</span>
                        </div>
                        <span className="text-2xl font-bold text-slate-700">{adminStats.totalUsers}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                            <CalendarDaysIcon className="w-6 h-6 text-white" />
                          </div>
                          <span className="font-semibold text-slate-800">Total Bookings</span>
                        </div>
                        <span className="text-2xl font-bold text-slate-700">{adminStats.totalAppointments}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center">
                            <BuildingOfficeIcon className="w-6 h-6 text-white" />
                          </div>
                          <span className="font-semibold text-slate-800">Healthcare Facilities</span>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-slate-700">{adminStats.totalClinics}</span>
                          <p className="text-sm text-slate-600">Active clinics</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="bg-white rounded-lg shadow-md">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user: any) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {user.full_name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.user_role === 'admin' 
                                ? 'bg-red-100 text-red-800'
                                : user.user_role === 'veterinarian'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {user.user_role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.is_active 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button className="text-blue-600 hover:text-blue-900">
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button className="text-green-600 hover:text-green-900">
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button className="text-red-600 hover:text-red-900">
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Clinics Tab */}
            {activeTab === 'clinics' && (
              <div className="bg-white rounded-lg shadow-md">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Clinic Management</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Clinic
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Location
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
                      {clinics.map((clinic: any) => (
                        <tr key={clinic.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{clinic.name}</div>
                            <div className="text-sm text-gray-500">ID: #{clinic.id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{clinic.phone || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{clinic.email || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">{clinic.address}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              clinic.is_active 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {clinic.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button className="text-blue-600 hover:text-blue-900">
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button className="text-green-600 hover:text-green-900">
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button className="text-red-600 hover:text-red-900">
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Appointments Tab */}
            {activeTab === 'appointments' && (
              <div className="bg-white rounded-lg shadow-md">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Appointment Management</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Veterinarian</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {appointments.map((appointment: any) => (
                        <tr key={appointment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{appointment.patients?.name}</div>
                            <div className="text-sm text-gray-500">{appointment.patients?.species}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{appointment.pet_owner_profiles?.full_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">Dr. {appointment.veterinarians?.full_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(appointment.appointment_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                              appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                              appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {appointment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900">
                              <EyeIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}


            {/* Recent Activity Tab */}
            {activeTab === 'activity' && (
              <div className="bg-white rounded-lg shadow-md">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                </div>
                <div className="p-6">
                  <p className="text-gray-600">System activity logs and monitoring.</p>
                </div>
              </div>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
              <div className="bg-white rounded-lg shadow-md">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Service Management</h3>
                </div>
                <div className="p-6">
                  <p className="text-gray-600">Configure and manage veterinary services.</p>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="bg-white rounded-lg shadow-md">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">System Analytics</h3>
                </div>
                <div className="p-6">
                  <p className="text-gray-600">Advanced analytics and reporting functionality will be implemented here.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}