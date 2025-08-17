'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
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
  ArrowRightOnRectangleIcon
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

interface CreateVetFormData {
  email: string;
  full_name: string;
  password: string;
  specialization: string;
  license_number: string;
  years_experience: number;
  consultation_fee: number;
  clinic_id: number | null;
}

export default function AdminDashboard() {
  const { user, userProfile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
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
  const [services, setServices] = useState<any[]>([]);
  const [veterinarians, setVeterinarians] = useState<any[]>([]);
  
  const [showCreateVetModal, setShowCreateVetModal] = useState(false);
  const [createVetForm, setCreateVetForm] = useState<CreateVetFormData>({
    email: '',
    full_name: '',
    password: '',
    specialization: '',
    license_number: '',
    years_experience: 0,
    consultation_fee: 0,
    clinic_id: null
  });
  const [isCreatingVet, setIsCreatingVet] = useState(false);
  const [createVetError, setCreateVetError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user && userProfile?.user_role === 'admin') {
      fetchAdminData();
    }
  }, [user, userProfile]);

  const fetchAdminData = async () => {
    try {
      // Fetch all statistics
      const [
        { count: totalUsers },
        { count: totalClinics },
        { count: totalAppointments },
        { count: totalVeterinarians }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('clinics').select('*', { count: 'exact', head: true }),
        supabase.from('appointments').select('*', { count: 'exact', head: true }),
        supabase.from('veterinarians').select('*', { count: 'exact', head: true })
      ]);

      // Fetch monthly appointments for the last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const { data: monthlyData } = await supabase
        .from('appointments')
        .select('appointment_date, status')
        .gte('appointment_date', sixMonthsAgo.toISOString().split('T')[0])
        .order('appointment_date', { ascending: true });

      // Fetch top rated clinics
      const { data: topClinics } = await supabase
        .from('clinics')
        .select(`
          *,
          reviews(rating)
        `)
        .eq('is_active', true)
        .limit(5);

      // Fetch recent activity (recent appointments)
      const { data: recentActivity } = await supabase
        .from('appointments')
        .select(`
          *,
          patients(name, species),
          pet_owner_profiles(full_name),
          veterinarians(full_name),
          clinics(name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      // Process monthly appointments data
      const monthlyAppointments = processMonthlyData(monthlyData || []);
      
      // Calculate average ratings for clinics
      const topRatedClinics = (topClinics || []).map(clinic => ({
        ...clinic,
        averageRating: clinic.reviews?.length > 0 
          ? clinic.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / clinic.reviews.length
          : 0
      })).sort((a, b) => b.averageRating - a.averageRating);

      setAdminStats({
        totalUsers: totalUsers || 0,
        totalClinics: totalClinics || 0,
        totalAppointments: totalAppointments || 0,
        totalVeterinarians: totalVeterinarians || 0,
        monthlyAppointments,
        topRatedClinics,
        recentActivity: recentActivity || [],
        loading: false
      });

    } catch (error) {
      console.error('Error fetching admin data:', error);
      setAdminStats(prev => ({ ...prev, loading: false }));
    }
  };

  const fetchTabData = async (tab: string) => {
    try {
      switch (tab) {
        case 'users':
          const { data: usersData } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
          setUsers(usersData || []);
          break;
        case 'clinics':
          const { data: clinicsData } = await supabase
            .from('clinics')
            .select('*')
            .order('created_at', { ascending: false });
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
        case 'services':
          const { data: servicesData } = await supabase
            .from('services')
            .select(`
              *,
              clinics(name)
            `)
            .order('created_at', { ascending: false });
          setServices(servicesData || []);
          break;
        case 'veterinarians':
          const { data: vetsData } = await supabase
            .from('veterinarians')
            .select(`
              *,
              clinics(name)
            `)
            .order('created_at', { ascending: false });
          setVeterinarians(vetsData || []);
          break;
      }
    } catch (error) {
      console.error(`Error fetching ${tab} data:`, error);
    }
  };

  const processMonthlyData = (data: any[]) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyStats: { [key: string]: number } = {};
    
    data.forEach(appointment => {
      const date = new Date(appointment.appointment_date);
      const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      monthlyStats[monthKey] = (monthlyStats[monthKey] || 0) + 1;
    });

    return Object.entries(monthlyStats).map(([month, count]) => ({
      month,
      appointments: count
    })).slice(-6);
  };

  const handleCreateVeterinarian = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingVet(true);
    setCreateVetError('');

    try {
      // Test environment variables first
      console.log('Testing environment variables...');
      const envTest = await fetch('/api/test-env', {
        credentials: 'include'
      });
      
      if (!envTest.ok) {
        console.log('Environment test failed:', envTest.status);
        throw new Error('Unable to verify environment variables. Please check your configuration.');
      }
      
      const envData = await envTest.json();
      console.log('Environment test result:', envData);
      
      if (envData.supabaseUrl === 'NOT SET' || envData.serviceRoleKey === 'NOT SET') {
        throw new Error('Environment variables are not properly configured. Please check your .env.local file.');
      }
      const response = await fetch('/api/admin/create-veterinarian', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(createVetForm),
      });

      if (!response.ok) {
        // Try to parse error from response
        let errorMessage = 'Failed to create veterinarian';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Success!
      alert(`Veterinarian created successfully!\n\nEmail: ${data.data.email}\nFull Name: ${data.data.full_name}\n\nThe veterinarian can now log in with their provided credentials.`);
      
      // Reset form and close modal
      setShowCreateVetModal(false);
      setCreateVetForm({
        email: '',
        full_name: '',
        password: '',
        specialization: '',
        license_number: '',
        years_experience: 0,
        consultation_fee: 0,
        clinic_id: null
      });
      
      // Refresh data
      if (activeTab === 'veterinarians') {
        fetchTabData('veterinarians');
      }
      fetchAdminData();

    } catch (error: any) {
      console.error('Error creating veterinarian:', error);
      console.error('Error stack:', error.stack);
      
      // Check if it's a network/parsing error
      if (error.message.includes('<!DOCTYPE')) {
        setCreateVetError('API endpoint not found. Please check that the server is running and the API route exists.');
      } else if (error.message.includes('JSON')) {
        setCreateVetError('Received invalid response from server. Check server logs for errors.');
      } else {
        setCreateVetError(error.message || 'Failed to create veterinarian');
      }
    } finally {
      setIsCreatingVet(false);
    }
  };

  const generateRandomPassword = () => {
    return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab !== 'overview') {
      fetchTabData(tab);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
      <div className="flex items-center">
        <div className={`p-2 sm:p-3 rounded-lg ${color}`}>
          <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
        </div>
        <div className="ml-2 sm:ml-4 min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  if (adminStats.loading) {
    return (
      <ProtectedRoute requiredRole="admin">
        <DashboardLayout>
          <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <DashboardLayout>
        <div className="min-h-screen bg-[#faf9f7] pb-20">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 pt-16 pb-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-center sm:text-left">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                    Admin Dashboard 🚀
                  </h1>
                  <p className="text-purple-100 mt-1 text-sm sm:text-base">
                    Monitor and manage your ZamboVet platform
                  </p>
                </div>
                <div className="flex gap-2 sm:gap-3">
                  <button
                    onClick={() => setShowCreateVetModal(true)}
                    className="bg-white text-purple-600 px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
                  >
                    <UserPlusIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Create Veterinarian</span>
                    <span className="sm:hidden">Add Vet</span>
                  </button>
                  <button
                    onClick={signOut}
                    className="bg-red-500 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Sign Out</span>
                    <span className="sm:hidden">Exit</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 -mt-4">
            {/* Navigation Tabs */}
            <div className="bg-white rounded-lg shadow-md mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex overflow-x-auto scrollbar-hide px-3 sm:px-6">
                  {[
                    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
                    { id: 'users', name: 'Users', icon: UserGroupIcon },
                    { id: 'clinics', name: 'Clinics', icon: BuildingOfficeIcon },
                    { id: 'veterinarians', name: 'Vets', icon: UserGroupIcon },
                    { id: 'appointments', name: 'Appointments', icon: CalendarDaysIcon },
                    { id: 'services', name: 'Services', icon: CogIcon }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`group inline-flex items-center py-4 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-purple-500 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <tab.icon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">{tab.name}</span>
                      <span className="sm:hidden">{tab.id === 'veterinarians' ? 'Vets' : tab.name}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                  <StatCard
                    title="Total Users"
                    value={adminStats.totalUsers}
                    icon={UserGroupIcon}
                    color="bg-blue-500"
                  />
                  <StatCard
                    title="Total Clinics"
                    value={adminStats.totalClinics}
                    icon={BuildingOfficeIcon}
                    color="bg-green-500"
                  />
                  <StatCard
                    title="Appointments"
                    value={adminStats.totalAppointments}
                    icon={CalendarDaysIcon}
                    color="bg-yellow-500"
                  />
                  <StatCard
                    title="Veterinarians"
                    value={adminStats.totalVeterinarians}
                    icon={UserGroupIcon}
                    color="bg-purple-500"
                  />
                </div>

                {/* Charts and Reports Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Monthly Appointments Chart */}
                  <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Monthly Appointments</h3>
                    <div className="space-y-3">
                      {adminStats.monthlyAppointments.map((month, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm text-gray-600 truncate flex-shrink-0 mr-2">{month.month}</span>
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            <div 
                              className="bg-blue-200 h-2 rounded flex-1 max-w-[80px] sm:max-w-[100px]"
                              style={{ width: `${Math.max(20, (month.appointments / Math.max(...adminStats.monthlyAppointments.map(m => m.appointments))) * 80)}px` }}
                            ></div>
                            <span className="text-xs sm:text-sm font-medium flex-shrink-0">{month.appointments}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Rated Clinics */}
                  <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Top Rated Clinics</h3>
                    <div className="space-y-3">
                      {adminStats.topRatedClinics.slice(0, 5).map((clinic, index) => (
                        <div key={clinic.id} className="flex items-start justify-between">
                          <div className="min-w-0 flex-1 mr-2">
                            <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{clinic.name}</p>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">{clinic.address}</p>
                          </div>
                          <div className="flex items-center space-x-1 flex-shrink-0">
                            <StarIcon className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-current" />
                            <span className="text-xs sm:text-sm font-medium">
                              {clinic.averageRating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  
                  {/* Mobile Cards */}
                  <div className="lg:hidden space-y-3">
                    {adminStats.recentActivity.slice(0, 10).map((activity) => (
                      <div key={activity.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900 text-sm">
                              {activity.patients?.name} ({activity.patients?.species})
                            </h4>
                            <p className="text-xs text-gray-600">Owner: {activity.pet_owner_profiles?.full_name}</p>
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            activity.status === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : activity.status === 'confirmed'
                              ? 'bg-blue-100 text-blue-800'
                              : activity.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {activity.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>Vet: {activity.veterinarians?.full_name || 'Not assigned'}</p>
                          <p>Clinic: {activity.clinics?.name}</p>
                          <p>Date: {new Date(activity.appointment_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Patient
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Owner
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Veterinarian
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Clinic
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {adminStats.recentActivity.slice(0, 10).map((activity) => (
                          <tr key={activity.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {activity.patients?.name} ({activity.patients?.species})
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {activity.pet_owner_profiles?.full_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {activity.veterinarians?.full_name || 'Not assigned'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {activity.clinics?.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(activity.appointment_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                activity.status === 'completed' 
                                  ? 'bg-green-100 text-green-800'
                                  : activity.status === 'confirmed'
                                  ? 'bg-blue-100 text-blue-800'
                                  : activity.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {activity.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                
                {/* Mobile Cards */}
                <div className="md:hidden">
                  {users.map((user: any) => (
                    <div key={user.id} className="p-4 border-b border-gray-200 last:border-b-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{user.full_name || 'N/A'}</h4>
                          <p className="text-sm text-gray-600 break-all">{user.email}</p>
                        </div>
                        <div className="flex space-x-2 ml-2">
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
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.user_role === 'admin' 
                            ? 'bg-red-100 text-red-800'
                            : user.user_role === 'veterinarian'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {user.user_role}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.is_active 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Joined: {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
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

            {/* Similar table structures for other tabs */}
            {activeTab === 'clinics' && (
              <div className="bg-white rounded-lg shadow-md">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Clinic Management</h3>
                  <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2">
                    <PlusIcon className="w-4 h-4" />
                    <span>Add Clinic</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Address
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Emergency
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
                        <tr key={clinic.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {clinic.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {clinic.address}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {clinic.phone || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              clinic.is_emergency_available 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {clinic.is_emergency_available ? 'Available' : 'Not Available'}
                            </span>
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

            {/* Veterinarians Tab */}
            {activeTab === 'veterinarians' && (
              <div className="bg-white rounded-lg shadow-md">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Veterinarian Management</h3>
                  <button 
                    onClick={() => setShowCreateVetModal(true)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                  >
                    <UserPlusIcon className="w-4 h-4" />
                    <span>Add Veterinarian</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Specialization
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Clinic
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Experience
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fee
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rating
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {veterinarians.map((vet: any) => (
                        <tr key={vet.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {vet.full_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {vet.specialization || 'General'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {vet.clinics?.name || 'Not assigned'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {vet.years_experience} years
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₱{vet.consultation_fee.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="ml-1">{vet.average_rating.toFixed(1)}</span>
                            </div>
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
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Appointment Management</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Patient
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Owner
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Veterinarian
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Clinic
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
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
                      {appointments.map((appointment: any) => (
                        <tr key={appointment.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {appointment.patients?.name} ({appointment.patients?.species})
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {appointment.pet_owner_profiles?.full_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {appointment.veterinarians?.full_name || 'Not assigned'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {appointment.clinics?.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(appointment.appointment_date).toLocaleDateString()} at {appointment.appointment_time}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              appointment.status === 'completed' 
                                ? 'bg-green-100 text-green-800'
                                : appointment.status === 'confirmed'
                                ? 'bg-blue-100 text-blue-800'
                                : appointment.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : appointment.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {appointment.status}
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

            {/* Services Tab */}
            {activeTab === 'services' && (
              <div className="bg-white rounded-lg shadow-md">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Service Management</h3>
                  <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2">
                    <PlusIcon className="w-4 h-4" />
                    <span>Add Service</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Clinic
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration
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
                      {services.map((service: any) => (
                        <tr key={service.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {service.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {service.clinics?.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₱{service.price.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {service.duration_minutes} min
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              service.is_active 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {service.is_active ? 'Active' : 'Inactive'}
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
          </div>

          {/* Create Veterinarian Modal */}
          {showCreateVetModal && (
            <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-6 rounded-t-2xl relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                        <SparklesIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Add New Veterinarian</h3>
                        <p className="text-purple-100 text-sm">Join our amazing team of professionals</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowCreateVetModal(false)}
                      className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleCreateVeterinarian} className="p-6 space-y-6">
                  {/* Error Message */}
                  {createVetError && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl">
                      <p className="text-sm font-medium">Error: {createVetError}</p>
                    </div>
                  )}
                  {/* Email Field */}
                  <div className="group">
                    <label className="flex items-center text-sm font-semibold text-gray-800 mb-2">
                      <EnvelopeIcon className="w-4 h-4 mr-2 text-purple-600" />
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={createVetForm.email}
                        onChange={(e) => setCreateVetForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 pl-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900 placeholder:text-gray-500"
                        placeholder="veterinarian@email.com"
                      />
                      <EnvelopeIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  {/* Full Name Field */}
                  <div className="group">
                    <label className="flex items-center text-sm font-semibold text-gray-800 mb-2">
                      <UserIcon className="w-4 h-4 mr-2 text-purple-600" />
                      Full Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={createVetForm.full_name}
                        onChange={(e) => setCreateVetForm(prev => ({ ...prev, full_name: e.target.value }))}
                        className="w-full px-4 py-3 pl-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900 placeholder:text-gray-500"
                        placeholder="Dr. John Smith"
                      />
                      <UserIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="group">
                    <label className="flex items-center text-sm font-semibold text-gray-800 mb-2">
                      <KeyIcon className="w-4 h-4 mr-2 text-purple-600" />
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={createVetForm.password}
                        onChange={(e) => setCreateVetForm(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-4 py-3 pl-10 pr-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900 placeholder:text-gray-500"
                        placeholder="Create a secure password"
                        minLength={6}
                      />
                      <KeyIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="w-4 h-4" />
                        ) : (
                          <EyeIcon className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Minimum 6 characters required</p>
                  </div>

                  {/* Specialization Field */}
                  <div className="group">
                    <label className="flex items-center text-sm font-semibold text-gray-800 mb-2">
                      <AcademicCapIcon className="w-4 h-4 mr-2 text-purple-600" />
                      Specialization
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={createVetForm.specialization}
                        onChange={(e) => setCreateVetForm(prev => ({ ...prev, specialization: e.target.value }))}
                        className="w-full px-4 py-3 pl-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900 placeholder:text-gray-500"
                        placeholder="e.g., Small Animal Surgery, Cardiology"
                      />
                      <AcademicCapIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  {/* License Number Field */}
                  <div className="group">
                    <label className="flex items-center text-sm font-semibold text-gray-800 mb-2">
                      <DocumentTextIcon className="w-4 h-4 mr-2 text-purple-600" />
                      License Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={createVetForm.license_number}
                        onChange={(e) => setCreateVetForm(prev => ({ ...prev, license_number: e.target.value }))}
                        className="w-full px-4 py-3 pl-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900 placeholder:text-gray-500"
                        placeholder="VET123456789"
                      />
                      <DocumentTextIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  {/* Experience and Fee Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="group">
                      <label className="flex items-center text-sm font-semibold text-gray-800 mb-2">
                        <ClockIcon className="w-4 h-4 mr-2 text-purple-600" />
                        Years Experience
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          value={createVetForm.years_experience}
                          onChange={(e) => setCreateVetForm(prev => ({ ...prev, years_experience: parseInt(e.target.value) || 0 }))}
                          className="w-full px-4 py-3 pl-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900 placeholder:text-gray-500"
                          placeholder="5"
                        />
                        <ClockIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                    <div className="group">
                      <label className="flex items-center text-sm font-semibold text-gray-800 mb-2">
                        <span className="text-purple-600 mr-2 font-bold">₱</span>
                        Consultation Fee (PHP)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={createVetForm.consultation_fee}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Allow only numbers and decimal point
                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                              setCreateVetForm(prev => ({ ...prev, consultation_fee: parseFloat(value) || 0 }));
                            }
                          }}
                          className="w-full px-4 py-3 pl-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900 placeholder:text-gray-500"
                          placeholder="1500.00"
                        />
                        <span className="absolute left-3 top-3.5 w-4 h-4 text-gray-400 font-bold">₱</span>
                      </div>
                    </div>
                  </div>

                  {/* Clinic Selection */}
                  <div className="group">
                    <label className="flex items-center text-sm font-semibold text-gray-800 mb-2">
                      <BuildingOfficeIcon className="w-4 h-4 mr-2 text-purple-600" />
                      Clinic Assignment
                      <span className="text-xs text-gray-500 ml-2">(Optional)</span>
                    </label>
                    <div className="relative">
                      <select
                        value={createVetForm.clinic_id || ''}
                        onChange={(e) => setCreateVetForm(prev => ({ ...prev, clinic_id: e.target.value ? parseInt(e.target.value) : null }))}
                        className="w-full px-4 py-3 pl-10 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-50 focus:bg-white appearance-none text-gray-900"
                      >
                        <option value="">Select a clinic</option>
                        {clinics.map((clinic: any) => (
                          <option key={clinic.id} value={clinic.id}>
                            {clinic.name}
                          </option>
                        ))}
                      </select>
                      <BuildingOfficeIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                      <div className="absolute right-3 top-3.5 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateVetModal(false);
                        setCreateVetError('');
                      }}
                      disabled={isCreatingVet}
                      className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingVet}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isCreatingVet ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Creating...</span>
                        </div>
                      ) : (
                        '✨ Create Veterinarian'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
