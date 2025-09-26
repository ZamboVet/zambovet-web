'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { supabase } from '@/lib/supabase';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
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
  ChevronRightIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  HeartIcon
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
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [landingPageSettings, setLandingPageSettings] = useState<any>({
    heroTitle: 'Professional Pet Care Made Simple',
    heroSubtitle: 'Book veterinary appointments online, manage your pet\'s health records, and connect with experienced veterinarians who care about your furry family members.',
    heroButtonText: 'Book Appointment',
    heroLearnMoreText: 'Learn More',
    servicesTitle: 'Our Services',
    servicesSubtitle: 'Comprehensive veterinary care tailored to your pet\'s unique needs',
    aboutTitle: 'Why Choose ZamboVet?',
    aboutSubtitle: 'We combine modern technology with compassionate care to provide the best possible experience for you and your pets. Our platform makes veterinary care accessible, convenient, and stress-free.',
    contactTitle: 'Get In Touch',
    contactSubtitle: 'Have questions? We\'re here to help. Reach out to us anytime.',
    contactPhone: '+639123456789',
    contactEmail: 'vetzambo@gmail.com',
    contactAddress: 'Lorem Ipsum, Zamboanga City',
    companyName: 'ZamboVet',
    primaryColor: '#0032A0',
    secondaryColor: '#b3c7e6',
    accentColor: '#fffbde'
  });
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showClinicModal, setShowClinicModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showVeterinarianModal, setShowVeterinarianModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedClinic, setSelectedClinic] = useState<any>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [selectedVeterinarian, setSelectedVeterinarian] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [updating, setUpdating] = useState(false);

  // Pagination state - reduced page size for faster loading
  const PAGE_SIZE = 5;
  const [usersPage, setUsersPage] = useState(1);
  const [clinicsPage, setClinicsPage] = useState(1);
  const [appointmentsPage, setAppointmentsPage] = useState(1);
  const [veterinariansPage, setVeterinariansPage] = useState(1);

  // Search state
  const [usersSearch, setUsersSearch] = useState('');
  const [clinicsSearch, setClinicsSearch] = useState('');
  const [appointmentsSearch, setAppointmentsSearch] = useState('');
  const [veterinariansSearch, setVeterinariansSearch] = useState('');

  // Total counts for pagination (with search)
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalClinics, setTotalClinics] = useState(0);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [totalVeterinarians, setTotalVeterinarians] = useState(0);

  useEffect(() => {
    if (user && userProfile?.user_role === 'admin') {
      fetchAdminData();
    }
  }, [user, userProfile]);

  // Optimize data fetching by only loading data for active tab
  useEffect(() => {
    if (user && userProfile?.user_role === 'admin' && activeTab !== 'overview') {
      fetchTabData(activeTab);
    }
  }, [activeTab, user, userProfile]);

  const fetchAdminData = async () => {
    try {
      setAdminStats(prev => ({ ...prev, loading: true }));
      
      // Use lightweight count queries with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000) // 10s timeout
      );
      
      const dataPromise = Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('clinics').select('*', { count: 'exact', head: true }),
        supabase.from('appointments').select('*', { count: 'exact', head: true }),
        supabase.from('veterinarians').select('*', { count: 'exact', head: true })
      ]);
      
      const [usersResult, clinicsResult, appointmentsResult, veterinariansResult] = 
        await Promise.race([dataPromise, timeoutPromise]) as any[];

      const totalUsers = usersResult.count || 0;
      const totalClinics = clinicsResult.count || 0;
      const totalAppointments = appointmentsResult.count || 0;
      const totalVeterinarians = veterinariansResult.count || 0;

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
      // Use cached data or reasonable defaults
      setAdminStats({
        totalUsers: 0,
        totalClinics: 0,
        totalAppointments: 0,
        totalVeterinarians: 0,
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
        case 'users': {
          const offset = (usersPage - 1) * PAGE_SIZE;
          let dataQuery = supabase.from('profiles').select('*');
          let countQuery = supabase.from('profiles').select('*', { count: 'exact', head: true });
          
          if (usersSearch.trim()) {
            const searchFilter = `full_name.ilike.%${usersSearch}%,email.ilike.%${usersSearch}%,user_role.ilike.%${usersSearch}%`;
            dataQuery = dataQuery.or(searchFilter);
            countQuery = countQuery.or(searchFilter);
          }
          
          try {
            const [{ data: usersData }, { count }] = await Promise.all([
              dataQuery.order('created_at', { ascending: false }).range(offset, offset + PAGE_SIZE - 1),
              countQuery
            ]);
            
            setUsers(usersData || []);
            setTotalUsers(count || 0);
          } catch (error) {
            console.error('Error fetching users:', error);
            // Set empty data on error instead of crashing
            setUsers([]);
            setTotalUsers(0);
          }
          break;
        }
        case 'clinics': {
          const offset = (clinicsPage - 1) * PAGE_SIZE;
          let dataQuery = supabase.from('clinics').select('*');
          let countQuery = supabase.from('clinics').select('*', { count: 'exact', head: true });
          
          if (clinicsSearch.trim()) {
            const searchFilter = `name.ilike.%${clinicsSearch}%,address.ilike.%${clinicsSearch}%,phone.ilike.%${clinicsSearch}%,email.ilike.%${clinicsSearch}%`;
            dataQuery = dataQuery.or(searchFilter);
            countQuery = countQuery.or(searchFilter);
          }
          
          try {
            const [{ data: clinicsData }, { count }] = await Promise.all([
              dataQuery.order('created_at', { ascending: false }).range(offset, offset + PAGE_SIZE - 1),
              countQuery
            ]);
            
            setClinics(clinicsData || []);
            setTotalClinics(count || 0);
          } catch (error) {
            console.error('Error fetching clinics:', error);
            setClinics([]);
            setTotalClinics(0);
          }
          break;
        }
        case 'appointments': {
          const offset = (appointmentsPage - 1) * PAGE_SIZE;
          let dataQuery = supabase
            .from('appointments')
            .select(`
              *,
              patients(name, species),
              pet_owner_profiles(full_name),
              veterinarians(full_name),
              clinics(name)
            `);
          let countQuery = supabase.from('appointments').select('*', { count: 'exact', head: true });
          
          if (appointmentsSearch.trim()) {
            const searchFilter = `status.ilike.%${appointmentsSearch}%,reason_for_visit.ilike.%${appointmentsSearch}%`;
            dataQuery = dataQuery.or(searchFilter);
            countQuery = countQuery.or(searchFilter);
          }
          
          try {
            const [{ data: appointmentsData }, { count }] = await Promise.all([
              dataQuery.order('appointment_date', { ascending: false }).range(offset, offset + PAGE_SIZE - 1),
              countQuery
            ]);
            
            setAppointments(appointmentsData || []);
            setTotalAppointments(count || 0);
          } catch (error) {
            console.error('Error fetching appointments:', error);
            setAppointments([]);
            setTotalAppointments(0);
          }
          break;
        }
        case 'veterinarians': {
          const offset = (veterinariansPage - 1) * PAGE_SIZE;
          let dataQuery = supabase.from('veterinarians').select('*');
          let countQuery = supabase.from('veterinarians').select('*', { count: 'exact', head: true });
          
          if (veterinariansSearch.trim()) {
            const searchFilter = `full_name.ilike.%${veterinariansSearch}%,specialization.ilike.%${veterinariansSearch}%,contact_email.ilike.%${veterinariansSearch}%`;
            dataQuery = dataQuery.or(searchFilter);
            countQuery = countQuery.or(searchFilter);
          }
          
          try {
            const [{ data: veterinariansData }, { count }] = await Promise.all([
              dataQuery.order('created_at', { ascending: false }).range(offset, offset + PAGE_SIZE - 1),
              countQuery
            ]);
            
            setVeterinarians(veterinariansData || []);
            setTotalVeterinarians(count || 0);
          } catch (error) {
            console.error('Error fetching veterinarians:', error);
            setVeterinarians([]);
            setTotalVeterinarians(0);
          }
          break;
        }
        case 'analytics':
          // Analytics data is handled by the AnalyticsDashboard component itself
          break;
        case 'activity':
          await fetchActivityLogs();
          break;
        case 'settings':
          await fetchLandingPageSettings();
          break;
      }
    } catch (error) {
      console.error(`Error fetching ${tab} data:`, error);
    }
  }, [usersPage, clinicsPage, appointmentsPage, veterinariansPage, usersSearch, clinicsSearch, appointmentsSearch, veterinariansSearch]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab !== 'overview') {
      fetchTabData(tab);
    }
  };

  // Refetch when page changes for the active tab
  useEffect(() => {
    if (activeTab === 'users') fetchTabData('users');
  }, [usersPage, fetchTabData, activeTab]);

  useEffect(() => {
    if (activeTab === 'clinics') fetchTabData('clinics');
  }, [clinicsPage, fetchTabData, activeTab]);

  useEffect(() => {
    if (activeTab === 'appointments') fetchTabData('appointments');
  }, [appointmentsPage, fetchTabData, activeTab]);

  useEffect(() => {
    if (activeTab === 'veterinarians') fetchTabData('veterinarians');
  }, [veterinariansPage, fetchTabData, activeTab]);

  // Reset pagination when search terms change
  useEffect(() => {
    setUsersPage(1);
  }, [usersSearch]);

  useEffect(() => {
    setClinicsPage(1);
  }, [clinicsSearch]);

  useEffect(() => {
    setAppointmentsPage(1);
  }, [appointmentsSearch]);

  useEffect(() => {
    setVeterinariansPage(1);
  }, [veterinariansSearch]);

  const fetchActivityLogs = async () => {
    try {
      setActivityLoading(true);
      
      // Fetch recent user registrations
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      // Fetch recent appointments
      const { data: recentAppointments } = await supabase
        .from('appointments')
        .select(`
          *,
          patients(name, species),
          pet_owner_profiles(full_name),
          veterinarians(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(20);
      
      // Fetch recent clinic registrations
      const { data: recentClinics } = await supabase
        .from('clinics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      // Fetch recent veterinarian applications
      const { data: recentVetApplications } = await supabase
        .from('veterinarian_applications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15);
      
      // Combine and format activity logs
      const activities: any[] = [];
      
      // Add user registrations
      (recentUsers || []).forEach(user => {
        activities.push({
          id: `user_${user.id}`,
          type: 'user_registration',
          title: 'New User Registration',
          description: `${user.full_name || user.email} joined as ${user.user_role}`,
          user: user.full_name || user.email,
          timestamp: user.created_at,
          icon: 'user',
          color: 'blue'
        });
      });
      
      // Add appointments
      (recentAppointments || []).forEach(appointment => {
        activities.push({
          id: `appointment_${appointment.id}`,
          type: 'appointment',
          title: 'New Appointment',
          description: `Appointment for ${appointment.patients?.name} (${appointment.patients?.species}) with Dr. ${appointment.veterinarians?.full_name}`,
          user: appointment.pet_owner_profiles?.full_name,
          timestamp: appointment.created_at,
          icon: 'calendar',
          color: 'green',
          status: appointment.status
        });
      });
      
      // Add clinic registrations
      (recentClinics || []).forEach(clinic => {
        activities.push({
          id: `clinic_${clinic.id}`,
          type: 'clinic_registration',
          title: 'New Clinic Registration',
          description: `${clinic.name} registered at ${clinic.address}`,
          user: 'System',
          timestamp: clinic.created_at,
          icon: 'building',
          color: 'purple'
        });
      });
      
      // Add veterinarian applications
      (recentVetApplications || []).forEach(app => {
        activities.push({
          id: `vet_app_${app.id}`,
          type: 'vet_application',
          title: 'Veterinarian Application',
          description: `Dr. ${app.full_name} applied for veterinarian verification`,
          user: app.full_name,
          timestamp: app.created_at,
          icon: 'academic',
          color: 'indigo',
          status: app.status
        });
      });
      
      // Sort by timestamp (most recent first)
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setActivityLogs(activities.slice(0, 50)); // Limit to 50 most recent
      
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setActivityLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <UserIcon className="w-5 h-5" />;
      case 'calendar':
        return <CalendarDaysIcon className="w-5 h-5" />;
      case 'building':
        return <BuildingOfficeIcon className="w-5 h-5" />;
      case 'academic':
        return <AcademicCapIcon className="w-5 h-5" />;
      default:
        return <ClockIcon className="w-5 h-5" />;
    }
  };

  const getActivityColor = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-blue-600';
      case 'green':
        return 'bg-green-100 text-green-600';
      case 'purple':
        return 'bg-purple-100 text-purple-600';
      case 'indigo':
        return 'bg-indigo-100 text-indigo-600';
      case 'red':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return time.toLocaleDateString();
  };

  const fetchLandingPageSettings = async () => {
    try {
      setSettingsLoading(true);
      
      // Try to fetch from a settings table, or use localStorage as fallback
      const { data, error } = await supabase
        .from('landing_page_settings')
        .select('*')
        .single();
      
      if (data && !error) {
        setLandingPageSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching landing page settings:', error);
      // Keep default settings if no data found
    } finally {
      setSettingsLoading(false);
    }
  };

  const saveLandingPageSettings = async () => {
    try {
      setSettingsLoading(true);
      
      // Try to save to database, fallback to localStorage
      const { error } = await supabase
        .from('landing_page_settings')
        .upsert({
          id: 1,
          settings: landingPageSettings,
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        // Fallback: save to localStorage
        localStorage.setItem('zambovet_landing_settings', JSON.stringify(landingPageSettings));
      }
      
      alert('Landing page settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      // Fallback: save to localStorage
      localStorage.setItem('zambovet_landing_settings', JSON.stringify(landingPageSettings));
      alert('Settings saved locally!');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: string) => {
    setLandingPageSettings((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      setLandingPageSettings({
        heroTitle: 'Professional Pet Care Made Simple',
        heroSubtitle: 'Book veterinary appointments online, manage your pet\'s health records, and connect with experienced veterinarians who care about your furry family members.',
        heroButtonText: 'Book Appointment',
        heroLearnMoreText: 'Learn More',
        servicesTitle: 'Our Services',
        servicesSubtitle: 'Comprehensive veterinary care tailored to your pet\'s unique needs',
        aboutTitle: 'Why Choose ZamboVet?',
        aboutSubtitle: 'We combine modern technology with compassionate care to provide the best possible experience for you and your pets. Our platform makes veterinary care accessible, convenient, and stress-free.',
        contactTitle: 'Get In Touch',
        contactSubtitle: 'Have questions? We\'re here to help. Reach out to us anytime.',
        contactPhone: '+639123456789',
        contactEmail: 'vetzambo@gmail.com',
        contactAddress: 'Lorem Ipsum, Zamboanga City',
        companyName: 'ZamboVet',
        primaryColor: '#0032A0',
        secondaryColor: '#b3c7e6',
        accentColor: '#fffbde'
      });
    }
  };

  // User Management Functions
  const handleViewUser = async (userId: string) => {
    try {
      const { data: user, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      setSelectedUser(user);
      setEditFormData({ full_name: user.full_name || '', user_role: user.user_role });
      setShowUserModal(true);
    } catch (error: any) {
      console.error('Error fetching user:', error);
      alert('Failed to fetch user details: ' + error.message);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    
    try {
      setUpdating(true);
      const updates: any = {};
      if (editFormData.full_name && editFormData.full_name.trim()) updates.full_name = editFormData.full_name.trim();
      if (editFormData.user_role && ['admin', 'veterinarian', 'pet_owner', 'receptionist'].includes(editFormData.user_role)) {
        updates.user_role = editFormData.user_role;
      }
      
      if (Object.keys(updates).length === 0) {
        alert('No valid updates provided');
        return;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', selectedUser.id);
      
      if (error) throw error;
      
      alert('User updated successfully!');
      setShowUserModal(false);
      fetchTabData('users');
    } catch (error: any) {
      console.error('Error updating user:', error);
      alert('Failed to update user: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, newStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} this user?`)) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: newStatus })
        .eq('id', userId);
      
      if (error) throw error;
      
      alert(`User ${newStatus ? 'activated' : 'deactivated'} successfully!`);
      fetchTabData('users');
    } catch (error: any) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status: ' + error.message);
    }
  };

  // Clinic Management Functions
  const handleViewClinic = async (clinicId: number) => {
    try {
      const { data: clinic, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', clinicId)
        .single();
      
      if (error) throw error;
      
      setSelectedClinic(clinic);
      setEditFormData({ name: clinic.name, phone: clinic.phone || '', email: clinic.email || '' });
      setShowClinicModal(true);
    } catch (error: any) {
      console.error('Error fetching clinic:', error);
      alert('Failed to fetch clinic details: ' + error.message);
    }
  };

  const handleEditClinic = async () => {
    if (!selectedClinic) return;
    
    try {
      setUpdating(true);
      const updates: any = {};
      if (editFormData.name && editFormData.name.trim()) updates.name = editFormData.name.trim();
      if (editFormData.phone && editFormData.phone.trim()) updates.phone = editFormData.phone.trim();
      if (editFormData.email && editFormData.email.trim()) updates.email = editFormData.email.trim();
      
      if (Object.keys(updates).length === 0) {
        alert('No valid updates provided');
        return;
      }
      
      const { error } = await supabase
        .from('clinics')
        .update(updates)
        .eq('id', selectedClinic.id);
      
      if (error) throw error;
      
      alert('Clinic updated successfully!');
      setShowClinicModal(false);
      fetchTabData('clinics');
    } catch (error: any) {
      console.error('Error updating clinic:', error);
      alert('Failed to update clinic: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleClinicStatus = async (clinicId: number, newStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} this clinic?`)) return;
    
    try {
      const { error } = await supabase
        .from('clinics')
        .update({ is_active: newStatus })
        .eq('id', clinicId);
      
      if (error) throw error;
      
      alert(`Clinic ${newStatus ? 'activated' : 'deactivated'} successfully!`);
      fetchTabData('clinics');
    } catch (error: any) {
      console.error('Error updating clinic status:', error);
      alert('Failed to update clinic status: ' + error.message);
    }
  };

  // Appointment Management Functions
  const handleViewAppointment = async (appointmentId: number) => {
    try {
      const { data: appointment, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients(name, species, breed),
          pet_owner_profiles(full_name, phone),
          veterinarians(full_name, specialization),
          clinics(name, address, phone)
        `)
        .eq('id', appointmentId)
        .single();
      
      if (error) throw error;
      
      setSelectedAppointment(appointment);
      setShowAppointmentModal(true);
    } catch (error: any) {
      console.error('Error fetching appointment:', error);
      alert('Failed to fetch appointment details: ' + error.message);
    }
  };

  // Veterinarian Management Functions
  const handleViewVeterinarian = async (vetId: string) => {
    try {
      const { data: vet, error } = await supabase
        .from('veterinarians')
        .select(`
          *,
          profiles(email, phone, is_active),
          clinics(name, address)
        `)
        .eq('id', vetId)
        .single();
      
      if (error) throw error;
      
      setSelectedVeterinarian(vet);
      setEditFormData({ 
        specialization: vet.specialization || '', 
        consultation_fee: vet.consultation_fee || 0 
      });
      setShowVeterinarianModal(true);
    } catch (error: any) {
      console.error('Error fetching veterinarian:', error);
      alert('Failed to fetch veterinarian details: ' + error.message);
    }
  };

  const handleEditVeterinarian = async () => {
    if (!selectedVeterinarian) return;
    
    try {
      setUpdating(true);
      const updates: any = {};
      if (editFormData.specialization && editFormData.specialization.trim()) {
        updates.specialization = editFormData.specialization.trim();
      }
      if (editFormData.consultation_fee && !isNaN(Number(editFormData.consultation_fee))) {
        updates.consultation_fee = Number(editFormData.consultation_fee);
      }
      
      if (Object.keys(updates).length === 0) {
        alert('No valid updates provided');
        return;
      }
      
      const { error } = await supabase
        .from('veterinarians')
        .update(updates)
        .eq('id', selectedVeterinarian.id);
      
      if (error) throw error;
      
      alert('Veterinarian updated successfully!');
      setShowVeterinarianModal(false);
      fetchTabData('veterinarians');
    } catch (error: any) {
      console.error('Error updating veterinarian:', error);
      alert('Failed to update veterinarian: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleVeterinarianStatus = async (vetId: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to ${newStatus === 'approved' ? 'approve' : 'suspend'} this veterinarian?`)) return;
    
    try {
      // Update veterinarian availability
      const { error: vetError } = await supabase
        .from('veterinarians')
        .update({ is_available: newStatus === 'approved' })
        .eq('id', vetId);
      
      if (vetError) throw vetError;
      
      // Also update profile verification status if needed
      const { data: vet } = await supabase
        .from('veterinarians')
        .select('user_id')
        .eq('id', vetId)
        .single();
      
      if (vet?.user_id) {
        await supabase
          .from('profiles')
          .update({ verification_status: newStatus })
          .eq('id', vet.user_id);
      }
      
      alert(`Veterinarian ${newStatus === 'approved' ? 'approved' : 'suspended'} successfully!`);
      fetchTabData('veterinarians');
    } catch (error: any) {
      console.error('Error updating veterinarian status:', error);
      alert('Failed to update veterinarian status: ' + error.message);
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
                  { id: "veterinarians", name: "Veterinarian Registry", icon: AcademicCapIcon, desc: 'Medical professionals' },
                  { id: "analytics", name: "System Analytics", icon: ChartBarIcon, desc: 'Reports & insights' },
                  { id: "activity", name: 'Recent Activity', icon: ClockIcon, desc: "Activity logs" },
                  { id: "settings", name: "Settings", icon: CogIcon, desc: 'CMS & Configuration' }
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
                         activeTab === 'analytics' ? 'Comprehensive system insights and reporting' :
                         activeTab === 'activity' ? 'Track system activity and logs' :
                         'Content Management & System Settings'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
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
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
                    <div className="relative max-w-xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={usersSearch}
                        onChange={(e) => setUsersSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
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
                              <button 
                                onClick={() => handleViewUser(user.id)}
                                className="text-blue-600 hover:text-blue-900"
                                title="View User"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleEditUser(user.id)}
                                className="text-green-600 hover:text-green-900"
                                title="Edit User"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleToggleUserStatus(user.id, !user.is_active)}
                                className="text-red-600 hover:text-red-900"
                                title={user.is_active ? "Deactivate User" : "Activate User"}
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination - Users */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Page {usersPage} of {Math.max(1, Math.ceil(totalUsers / PAGE_SIZE))} {usersSearch && `(filtered from ${adminStats.totalUsers} total)`}
                  </div>
                  <div className="space-x-2">
                    <button
                      className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                      disabled={usersPage <= 1}
                      onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                    >
                      Previous
                    </button>
                    <button
                      className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                      disabled={usersPage >= Math.ceil(totalUsers / PAGE_SIZE)}
                      onClick={() => setUsersPage(p => p + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Clinics Tab */}
            {activeTab === 'clinics' && (
              <div className="bg-white rounded-lg shadow-md">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h3 className="text-lg font-semibold text-gray-900">Clinic Management</h3>
                    <div className="relative max-w-xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search clinics..."
                        value={clinicsSearch}
                        onChange={(e) => setClinicsSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
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
                              <button 
                                onClick={() => handleViewClinic(clinic.id)}
                                className="text-blue-600 hover:text-blue-900"
                                title="View Clinic"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleEditClinic(clinic.id)}
                                className="text-green-600 hover:text-green-900"
                                title="Edit Clinic"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleToggleClinicStatus(clinic.id, !clinic.is_active)}
                                className="text-red-600 hover:text-red-900"
                                title={clinic.is_active ? "Deactivate Clinic" : "Activate Clinic"}
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination - Clinics */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Page {clinicsPage} of {Math.max(1, Math.ceil(totalClinics / PAGE_SIZE))} {clinicsSearch && `(filtered from ${adminStats.totalClinics} total)`}
                  </div>
                  <div className="space-x-2">
                    <button
                      className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                      disabled={clinicsPage <= 1}
                      onClick={() => setClinicsPage(p => Math.max(1, p - 1))}
                    >
                      Previous
                    </button>
                    <button
                      className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                      disabled={clinicsPage >= Math.ceil(totalClinics / PAGE_SIZE)}
                      onClick={() => setClinicsPage(p => p + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Appointments Tab */}
            {activeTab === 'appointments' && (
              <div className="bg-white rounded-lg shadow-md">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h3 className="text-lg font-semibold text-gray-900">Appointment Management</h3>
                    <div className="relative max-w-xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search appointments..."
                        value={appointmentsSearch}
                        onChange={(e) => setAppointmentsSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
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
                            <button 
                              onClick={() => handleViewAppointment(appointment.id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Appointment Details"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination - Appointments */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Page {appointmentsPage} of {Math.max(1, Math.ceil(totalAppointments / PAGE_SIZE))} {appointmentsSearch && `(filtered from ${adminStats.totalAppointments} total)`}
                  </div>
                  <div className="space-x-2">
                    <button
                      className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                      disabled={appointmentsPage <= 1}
                      onClick={() => setAppointmentsPage(p => Math.max(1, p - 1))}
                    >
                      Previous
                    </button>
                    <button
                      className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                      disabled={appointmentsPage >= Math.ceil(totalAppointments / PAGE_SIZE)}
                      onClick={() => setAppointmentsPage(p => p + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Veterinarians Tab */}
            {activeTab === 'veterinarians' && (
              <div className="bg-white rounded-lg shadow-md">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h3 className="text-lg font-semibold text-gray-900">Veterinarian Management</h3>
                    <div className="relative max-w-xs">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search veterinarians..."
                        value={veterinariansSearch}
                        onChange={(e) => setVeterinariansSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Veterinarian</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialization</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {veterinarians.map((vet: any) => (
                        <tr key={vet.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">Dr. {vet.full_name}</div>
                            <div className="text-sm text-gray-500">ID: #{vet.id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{vet.contact_phone || 'N/A'}</div>
                            <div className="text-sm text-gray-500">{vet.contact_email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{vet.specialization || 'General Practice'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{vet.license_number}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              vet.verification_status === 'approved' ? 'bg-green-100 text-green-800' :
                              vet.verification_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {vet.verification_status || 'pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleViewVeterinarian(vet.id)}
                                className="text-blue-600 hover:text-blue-900"
                                title="View Veterinarian"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleEditVeterinarian(vet.id)}
                                className="text-green-600 hover:text-green-900"
                                title="Edit Veterinarian"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleToggleVeterinarianStatus(vet.id, vet.verification_status === 'approved' ? 'pending' : 'approved')}
                                className="text-red-600 hover:text-red-900"
                                title={vet.verification_status === 'approved' ? "Suspend Veterinarian" : "Approve Veterinarian"}
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination - Veterinarians */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Page {veterinariansPage} of {Math.max(1, Math.ceil(totalVeterinarians / PAGE_SIZE))} {veterinariansSearch && `(filtered from ${adminStats.totalVeterinarians} total)`}
                  </div>
                  <div className="space-x-2">
                    <button
                      className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                      disabled={veterinariansPage <= 1}
                      onClick={() => setVeterinariansPage(p => Math.max(1, p - 1))}
                    >
                      Previous
                    </button>
                    <button
                      className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                      disabled={veterinariansPage >= Math.ceil(totalVeterinarians / PAGE_SIZE)}
                      onClick={() => setVeterinariansPage(p => p + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Activity Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-6">
                {/* Activity Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Activities</p>
                        <p className="text-2xl font-bold text-gray-900">{activityLogs.length}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <ClockIcon className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">New Users Today</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {activityLogs.filter(log => 
                            log.type === 'user_registration' && 
                            new Date(log.timestamp).toDateString() === new Date().toDateString()
                          ).length}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <UserIcon className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Appointments Today</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {activityLogs.filter(log => 
                            log.type === 'appointment' && 
                            new Date(log.timestamp).toDateString() === new Date().toDateString()
                          ).length}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <CalendarDaysIcon className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Pending Applications</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {activityLogs.filter(log => 
                            log.type === 'vet_application' && 
                            log.status === 'pending'
                          ).length}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <DocumentTextIcon className="w-6 h-6 text-yellow-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity Feed */}
                <div className="bg-white rounded-lg shadow-md">
                  <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">System Activity Feed</h3>
                      <button
                        onClick={fetchActivityLogs}
                        disabled={activityLoading}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <ArrowPathIcon className={`w-4 h-4 mr-2 ${activityLoading ? 'animate-spin' : ''}`} />
                        Refresh
                      </button>
                    </div>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {activityLoading ? (
                      <div className="p-8 text-center">
                        <ArrowPathIcon className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
                        <p className="text-gray-500">Loading activity logs...</p>
                      </div>
                    ) : activityLogs.length === 0 ? (
                      <div className="p-8 text-center">
                        <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No recent activity found</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {activityLogs.map((activity) => (
                          <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors duration-150">
                            <div className="flex items-start space-x-3">
                              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getActivityColor(activity.color)}`}>
                                {getActivityIcon(activity.icon)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                                    <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                                    <div className="flex items-center space-x-4 mt-2">
                                      <span className="text-xs text-gray-500">by {activity.user}</span>
                                      {activity.status && (
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                          activity.status === 'completed' || activity.status === 'approved' ? 'bg-green-100 text-green-800' :
                                          activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                          activity.status === 'cancelled' || activity.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                          'bg-blue-100 text-blue-800'
                                        }`}>
                                          {activity.status}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-500 text-right">
                                    {formatTimeAgo(activity.timestamp)}
                                    <div className="text-xs text-gray-400 mt-1">
                                      {new Date(activity.timestamp).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {activityLogs.length > 0 && (
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                      <p className="text-xs text-gray-500 text-center">
                        Showing {activityLogs.length} most recent activities
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* Settings Header */}
                <div className="bg-white rounded-lg shadow-md">
                  <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Landing Page CMS</h3>
                        <p className="text-sm text-gray-600 mt-1">Customize the content and design of your landing page</p>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={resetToDefaults}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Reset to Defaults
                        </button>
                        <button
                          onClick={saveLandingPageSettings}
                          disabled={settingsLoading}
                          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {settingsLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Hero Section Settings */}
                  <div className="bg-white rounded-lg shadow-md">
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                      <h4 className="text-md font-semibold text-gray-900">Hero Section</h4>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Main Title
                        </label>
                        <input
                          type="text"
                          value={landingPageSettings.heroTitle}
                          onChange={(e) => handleSettingChange('heroTitle', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Subtitle
                        </label>
                        <textarea
                          rows={3}
                          value={landingPageSettings.heroSubtitle}
                          onChange={(e) => handleSettingChange('heroSubtitle', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Primary Button Text
                          </label>
                          <input
                            type="text"
                            value={landingPageSettings.heroButtonText}
                            onChange={(e) => handleSettingChange('heroButtonText', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Secondary Button Text
                          </label>
                          <input
                            type="text"
                            value={landingPageSettings.heroLearnMoreText}
                            onChange={(e) => handleSettingChange('heroLearnMoreText', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Services Section Settings */}
                  <div className="bg-white rounded-lg shadow-md">
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                      <h4 className="text-md font-semibold text-gray-900">Services Section</h4>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Services Title
                        </label>
                        <input
                          type="text"
                          value={landingPageSettings.servicesTitle}
                          onChange={(e) => handleSettingChange('servicesTitle', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Services Subtitle
                        </label>
                        <textarea
                          rows={3}
                          value={landingPageSettings.servicesSubtitle}
                          onChange={(e) => handleSettingChange('servicesSubtitle', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* About Section Settings */}
                  <div className="bg-white rounded-lg shadow-md">
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                      <h4 className="text-md font-semibold text-gray-900">About Section</h4>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          About Title
                        </label>
                        <input
                          type="text"
                          value={landingPageSettings.aboutTitle}
                          onChange={(e) => handleSettingChange('aboutTitle', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          About Description
                        </label>
                        <textarea
                          rows={4}
                          value={landingPageSettings.aboutSubtitle}
                          onChange={(e) => handleSettingChange('aboutSubtitle', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Section Settings */}
                  <div className="bg-white rounded-lg shadow-md">
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                      <h4 className="text-md font-semibold text-gray-900">Contact Information</h4>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contact Title
                        </label>
                        <input
                          type="text"
                          value={landingPageSettings.contactTitle}
                          onChange={(e) => handleSettingChange('contactTitle', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contact Subtitle
                        </label>
                        <input
                          type="text"
                          value={landingPageSettings.contactSubtitle}
                          onChange={(e) => handleSettingChange('contactSubtitle', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                          </label>
                          <input
                            type="text"
                            value={landingPageSettings.contactPhone}
                            onChange={(e) => handleSettingChange('contactPhone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={landingPageSettings.contactEmail}
                            onChange={(e) => handleSettingChange('contactEmail', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Address
                          </label>
                          <input
                            type="text"
                            value={landingPageSettings.contactAddress}
                            onChange={(e) => handleSettingChange('contactAddress', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Brand & Colors Settings */}
                  <div className="bg-white rounded-lg shadow-md lg:col-span-2">
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                      <h4 className="text-md font-semibold text-gray-900">Branding & Colors</h4>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Company Name
                          </label>
                          <input
                            type="text"
                            value={landingPageSettings.companyName}
                            onChange={(e) => handleSettingChange('companyName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Primary Color
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={landingPageSettings.primaryColor}
                              onChange={(e) => handleSettingChange('primaryColor', e.target.value)}
                              className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={landingPageSettings.primaryColor}
                              onChange={(e) => handleSettingChange('primaryColor', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Secondary Color
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={landingPageSettings.secondaryColor}
                              onChange={(e) => handleSettingChange('secondaryColor', e.target.value)}
                              className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={landingPageSettings.secondaryColor}
                              onChange={(e) => handleSettingChange('secondaryColor', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Accent Color
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={landingPageSettings.accentColor}
                              onChange={(e) => handleSettingChange('accentColor', e.target.value)}
                              className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={landingPageSettings.accentColor}
                              onChange={(e) => handleSettingChange('accentColor', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preview Section */}
                  <div className="bg-white rounded-lg shadow-md lg:col-span-2">
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                      <h4 className="text-md font-semibold text-gray-900">Live Preview</h4>
                    </div>
                    <div className="p-6">
                      <div className="text-center space-y-4 p-6 rounded-lg" style={{ backgroundColor: landingPageSettings.secondaryColor }}>
                        <h1 className="text-2xl font-bold" style={{ color: landingPageSettings.primaryColor }}>
                          {landingPageSettings.heroTitle}
                        </h1>
                        <p className="text-gray-700 max-w-md mx-auto">
                          {landingPageSettings.heroSubtitle}
                        </p>
                        <div className="flex justify-center space-x-4">
                          <button 
                            className="px-4 py-2 rounded-full text-white font-semibold"
                            style={{ backgroundColor: landingPageSettings.primaryColor }}
                          >
                            {landingPageSettings.heroButtonText}
                          </button>
                          <button 
                            className="px-4 py-2 rounded-full font-semibold border-2"
                            style={{ 
                              color: landingPageSettings.primaryColor, 
                              borderColor: landingPageSettings.primaryColor 
                            }}
                          >
                            {landingPageSettings.heroLearnMoreText}
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 text-center">
                        <a 
                          href="/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <EyeIcon className="w-4 h-4 mr-2" />
                          View Full Landing Page
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="-mx-6 lg:-mx-8">
                <AnalyticsDashboard />
              </div>
            )}
          </div>
        </div>
        
        {/* User Details Modal */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-600/90 via-blue-600/85 to-purple-600/90 backdrop-blur-lg" onClick={() => setShowUserModal(false)}></div>
            
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative border border-white/20">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                      <UserIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">User Details</h3>
                      <p className="text-blue-100 text-sm">{selectedUser.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* User Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <UserIcon className="w-4 h-4 mr-2" />
                    User Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Full Name:</span>
                      <p className="font-medium">{selectedUser.full_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <p className="font-medium">{selectedUser.email}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Role:</span>
                      <p className="font-medium capitalize">{selectedUser.user_role}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedUser.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedUser.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <p className="font-medium">{selectedUser.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Joined:</span>
                      <p className="font-medium">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Edit Form */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Edit User</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={editFormData.full_name || ''}
                        onChange={(e) => setEditFormData({...editFormData, full_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <select
                        value={editFormData.user_role || ''}
                        onChange={(e) => setEditFormData({...editFormData, user_role: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="pet_owner">Pet Owner</option>
                        <option value="veterinarian">Veterinarian</option>
                        <option value="admin">Admin</option>
                        <option value="receptionist">Receptionist</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleToggleUserStatus(selectedUser.id, !selectedUser.is_active)}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      selectedUser.is_active 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {selectedUser.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={handleEditUser}
                    disabled={updating}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {updating ? 'Updating...' : 'Update User'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Clinic Details Modal */}
        {showClinicModal && selectedClinic && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/90 via-teal-600/85 to-cyan-600/90 backdrop-blur-lg" onClick={() => setShowClinicModal(false)}></div>
            
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative border border-white/20">
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                      <BuildingOfficeIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Clinic Details</h3>
                      <p className="text-emerald-100 text-sm">{selectedClinic.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowClinicModal(false)}
                    className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Clinic Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <BuildingOfficeIcon className="w-4 h-4 mr-2" />
                    Clinic Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <p className="font-medium">{selectedClinic.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedClinic.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedClinic.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">Address:</span>
                      <p className="font-medium">{selectedClinic.address}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <p className="font-medium">{selectedClinic.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <p className="font-medium">{selectedClinic.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Emergency Service:</span>
                      <p className="font-medium">{selectedClinic.is_emergency_available ? 'Available' : 'Not Available'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Created:</span>
                      <p className="font-medium">{new Date(selectedClinic.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Edit Form */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Edit Clinic</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Clinic Name
                      </label>
                      <input
                        type="text"
                        value={editFormData.name || ''}
                        onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        <input
                          type="text"
                          value={editFormData.phone || ''}
                          onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={editFormData.email || ''}
                          onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleToggleClinicStatus(selectedClinic.id, !selectedClinic.is_active)}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      selectedClinic.is_active 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {selectedClinic.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={handleEditClinic}
                    disabled={updating}
                    className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                  >
                    {updating ? 'Updating...' : 'Update Clinic'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Appointment Details Modal */}
        {showAppointmentModal && selectedAppointment && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/90 via-indigo-600/85 to-blue-600/90 backdrop-blur-lg" onClick={() => setShowAppointmentModal(false)}></div>
            
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative border border-white/20">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                      <CalendarDaysIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Appointment Details</h3>
                      <p className="text-purple-100 text-sm">
                        {selectedAppointment.patients?.name} - {new Date(selectedAppointment.appointment_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAppointmentModal(false)}
                    className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Pet Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <HeartIcon className="w-4 h-4 mr-2" />
                    Pet Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <p className="font-medium">{selectedAppointment.patients?.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Species:</span>
                      <p className="font-medium">{selectedAppointment.patients?.species}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Breed:</span>
                      <p className="font-medium">{selectedAppointment.patients?.breed || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                {/* Owner Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <UserIcon className="w-4 h-4 mr-2" />
                    Owner Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <p className="font-medium">{selectedAppointment.pet_owner_profiles?.full_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <p className="font-medium">{selectedAppointment.pet_owner_profiles?.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <CalendarDaysIcon className="w-4 h-4 mr-2" />
                    Appointment Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Date:</span>
                      <p className="font-medium">{new Date(selectedAppointment.appointment_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Time:</span>
                      <p className="font-medium">{selectedAppointment.appointment_time}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedAppointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        selectedAppointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        selectedAppointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedAppointment.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Amount:</span>
                      <p className="font-medium">₱{selectedAppointment.total_amount?.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Veterinarian:</span>
                      <p className="font-medium">Dr. {selectedAppointment.veterinarians?.full_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Clinic:</span>
                      <p className="font-medium">{selectedAppointment.clinics?.name}</p>
                    </div>
                  </div>
                </div>

                {/* Visit Information */}
                {selectedAppointment.reason_for_visit && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <DocumentTextIcon className="w-4 h-4 mr-2" />
                      Visit Information
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-gray-600 font-medium">Reason for Visit:</span>
                        <p className="mt-1">{selectedAppointment.reason_for_visit}</p>
                      </div>
                      {selectedAppointment.symptoms && (
                        <div>
                          <span className="text-gray-600 font-medium">Symptoms:</span>
                          <p className="mt-1">{selectedAppointment.symptoms}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Veterinarian Details Modal */}
        {showVeterinarianModal && selectedVeterinarian && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/90 via-blue-600/85 to-teal-600/90 backdrop-blur-lg" onClick={() => setShowVeterinarianModal(false)}></div>
            
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative border border-white/20">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                      <UserIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Veterinarian Details</h3>
                      <p className="text-indigo-100 text-sm">Dr. {selectedVeterinarian.full_name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowVeterinarianModal(false)}
                    className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Veterinarian Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <AcademicCapIcon className="w-4 h-4 mr-2" />
                    Professional Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <p className="font-medium">Dr. {selectedVeterinarian.full_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">License:</span>
                      <p className="font-medium">{selectedVeterinarian.license_number}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Specialization:</span>
                      <p className="font-medium">{selectedVeterinarian.specialization || 'General Practice'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Experience:</span>
                      <p className="font-medium">{selectedVeterinarian.years_experience} years</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Consultation Fee:</span>
                      <p className="font-medium">₱{selectedVeterinarian.consultation_fee}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Rating:</span>
                      <p className="font-medium">⭐ {selectedVeterinarian.average_rating}/5.0</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <p className="font-medium">{selectedVeterinarian.profiles?.email}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedVeterinarian.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedVeterinarian.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Clinic Information */}
                {selectedVeterinarian.clinics && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <BuildingOfficeIcon className="w-4 h-4 mr-2" />
                      Clinic Information
                    </h4>
                    <div className="text-sm">
                      <p className="font-medium">{selectedVeterinarian.clinics.name}</p>
                      <p className="text-gray-600">{selectedVeterinarian.clinics.address}</p>
                    </div>
                  </div>
                )}

                {/* Edit Form */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Edit Veterinarian</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Specialization
                      </label>
                      <input
                        type="text"
                        value={editFormData.specialization || ''}
                        onChange={(e) => setEditFormData({...editFormData, specialization: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Consultation Fee (₱)
                      </label>
                      <input
                        type="number"
                        value={editFormData.consultation_fee || ''}
                        onChange={(e) => setEditFormData({...editFormData, consultation_fee: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleToggleVeterinarianStatus(selectedVeterinarian.id, selectedVeterinarian.is_available ? 'pending' : 'approved')}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      selectedVeterinarian.is_available 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {selectedVeterinarian.is_available ? 'Suspend' : 'Approve'}
                  </button>
                  <button
                    onClick={handleEditVeterinarian}
                    disabled={updating}
                    className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {updating ? 'Updating...' : 'Update Veterinarian'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
