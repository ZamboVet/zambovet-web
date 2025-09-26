'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useLanguage } from '@/contexts/LanguageContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import FindClinics from '@/components/dashboard/FindClinics';
import UserSettingsPanel from '@/components/settings/UserSettingsPanel';
import { supabase } from '@/lib/supabase';
// Removed unused sanitize imports - they are only needed in API routes
import {
  CalendarDaysIcon,
  HeartIcon,
  UserCircleIcon,
  ClockIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PhoneIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
  DocumentTextIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  ArrowRightOnRectangleIcon,
  ChartPieIcon,
  StarIcon,
  ArrowPathIcon,
  CogIcon
} from '@heroicons/react/24/outline';

// Simple sanitization functions for client-side use
const sanitizeName = (input: string): string => {
  return input.replace(/[<>"'&]/g, '').trim().slice(0, 100);
};

const sanitizeInput = (input: string): string => {
  return input.replace(/[<>"'&]/g, '').trim().slice(0, 255);
};

const sanitizePhoneNumber = (input: string): string => {
  return input.replace(/[^0-9+\-\s()]/g, '').trim().slice(0, 20);
};

const sanitizeAddress = (input: string): string => {
  return input.replace(/[<>"']/g, '').trim().slice(0, 500);
};

const sanitizeNumber = (input: string): number | null => {
  const num = parseFloat(input.replace(/[^0-9.]/g, ''));
  return isNaN(num) ? null : Math.max(0, Math.min(999, num));
};

const sanitizeDate = (input: string): string => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  return dateRegex.test(input) ? input : '';
};

const sanitizeArray = (input: any[]): string[] => {
  if (!Array.isArray(input)) return [];
  return input.map(item => sanitizeInput(String(item))).slice(0, 10);
};
import { useRouter } from 'next/navigation';
import { getAllSpecies, getBaseSpecies, saveCustomSpecies, getBreedsForSpecies, hasPredefindedBreeds } from '@/utils/petUtils';
import TestModal from '@/components/appointments/TestModal';
import AppointmentDetailsModal from '@/components/appointments/AppointmentDetailsModal';
import PetDiary from '@/components/diary/PetDiary';
import DiaryEntryModal from '@/components/diary/DiaryEntryModal';
import ReviewSubmissionModal from '@/components/reviews/ReviewSubmissionModal';
import ImageCrop from '@/components/ui/ImageCrop';
import {
  Line,
  AreaChart,
  Area,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';

interface PetOwnerStats {
  totalPets: number;
  upcomingAppointments: number;
  completedAppointments: number;
  totalSpent: number;
  lastVisit: string;
  loading: boolean;
}

interface AnalyticsData {
  appointmentTrends: any[];
  spendingAnalysis: any[];
  petHealthMetrics: any[];
  monthlySpending: any[];
  serviceBreakdown: any[];
  loading: boolean;
}

export default function PetOwnerDashboard() {
  const { user, userProfile, signOut } = useAuth();
  const { settings, formatTime, formatDate, formatDateTime } = useSettings();
  const { t } = useLanguage();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [petOwnerStats, setPetOwnerStats] = useState<PetOwnerStats>({
    totalPets: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    totalSpent: 0,
    lastVisit: 'Never',
    loading: true
  });

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    appointmentTrends: [],
    spendingAnalysis: [],
    petHealthMetrics: [],
    monthlySpending: [],
    serviceBreakdown: [],
    loading: true
  });

  const [pets, setPets] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [clinics, setClinics] = useState<any[]>([]);
  const [petOwnerProfile, setPetOwnerProfile] = useState<any>(null);
  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const [newPet, setNewPet] = useState({
    name: '',
    species: '',
    customSpecies: '', // Custom pet type when 'Other' is selected
    breed: '',
    gender: '',
    date_of_birth: '',
    weight: '',
    medical_conditions: [],
    profile_picture_url: ''
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [addedPet, setAddedPet] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPet, setSelectedPet] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<{
    type: 'edit' | 'delete' | 'view' | null;
    message: string;
    pet?: any;
  }>({ type: null, message: '', pet: null });

  // Profile form state
  const [profileForm, setProfileForm] = useState<{
    full_name: string;
    phone: string;
    address: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    profile_picture_url: string;
  }>({
    full_name: '',
    phone: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    profile_picture_url: ''
  });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [todayAppointmentCount, setTodayAppointmentCount] = useState(0);
  const [selectedProfileImage, setSelectedProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageForCropping, setImageForCropping] = useState<string | null>(null);
  const [croppedImageBlob, setCroppedImageBlob] = useState<Blob | null>(null);
  
  // TestModal state
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testAppointmentId, setTestAppointmentId] = useState<number | null>(null);
  
  // AppointmentDetailsModal state
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsAppointmentId, setDetailsAppointmentId] = useState<number | null>(null);
  
  // Pet Diary state
  const [diaryRefreshTrigger, setDiaryRefreshTrigger] = useState(0);
  
  // Review submission state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedAppointmentForReview, setSelectedAppointmentForReview] = useState<any>(null);

  // Dynamic species and breeds state
  const [availableSpecies, setAvailableSpecies] = useState<string[]>(getBaseSpecies());
  const [availableBreeds, setAvailableBreeds] = useState<string[]>([]);
  const [showBreedDropdown, setShowBreedDropdown] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isSubmittingPet, setIsSubmittingPet] = useState(false);

  // Chart colors for Pilar College palette
  const chartColors = {
    primary: '#0032A0',
    secondary: '#0053d6',
    accent: '#b3c7e6',
    gold: '#FFD700',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444'
  };

  const checkUserPermissions = async () => {
    if (!user || !petOwnerProfile) return;
    
    console.log('Checking user permissions...');
    console.log('Auth user ID:', user.id);
    console.log('Pet owner profile:', petOwnerProfile);
    
    // Test if we can read our own profile
    const { data: profileTest, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id);
    
    console.log('Profile test:', { profileTest, profileError });

    // Test if we can read pet owner profile
    const { data: petOwnerTest, error: petOwnerError } = await supabase
      .from('pet_owner_profiles')
      .select('*')
      .eq('user_id', user.id);
    
    console.log('Pet owner profile test:', { petOwnerTest, petOwnerError });
  };

  useEffect(() => {
    if (user && userProfile?.user_role === 'pet_owner') {
      fetchPetOwnerData();
    }
  }, [user, userProfile]);

  useEffect(() => {
    if (user && petOwnerProfile) {
      checkUserPermissions();
    }
  }, [user, petOwnerProfile]);

  // Refresh appointment count when component mounts and when date changes
  useEffect(() => {
    if (petOwnerProfile) {
      refreshTodayAppointmentCount();
    }
  }, [petOwnerProfile]);

  // Initialize component as mounted and load localStorage data
  useEffect(() => {
    setIsMounted(true);
    // Only access localStorage after component has mounted (client-side only)
    setAvailableSpecies(getAllSpecies());
  }, []);

  // Handle species selection and update breed options
  const handleSpeciesChange = (selectedSpecies: string) => {
    if (!isMounted) return; // Prevent execution before hydration
    
    setNewPet(prev => ({ 
      ...prev, 
      species: selectedSpecies, 
      breed: '', // Reset breed when species changes
      customSpecies: selectedSpecies === 'Others' ? '' : prev.customSpecies
    }));
    
    // Update available breeds based on selected species
    if (hasPredefindedBreeds(selectedSpecies)) {
      setAvailableBreeds(getBreedsForSpecies(selectedSpecies));
      setShowBreedDropdown(true);
    } else {
      setAvailableBreeds([]);
      setShowBreedDropdown(false);
    }
  };

  // Handle custom species submission
  const handleCustomSpeciesSubmit = () => {
    if (!isMounted || !newPet.customSpecies.trim()) return; // Prevent execution before hydration
    
    const customSpeciesName = newPet.customSpecies.trim();
    saveCustomSpecies(customSpeciesName);
    
    // Update the species dropdown to include the new species
    setAvailableSpecies(getAllSpecies());
    
    // Set the species to the custom value
    setNewPet(prev => ({
      ...prev,
      species: customSpeciesName,
      customSpecies: ''
    }));
  };

  // Handle breed selection
  const handleBreedSelect = (selectedBreed: string) => {
    if (!isMounted) return; // Prevent execution before hydration
    setNewPet(prev => ({ ...prev, breed: selectedBreed }));
  };

  const fetchAnalyticsData = async () => {
    if (!petOwnerProfile) return;

    try {
      setAnalyticsData(prev => ({ ...prev, loading: true }));

      // Optimized: Reuse pets data if already loaded, and fetch only necessary appointment data
      const petData = pets.length > 0 ? pets : null;
      
      const queries = [
        // Only fetch appointments with necessary joins for analytics
        supabase
          .from('appointments')
          .select(`
            *,
            services(name, price),
            patients(name, species),
            clinics(name)
          `)
          .eq('pet_owner_id', petOwnerProfile.id)
          .order('appointment_date', { ascending: false }),
        supabase
          .from('reviews')
          .select('*')
          .eq('pet_owner_id', petOwnerProfile.id)
      ];

      // Add pets query only if not already loaded
      if (!petData) {
        queries.push(
          supabase
            .from('patients')
            .select('*')
            .eq('owner_id', petOwnerProfile.id)
            .eq('is_active', true)
        );
      }

      const results = await Promise.all(queries);
      const allAppointments = results[0].data;
      const allReviews = results[1].data;
      const allPets = petData || (results[2]?.data || []);

      // Process analytics data
      const appointmentTrends = processAppointmentTrends(allAppointments || []);
      const spendingAnalysis = processSpendingAnalysis(allAppointments || []);
      const petHealthMetrics = processPetHealthMetrics(allPets || [], allAppointments || []);
      const monthlySpending = processMonthlySpending(allAppointments || []);
      const serviceBreakdown = processServiceBreakdown(allAppointments || []);

      setAnalyticsData({
        appointmentTrends,
        spendingAnalysis,
        petHealthMetrics,
        monthlySpending,
        serviceBreakdown,
        loading: false
      });

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setAnalyticsData(prev => ({ ...prev, loading: false }));
    }
  };

  const processAppointmentTrends = (appointments: any[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    const trends = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = date.getMonth();
      const monthName = months[monthKey];
      
      const monthAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate.getMonth() === monthKey && aptDate.getFullYear() === date.getFullYear();
      });

      trends.push({
        month: monthName,
        total: monthAppointments.length,
        completed: monthAppointments.filter(apt => apt.status === 'completed').length,
        pending: monthAppointments.filter(apt => apt.status === 'pending').length,
        cancelled: monthAppointments.filter(apt => apt.status === 'cancelled').length
      });
    }

    return trends;
  };

  const processSpendingAnalysis = (appointments: any[]) => {
    const completedAppointments = appointments.filter(apt => apt.status === 'completed');
    
    return completedAppointments.map(apt => ({
      date: new Date(apt.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      amount: apt.total_amount || apt.services?.price || 0,
      service: apt.services?.name || 'General Checkup',
      pet: apt.patients?.name || 'Unknown Pet'
    }));
  };

  const processPetHealthMetrics = (pets: any[], appointments: any[]) => {
    return pets.map(pet => {
      const petAppointments = appointments.filter(apt => apt.patient_id === pet.id);
      const completedAppointments = petAppointments.filter(apt => apt.status === 'completed');
      const totalSpent = completedAppointments.reduce((sum, apt) => 
        sum + (apt.total_amount || apt.services?.price || 0), 0
      );

      return {
        name: pet.name,
        species: pet.species,
        totalVisits: petAppointments.length,
        completedVisits: completedAppointments.length,
        totalSpent: totalSpent,
        avgSpent: completedAppointments.length > 0 ? totalSpent / completedAppointments.length : 0,
        lastVisit: completedAppointments.length > 0 
          ? new Date(Math.max(...completedAppointments.map(apt => new Date(apt.appointment_date).getTime())))
          : null
      };
    });
  };



  const processMonthlySpending = (appointments: any[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentDate = new Date();
    const spending = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = date.getMonth();
      const monthName = months[monthKey];
      
      const monthAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate.getMonth() === monthKey && 
               aptDate.getFullYear() === date.getFullYear() && 
               apt.status === 'completed';
      });

      const totalSpent = monthAppointments.reduce((sum, apt) => 
        sum + (apt.total_amount || apt.services?.price || 0), 0
      );

      spending.push({
        month: monthName,
        spending: totalSpent,
        appointments: monthAppointments.length
      });
    }

    return spending;
  };

  const processServiceBreakdown = (appointments: any[]) => {
    const completedAppointments = appointments.filter(apt => apt.status === 'completed');
    const serviceCounts = completedAppointments.reduce((acc, apt) => {
      const serviceName = apt.services?.name || 'General Checkup';
      acc[serviceName] = (acc[serviceName] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(serviceCounts).map(([service, count]) => ({
      service,
      count: count as number,
      percentage: ((count as number) / completedAppointments.length) * 100
    }));
  };

  const fetchPetOwnerData = async () => {
    try {
      console.log('Dashboard: Fetching pet owner data for user:', user?.id);
      
      // Get pet owner profile
      let { data: petOwnerData, error: profileError } = await supabase
        .from('pet_owner_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      // If missing, create it (dev mode)
      if (profileError || !petOwnerData) {
        // Double-check if a row already exists (race condition safe)
        const { data: existing, error: existingError } = await supabase
          .from('pet_owner_profiles')
          .select('*')
          .eq('user_id', user?.id)
          .single();
        if (!existing) {
          const { error: insertError } = await supabase.from('pet_owner_profiles').insert({
            user_id: user?.id,
            full_name: userProfile?.full_name || '',
            phone: userProfile?.phone || '',
            address: '',
            emergency_contact_name: '',
            emergency_contact_phone: '',
          });
          if (!insertError) {
            // Try fetching again
            const { data: newPetOwnerData } = await supabase
              .from('pet_owner_profiles')
              .select('*')
              .eq('user_id', user?.id)
              .single();
            petOwnerData = newPetOwnerData;
          } else {
            console.error('Dashboard: Error creating pet owner profile:', insertError);
            setPetOwnerStats(prev => ({ ...prev, loading: false }));
            return;
          }
          if (!petOwnerData) {
            setPetOwnerStats(prev => ({ ...prev, loading: false }));
            return;
          }
        } else {
          petOwnerData = existing;
        }
      }

      console.log('Dashboard: Pet owner profile found:', petOwnerData);
      setPetOwnerProfile(petOwnerData);

      // Get today's date
      const today = new Date().toISOString().split('T')[0];

      // Optimized: Fetch essential data first for quick UI update
      const [
        { data: petsData, error: petsError },
        { data: todayAppointments },
        { data: quickStats }
      ] = await Promise.all([
        supabase
          .from('patients')
          .select('*')
          .eq('owner_id', petOwnerData.id)
          .eq('is_active', true),
        supabase
          .from('appointments')
          .select('*')
          .eq('pet_owner_id', petOwnerData.id)
          .eq('appointment_date', today)
          .in('status', ['pending', 'confirmed', 'in_progress']),
        // Single optimized query for dashboard stats
        supabase
          .from('appointments')
          .select('status, total_amount, appointment_date, services(price)')
          .eq('pet_owner_id', petOwnerData.id)
      ]);

      if (petsError) {
        console.error('Dashboard: Error fetching pets:', petsError);
      } else {
        console.log('Dashboard: Pets found:', petsData);
      }

      // Process stats from single query result
      const upcomingCount = quickStats?.filter(apt => 
        apt.status === 'pending' || apt.status === 'confirmed'
      ).filter(apt => 
        new Date(apt.appointment_date) >= new Date(today)
      ).length || 0;

      const completedCount = quickStats?.filter(apt => apt.status === 'completed').length || 0;

      const totalSpent = quickStats?.reduce((sum, appointment) => {
        return sum + (appointment.total_amount || appointment.services?.price || 0);
      }, 0) || 0;

      const completedAppointments = quickStats?.filter(apt => apt.status === 'completed') || [];
      const lastCompletedAppointment = completedAppointments.sort((a, b) => 
        new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()
      )[0];

      // Update UI immediately with essential data
      setPetOwnerStats({
        totalPets: petsData?.length || 0,
        upcomingAppointments: upcomingCount,
        completedAppointments: completedCount,
        totalSpent,
        lastVisit: lastCompletedAppointment 
          ? new Date(lastCompletedAppointment.appointment_date).toLocaleDateString()
          : 'Never',
        loading: false
      });

      setPets(petsData || []);
      setTodayAppointmentCount(todayAppointments?.length || 0);

      // Load analytics data lazily after UI is ready (deferred)
      setTimeout(() => {
        if (activeTab === 'analytics' || activeTab === 'overview') {
          fetchAnalyticsData();
        }
      }, 100);

    } catch (error) {
      console.error('Dashboard: Error fetching pet owner data:', error);
      setPetOwnerStats(prev => ({ ...prev, loading: false }));
    }
  };

  const fetchTabData = useCallback(async (tab: string) => {
    if (!petOwnerProfile) return;

    try {
      switch (tab) {
        case 'appointments':
          console.log('Fetching appointments for pet owner:', petOwnerProfile.id);
          const { data: appointmentsData, error: appointmentsError } = await supabase
            .from('appointments')
            .select(`
              *,
              patients(name, species, breed),
              veterinarians(full_name, specialization),
              clinics(name, address, phone),
              services(name, price, duration_minutes)
            `)
            .eq('pet_owner_id', petOwnerProfile.id)
            .order('appointment_date', { ascending: false })
            .order('appointment_time', { ascending: false });
          
          if (appointmentsError) {
            console.error('Error fetching appointments:', appointmentsError);
          } else {
            console.log('Appointments fetched:', appointmentsData);
            setAppointments(appointmentsData || []);
          }
          break;
        case 'analytics':
          // Analytics data is already fetched in fetchAnalyticsData()
          // This is called when the analytics tab is selected
          if (analyticsData.loading) {
            fetchAnalyticsData();
          }
          break;

        case 'clinics':
          const { data: clinicsData } = await supabase
            .from('clinics')
            .select(`
              *,
              veterinarians(id, full_name, specialization, average_rating, consultation_fee)
            `)
            .eq('is_active', true)
            .order('name', { ascending: true });
          setClinics(clinicsData || []);
          break;
      }
    } catch (error) {
      console.error(`Error fetching ${tab} data:`, error);
    }
  }, [petOwnerProfile, analyticsData.loading]);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    if (tab !== 'overview') {
      fetchTabData(tab);
    }
    // Load analytics data when analytics tab is first accessed
    if (tab === 'analytics' && analyticsData.loading && petOwnerProfile) {
      fetchAnalyticsData();
    }
  }, [analyticsData.loading, petOwnerProfile, fetchTabData]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      
      // Create preview for cropping
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageForCropping(e.target?.result as string);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPetImage = async (petId: number): Promise<string | null> => {
    if (!selectedImage) return null;
    
    setUploadingImage(true);
    try {
      const fileExt = selectedImage.name.split('.').pop();
      const fileName = `${petId}-${Date.now()}.${fileExt}`;
      const filePath = `pet-profiles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('pet-images')
        .upload(filePath, selectedImage);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        return null;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('pet-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const uploadProfileImage = async (userId: string): Promise<string | null> => {
    if (!croppedImageBlob) return null;
    
    setUploadingProfileImage(true);
    try {
      const fileName = `${userId}-${Date.now()}.jpg`;
      const filePath = `profile-images/${fileName}`;

      console.log('Attempting to upload cropped profile image:', { filePath, bucket: 'profile-images' });

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, croppedImageBlob);

      if (uploadError) {
        console.error('Error uploading profile image:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message || 'Unknown error'}`);
      }

      console.log('Profile image uploaded successfully');

      // Get public URL
      const { data } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      console.log('Profile image public URL:', data.publicUrl);
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      throw error;
    } finally {
      setUploadingProfileImage(false);
    }
  };

  const handleAddPet = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmittingPet || !isMounted) return;
    
    setIsSubmittingPet(true);
    try {
      console.log('Dashboard: Adding pet with data:', newPet);
      console.log('Dashboard: Pet owner profile ID:', petOwnerProfile?.id);
      
      // Handle custom species submission
      if (newPet.species === 'Others' && newPet.customSpecies.trim()) {
        // Save the custom species for future use
        saveCustomSpecies(newPet.customSpecies.trim());
      }
      
      // Validate custom species if 'Others' is selected
      if (newPet.species === 'Others' && !newPet.customSpecies.trim()) {
        throw new Error('Please specify the pet type');
      }

      // Sanitize all inputs
      const sanitizedPetData = {
        name: sanitizeName(newPet.name),
        species: sanitizeInput(newPet.species === 'Others' ? newPet.customSpecies : newPet.species),
        breed: sanitizeInput(newPet.breed),
        gender: sanitizeInput(newPet.gender),
        owner_id: petOwnerProfile.id,
        weight: sanitizeNumber(newPet.weight),
        date_of_birth: sanitizeDate(newPet.date_of_birth),
        is_active: true,
        medical_conditions: sanitizeArray(newPet.medical_conditions)
      };

      // Validate required fields
      if (!sanitizedPetData.name) {
        throw new Error('Pet name is required');
      }
      if (!sanitizedPetData.species) {
        throw new Error('Species is required');
      }
      
      // First, insert the pet without image
      const petData = {
        name: sanitizedPetData.name,
        species: sanitizedPetData.species,
        breed: sanitizedPetData.breed,
        gender: sanitizedPetData.gender,
        owner_id: petOwnerProfile.id,
        weight: sanitizedPetData.weight,
        date_of_birth: sanitizedPetData.date_of_birth,
        is_active: true,
        medical_conditions: sanitizedPetData.medical_conditions
      };

      const { data: insertedPet, error } = await supabase
        .from('patients')
        .insert(petData)
        .select()
        .single();

      if (error) {
        console.error('Dashboard: Error adding pet:', error);
        throw error;
      }

      console.log('Dashboard: Pet added successfully:', insertedPet);
      
      // Upload image if selected (only if profile_picture_url column exists)
      let imageUrl = null;
      if (selectedImage) {
        imageUrl = await uploadPetImage(insertedPet.id);
        
        if (imageUrl) {
          // Try to update pet with image URL (will fail silently if column doesn't exist)
          try {
            const { error: updateError } = await supabase
              .from('patients')
              .update({ profile_picture_url: imageUrl })
              .eq('id', insertedPet.id);
              
            if (updateError) {
              console.error('Error updating pet with image URL (column may not exist yet):', updateError);
            }
          } catch (error) {
            console.log('Profile picture column not yet added to database. Run add_profile_picture_column.sql first.');
          }
        }
      }

      // Show success modal with the added pet info
      setAddedPet(insertedPet);
      setShowSuccessModal(true);
      setShowAddPetModal(false);
      
      // Reset form
      setNewPet({
        name: '',
        species: '',
        customSpecies: '',
        breed: '',
        gender: '',
        date_of_birth: '',
        weight: '',
        medical_conditions: [],
        profile_picture_url: ''
      });
      setSelectedImage(null);
      setImagePreview(null);
      setShowBreedDropdown(false);
      setAvailableBreeds([]);
      
      // Refresh species list to include any new custom species
      setAvailableSpecies(getAllSpecies());
      
      // Force immediate refresh of pet data with multiple approaches
      await fetchPetOwnerData();
      
      // Force component re-render by updating a key state
      setIsMounted(false);
      setTimeout(() => setIsMounted(true), 10);
      
      // Auto-close success modal after 4 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
        setAddedPet(null);
      }, 4000);
    } catch (error: any) {
      console.error('Dashboard: Error adding pet:', error);
      
      // Show user-friendly error message
      const errorMessage = error.message || 'An unexpected error occurred while adding your pet.';
      alert('Error adding pet: ' + errorMessage);
      
      // Don't reset form on error - let user fix and retry
    } finally {
      setIsSubmittingPet(false);
    }
  };

  const handleViewPet = async (pet: any) => {
    setSelectedPet(pet);
    setShowViewModal(true);
  };

  const handleEditPet = async (pet: any) => {
    setSelectedPet(pet);
    setNewPet({
      name: pet.name || '',
      species: pet.species || '',
      customSpecies: '',
      breed: pet.breed || '',
      gender: pet.gender || '',
      date_of_birth: pet.date_of_birth || '',
      weight: pet.weight?.toString() || '',
      medical_conditions: pet.medical_conditions || [],
      profile_picture_url: pet.profile_picture_url || ''
    });
    setImagePreview(pet.profile_picture_url || null);
    
    // Initialize breed state based on the selected pet's species
    const petSpecies = pet.species || '';
    if (hasPredefindedBreeds(petSpecies)) {
      setAvailableBreeds(getBreedsForSpecies(petSpecies));
      // Only show breed dropdown if pet doesn't already have a breed set
      setShowBreedDropdown(!pet.breed);
    } else {
      setAvailableBreeds([]);
      setShowBreedDropdown(false);
    }
    
    setShowEditModal(true);
  };

  const handleUpdatePet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPet) return;

    setActionLoading(true);
    try {
      console.log('Attempting to update pet:', selectedPet.id);
      console.log('Current user:', user?.id);
      console.log('Pet owner profile:', petOwnerProfile?.id);
      console.log('Update data:', newPet);

      // Check authentication status
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session?.user?.id);

      // Handle custom species submission
      if (newPet.species === 'Others' && newPet.customSpecies.trim()) {
        // Save the custom species for future use
        saveCustomSpecies(newPet.customSpecies.trim());
      }
      
      // Validate custom species if 'Others' is selected
      if (newPet.species === 'Others' && !newPet.customSpecies.trim()) {
        throw new Error('Please specify the pet type');
      }

      // Sanitize all inputs
      const sanitizedPetData = {
        name: sanitizeName(newPet.name),
        species: sanitizeInput(newPet.species === 'Others' ? newPet.customSpecies : newPet.species),
        breed: sanitizeInput(newPet.breed),
        gender: sanitizeInput(newPet.gender),
        date_of_birth: sanitizeDate(newPet.date_of_birth),
        weight: sanitizeNumber(newPet.weight),
        medical_conditions: sanitizeArray(newPet.medical_conditions)
      };

      // Validate required fields
      if (!sanitizedPetData.name) {
        throw new Error('Pet name is required');
      }
      if (!sanitizedPetData.species) {
        throw new Error('Species is required');
      }

      // Update pet using direct Supabase call
      const petData = {
        name: sanitizedPetData.name,
        species: sanitizedPetData.species,
        breed: sanitizedPetData.breed,
        gender: sanitizedPetData.gender,
        date_of_birth: sanitizedPetData.date_of_birth,
        weight: sanitizedPetData.weight,
        medical_conditions: sanitizedPetData.medical_conditions
      };

      const { data: updatedPet, error } = await supabase
        .from('patients')
        .update(petData)
        .eq('id', selectedPet.id)
        .eq('owner_id', petOwnerProfile?.id) // Ensure we only update our own pets
        .select()
        .single();

      console.log('Update result:', { updatedPet, error });

      if (error) {
        console.error('Supabase error:', error);
        if (error.code === 'PGRST116') {
          throw new Error('Permission denied: You can only edit your own pets');
        }
        throw error;
      }

      if (!updatedPet) {
        throw new Error('Pet not found or you do not have permission to edit it');
      }

      // Handle image upload if changed
      if (selectedImage) {
        const imageUrl = await uploadPetImage(selectedPet.id);
        if (imageUrl) {
          try {
            await supabase
              .from('patients')
              .update({ profile_picture_url: imageUrl })
              .eq('id', selectedPet.id);
          } catch (error) {
            console.log('Profile picture update failed - column may not exist');
          }
        }
      }

      // Show success
      setActionSuccess({
        type: 'edit',
        message: `${updatedPet.name} has been updated successfully!`,
        pet: updatedPet
      });

      // Close modal and reset
      setShowEditModal(false);
      setSelectedPet(null);
      setNewPet({
        name: '',
        species: '',
        customSpecies: '',
        breed: '',
        gender: '',
        date_of_birth: '',
        weight: '',
        medical_conditions: [],
        profile_picture_url: ''
      });
      setSelectedImage(null);
      setImagePreview(null);
      setShowBreedDropdown(false);
      setAvailableBreeds([]);
      
      // Refresh species list to include any new custom species
      setAvailableSpecies(getAllSpecies());
      
      fetchPetOwnerData();

      // Auto-close success after 4 seconds
      setTimeout(() => {
        setActionSuccess({ type: null, message: '', pet: null });
      }, 4000);

    } catch (error: any) {
      console.error('Error updating pet:', error);
      alert('Error updating pet: ' + (error.message || 'Unknown error occurred'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePet = async (pet: any) => {
    setSelectedPet(pet);
    setShowDeleteModal(true);
  };

  const confirmDeletePet = async () => {
    if (!selectedPet) return;

    setActionLoading(true);
    try {
      console.log('Attempting to delete pet:', selectedPet.id);
      console.log('Current user:', user?.id);
      console.log('Pet owner profile:', petOwnerProfile?.id);

      // Check authentication status
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session?.user?.id);

      // Soft delete by setting is_active to false
      const { data, error } = await supabase
        .from('patients')
        .update({ is_active: false })
        .eq('id', selectedPet.id)
        .eq('owner_id', petOwnerProfile?.id) // Ensure we only delete our own pets
        .select();

      console.log('Delete result:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        if (error.code === 'PGRST116') {
          throw new Error('Permission denied: You can only delete your own pets');
        }
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Pet not found or you do not have permission to delete it');
      }

      // Show success
      setActionSuccess({
        type: 'delete',
        message: `${selectedPet.name} has been removed from your pets`,
        pet: selectedPet
      });

      // Close modal and reset
      setShowDeleteModal(false);
      setSelectedPet(null);
      
      fetchPetOwnerData();

      // Auto-close success after 4 seconds
      setTimeout(() => {
        setActionSuccess({ type: null, message: '', pet: null });
      }, 4000);

    } catch (error: any) {
      console.error('Error deleting pet:', error);
      alert('Error deleting pet: ' + (error.message || 'Unknown error occurred'));
    } finally {
      setActionLoading(false);
    }
  };

  const refreshTodayAppointmentCount = async () => {
    if (!petOwnerProfile) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: todayAppointments } = await supabase
        .from('appointments')
        .select('id')
        .eq('pet_owner_id', petOwnerProfile.id)
        .eq('appointment_date', today)
        .in('status', ['pending', 'confirmed', 'in_progress']);
      
      setTodayAppointmentCount(todayAppointments?.length || 0);
    } catch (error) {
      console.error('Error refreshing appointment count:', error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!petOwnerProfile) return;

    setProfileLoading(true);
    try {
      // Sanitize all inputs
      const sanitizedData = {
        full_name: sanitizeName(profileForm.full_name),
        phone: sanitizePhoneNumber(profileForm.phone),
        address: sanitizeAddress(profileForm.address),
        emergency_contact_name: sanitizeName(profileForm.emergency_contact_name),
        emergency_contact_phone: sanitizePhoneNumber(profileForm.emergency_contact_phone)
      };

      // Validate required fields
      if (!sanitizedData.full_name) {
        throw new Error('Full name is required');
      }

      // Upload profile image if cropped
      let profileImageUrl = null;
      if (croppedImageBlob) {
        try {
          profileImageUrl = await uploadProfileImage(user?.id || '');
        } catch (uploadError: any) {
          console.error('Profile image upload failed:', uploadError);
          throw new Error(`Profile image upload failed: ${uploadError.message || 'Please try again'}`);
        }
      }

      // Update profile data
      const updateData: any = { ...sanitizedData };
      if (profileImageUrl) {
        updateData.profile_picture_url = profileImageUrl;
      }

      const { data: updatedProfile, error } = await supabase
        .from('pet_owner_profiles')
        .update(updateData)
        .eq('id', petOwnerProfile.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }

      // Update local state
      setPetOwnerProfile(updatedProfile);
      setShowProfileModal(false);
      
      // Reset image states
      setSelectedProfileImage(null);
      setProfileImagePreview(null);
      setCroppedImageBlob(null);
      setImageForCropping(null);
      
      // Show success message
      setActionSuccess({
        type: 'edit',
        message: 'Profile updated successfully!',
        pet: null
      });

      // Auto-close success after 4 seconds
      setTimeout(() => {
        setActionSuccess({ type: null, message: '', pet: null });
      }, 4000);

    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert('Error updating profile: ' + (error.message || 'Unknown error occurred'));
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleTestModal = (appointmentId: number) => {
    console.log('Opening test modal for appointment:', appointmentId);
    setTestAppointmentId(appointmentId);
    setIsTestModalOpen(true);
  };

  const handleCloseTestModal = () => {
    console.log('Closing test modal');
    setIsTestModalOpen(false);
    setTestAppointmentId(null);
  };

  const handleViewDetails = (appointmentId: number) => {
    console.log('Opening appointment details for appointment:', appointmentId);
    setDetailsAppointmentId(appointmentId);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    console.log('Closing appointment details modal');
    setIsDetailsModalOpen(false);
    setDetailsAppointmentId(null);
  };

  const handleCancelAppointment = async (appointmentId: number) => {
    console.log('Attempting to cancel appointment:', appointmentId);
    
    // Show confirmation dialog
    const confirmed = window.confirm('Are you sure you want to cancel this appointment? This action cannot be undone.');
    
    if (!confirmed) {
      console.log('Appointment cancellation cancelled by user');
      return;
    }

    try {
      console.log('Cancelling appointment:', appointmentId);
      
      const { data, error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId)
        .eq('pet_owner_id', petOwnerProfile?.id) // Ensure user can only cancel their own appointments
        .select();

      if (error) {
        console.error('Error cancelling appointment:', error);
        alert('Failed to cancel appointment. Please try again.');
        return;
      }

      if (!data || data.length === 0) {
        console.error('No appointment found or permission denied');
        alert('Unable to cancel appointment. Please contact support.');
        return;
      }

      console.log('Appointment cancelled successfully:', data[0]);
      alert('Appointment cancelled successfully.');
      
      // Refresh the appointments data
      await fetchPetOwnerData();
      
    } catch (error) {
      console.error('Unexpected error cancelling appointment:', error);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  const handleAppointmentUpdate = () => {
    console.log('Refreshing appointments after update');
    fetchPetOwnerData();
  };


  const handleDiaryEntrySaved = () => {
    // Refresh diary-related data
    console.log('Dashboard: Diary entry saved, refreshing data...');
    
    // Trigger PetDiary refresh
    setDiaryRefreshTrigger(prev => prev + 1);
    
    // If we're on the pets tab, we might want to refresh the diary data
    if (activeTab === 'pets') {
      console.log('Dashboard: On pets tab, triggering refresh');
    }
  };

  const handleLeaveReview = (appointment: any) => {
    console.log('Opening review modal for appointment:', appointment.id);
    setSelectedAppointmentForReview(appointment);
    setShowReviewModal(true);
  };

  const handleReviewSubmitted = () => {
    console.log('Review submitted successfully');
    setShowReviewModal(false);
    setSelectedAppointmentForReview(null);
    // Refresh appointments to show updated review status
    if (activeTab === 'appointments') {
      fetchTabData('appointments');
    }
  };

  const handleCropComplete = (croppedImageBlob: Blob) => {
    setCroppedImageBlob(croppedImageBlob);
    
    // Create preview from cropped blob
    const reader = new FileReader();
    reader.onload = (e) => {
      setProfileImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(croppedImageBlob);
    
    setShowCropModal(false);
    setImageForCropping(null);
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setImageForCropping(null);
    setCroppedImageBlob(null);
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div className="ml-3 sm:ml-4 min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  if (petOwnerStats.loading) {
    return (
      <ProtectedRoute requiredRole="pet_owner">
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#0032A0] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your pet dashboard...</p>
            </div>
          </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="pet_owner">
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pb-20">
          {/* Header */}
        <div className="bg-gradient-to-r from-[#0032A0] to-[#0053d6] px-4 pt-16 pb-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-center sm:text-left">
                  <div className="flex items-center space-x-4 mb-2">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
                      {petOwnerProfile?.profile_picture_url ? (
                        <img 
                          src={petOwnerProfile.profile_picture_url} 
                          alt={petOwnerProfile.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserCircleIcon className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                        {t('dashboard.welcome')}
                      </h1>
                      <p className="text-[#ffffff] mt-1 text-sm sm:text-base">
                        Welcome back, {petOwnerProfile?.full_name || userProfile?.full_name}
                      </p>
                      <p className="text-[#ffffff] text-xs sm:text-sm">
                        {t('dashboard.managing')} {petOwnerStats.totalPets} beloved {petOwnerStats.totalPets === 1 ? t('dashboard.pet') : t('dashboard.pets')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 -mt-4">
            {/* Navigation Tabs */}
          {/* Moved navigation bar to bottom for mobile, keep at top for desktop */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6 border dark:border-gray-700">
            {/* Desktop Navigation (top) */}
            <div className="border-b border-gray-200 dark:border-gray-700 hidden md:block">
                <nav className="-mb-px flex overflow-x-auto scrollbar-hide px-3 sm:px-6">
                  {[
                    { id: 'overview', name: t('nav.overview'), icon: ChartBarIcon },
                    { id: 'pets', name: t('nav.pets'), icon: HeartIcon },
                    { id: 'appointments', name: t('nav.appointments'), icon: CalendarDaysIcon },
                    { id: 'analytics', name: t('nav.analytics'), icon: ChartPieIcon },
                    { id: 'clinics', name: t('nav.clinics'), icon: BuildingOfficeIcon },
                    { id: 'profile', name: t('nav.profile'), icon: UserCircleIcon },
                    { id: 'settings', name: t('nav.settings'), icon: CogIcon }
                  ].map((tab) => (
                    <button
                      type="button"
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`group inline-flex items-center py-4 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                        activeTab === tab.id
                        ? 'border-[#0032A0] text-[#0032A0] dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <tab.icon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">{tab.name}</span>
                      <span className="sm:hidden">{tab.name}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          {/* Mobile Navigation (bottom) */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
            <nav className="flex justify-around px-1 py-2">
              {[
                { id: 'overview', name: 'Overview', icon: ChartBarIcon, shortName: 'Home' },
                { id: 'pets', name: 'Pets', icon: HeartIcon, shortName: 'Pets' },
                { id: 'appointments', name: 'Appointments', icon: CalendarDaysIcon, shortName: 'Book' },
                { id: 'analytics', name: 'Analytics', icon: ChartPieIcon, shortName: 'Stats' },
                { id: 'clinics', name: 'Clinics', icon: BuildingOfficeIcon, shortName: 'Clinics' },
                { id: 'profile', name: 'Profile', icon: UserCircleIcon, shortName: 'Me' },
                { id: 'settings', name: 'Settings', icon: CogIcon, shortName: 'Set' }
              ].map((tab) => (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex flex-col items-center justify-center flex-1 min-h-[60px] px-1 py-2 rounded-lg mx-1 transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'text-[#0032A0] bg-[#0032A0]/5 border border-[#0032A0]/20'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className={`w-5 h-5 sm:w-6 sm:h-6 mb-1 ${activeTab === tab.id ? 'text-[#0032A0]' : ''}`} />
                  <span className="text-[10px] sm:text-xs font-medium leading-tight text-center">
                    <span className="hidden xs:inline">{tab.name}</span>
                    <span className="xs:hidden">{tab.shortName}</span>
                  </span>
                </button>
              ))}
            </nav>
          </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                  <StatCard
                    title="My Pets"
                    value={petOwnerStats.totalPets}
                    icon={HeartIcon}
                  color="bg-[#0032A0]"
                  />
                  <StatCard
                    title="Upcoming Visits"
                    value={petOwnerStats.upcomingAppointments}
                    icon={ClockIcon}
                  color="bg-[#FFD700]"
                  />
                  <StatCard
                    title="Completed Visits"
                    value={petOwnerStats.completedAppointments}
                    icon={CheckCircleIcon}
                  color="bg-[#0053d6]"
                  />
                  <StatCard
                    title="Total Spent"
                    value={`₱${petOwnerStats.totalSpent.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
                    icon={DocumentTextIcon}
                  color="bg-[#B8860B]"
                  />
                </div>

                {/* Quick Actions & Pet Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        type="button"
                        onClick={() => setShowBookingModal(true)}
                        disabled={todayAppointmentCount >= 5}
                        className={`p-4 rounded-lg border transition-colors group ${
                          todayAppointmentCount >= 5 
                            ? 'bg-gray-100 border-gray-200 cursor-not-allowed' 
                            : 'bg-[#0032A0]/10 hover:bg-[#0032A0]/20 border-[#0032A0]/30'
                        }`}
                        title={todayAppointmentCount >= 5 ? 'Daily appointment limit reached (5/5)' : 'Book a new appointment'}
                      >
                      <CalendarDaysIcon className={`w-6 h-6 mb-2 mx-auto ${
                        todayAppointmentCount >= 5 ? 'text-gray-400' : 'text-[#0032A0]'
                      }`} />
                      <p className={`text-sm font-medium ${
                        todayAppointmentCount >= 5 ? 'text-gray-500' : 'text-[#0032A0]'
                      }`}>
                        Book Appointment
                        {todayAppointmentCount >= 5 && (
                          <span className="block text-xs text-red-500 mt-1">Limit Reached</span>
                        )}
                      </p>
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleTabChange('pets')}
                        className="p-4 bg-stone-50 hover:bg-stone-100 rounded-lg border border-stone-200 transition-colors group"
                      >
                        <HeartIcon className="w-6 h-6 text-stone-600 mb-2 mx-auto" />
                        <p className="text-sm font-medium text-stone-700">Manage Pets</p>
                      </button>

                      <button 
                        type="button"
                        onClick={() => handleTabChange('clinics')}
                      className="p-4 bg-[#FFD700]/20 hover:bg-[#FFD700]/30 rounded-lg border border-[#FFD700]/50 transition-colors group"
                      >
                      <BuildingOfficeIcon className="w-6 h-6 text-[#B8860B] mb-2 mx-auto" />
                      <p className="text-sm font-medium text-[#B8860B]">Clinics</p>
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleTabChange('analytics')}
                        className="p-4 bg-[#0053d6]/10 hover:bg-[#0053d6]/20 rounded-lg border border-[#0053d6]/30 transition-colors group"
                      >
                        <ChartPieIcon className="w-6 h-6 text-[#0053d6] mb-2 mx-auto" />
                        <p className="text-sm font-medium text-[#0053d6]">Analytics</p>
                      </button>
                    </div>
                  </div>

                  {/* Pet Summary */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Pet Care Summary</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Pets</span>
                      <span className="font-semibold text-[#0032A0]">{petOwnerStats.totalPets}</span>
                      </div>
                      <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Upcoming Appointments</span>
                      <span className="font-semibold text-[#FFD700]">{petOwnerStats.upcomingAppointments}</span>
                      </div>
                      <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Today's Appointments</span>
                      <span className={`font-semibold ${todayAppointmentCount >= 5 ? 'text-red-600' : 'text-green-600'}`}>
                        {todayAppointmentCount}/5
                      </span>
                      </div>
                      <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Last Visit</span>
                      <span className="font-semibold text-gray-900">{petOwnerStats.lastVisit}</span>
                      </div>
                    </div>
                    
                    {/* Appointment Limit Warning */}
                    {todayAppointmentCount >= 5 && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center">
                          <XCircleIcon className="w-5 h-5 text-red-600 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-red-800">Daily Limit Reached</p>
                            <p className="text-xs text-red-700">You've reached the limit of 5 appointments per day. Book for another date.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Pets */}
                {pets.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Your Pets</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pets.slice(0, 6).map((pet) => (
                        <div key={pet.id} className="p-4 bg-stone-50 rounded-lg border border-stone-200">
                          <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-[#0032A0]/10 rounded-full flex items-center justify-center overflow-hidden">
                              {pet.profile_picture_url ? (
                                <img 
                                  src={pet.profile_picture_url} 
                                  alt={pet.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                          <HeartIcon className="w-6 h-6 text-[#0032A0]" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900">{pet.name}</h4>
                            <p className="text-sm text-gray-600">{pet.species} • {pet.breed}</p>
                            <p className="text-xs text-gray-500">
                                {pet.date_of_birth && `Born ${new Date(pet.date_of_birth).getFullYear()}`}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}


            {/* My Pets Tab */}
            {activeTab === 'pets' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">My Pets & Health Diary</h2>
                  <button
                    onClick={() => setShowAddPetModal(true)}
                  className="bg-[#0032A0] text-white px-4 py-2 rounded-lg hover:bg-[#0053d6] flex items-center space-x-2"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>Add New Pet</span>
                  </button>
                </div>

                {pets.length === 0 ? (
                  <div className="text-center py-12">
                    <HeartIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Pets Found</h3>
                    <p className="text-gray-500 mb-6">
                      Add your first pet to start managing their health records and diary entries.
                    </p>
                    <button
                      onClick={() => setShowAddPetModal(true)}
                      className="bg-[#0032A0] text-white px-6 py-3 rounded-lg hover:bg-[#0053d6] flex items-center space-x-2 mx-auto transition-colors"
                    >
                      <PlusIcon className="w-5 h-5" />
                      <span>Add Your First Pet</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Pet Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {pets.map((pet) => (
                      <div key={pet.id} className="group relative bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-300 hover:scale-[1.02] hover:border-blue-200 overflow-hidden">
                          {/* Background Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-blue-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          
                          {/* Main Content */}
                          <div className="relative p-6">
                            {/* Header Section */}
                            <div className="flex items-start justify-between mb-6">
                              <div className="flex items-center space-x-4">
                                {/* Pet Avatar with Animation */}
                                <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-100 to-blue-50 border-2 border-white shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                                  {pet.profile_picture_url ? (
                                    <img 
                                      src={pet.profile_picture_url} 
                                      alt={pet.name}
                                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                        <div className="w-3 h-3 bg-white rounded-full"></div>
                                      </div>
                                    </div>
                                  )}
                                  {/* Status Indicator */}
                                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                  </div>
                                </div>
                                
                                {/* Pet Info */}
                                <div className="flex-1">
                                  <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors">{pet.name}</h3>
                                  <p className="text-gray-600 font-medium capitalize">{pet.species}</p>
                                  <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                    {pet.breed || 'Mixed Breed'}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                <button 
                                  onClick={() => handleViewPet(pet)}
                                  className="p-3 text-blue-600 hover:text-white hover:bg-blue-600 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-110 bg-blue-50 border border-blue-200"
                                  title="View Details"
                                >
                                  <EyeIcon className="w-5 h-5" />
                                </button>
                                <button 
                                  onClick={() => handleEditPet(pet)}
                                  className="p-3 text-amber-600 hover:text-white hover:bg-amber-600 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-110 bg-amber-50 border border-amber-200"
                                  title="Edit Pet"
                                >
                                  <PencilIcon className="w-5 h-5" />
                                </button>
                                <button 
                                  onClick={() => handleDeletePet(pet)}
                                  className="p-3 text-red-600 hover:text-white hover:bg-red-600 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-110 bg-red-50 border border-red-200"
                                  title="Remove Pet"
                                >
                                  <TrashIcon className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                            
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:bg-gray-100 transition-colors">
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Gender</div>
                                <div className="text-lg font-bold text-gray-900 capitalize">{pet.gender || 'Unknown'}</div>
                              </div>
                              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:bg-gray-100 transition-colors">
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Weight</div>
                                <div className="text-lg font-bold text-gray-900">{pet.weight ? `${pet.weight} kg` : 'N/A'}</div>
                              </div>
                            </div>
                            
                            {/* Age Info */}
                            {pet.date_of_birth && (
                              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">Age</div>
                                    <div className="text-lg font-bold text-blue-900">
                                      {new Date().getFullYear() - new Date(pet.date_of_birth).getFullYear()} years old
                                    </div>
                                  </div>
                                  <div className="w-12 h-12 bg-blue-200 rounded-xl flex items-center justify-center">
                                    <CalendarDaysIcon className="w-6 h-6 text-blue-600" />
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Quick Actions Bar - Always Visible with Mobile Optimization */}
                            <div className="mt-6 pt-4 border-t border-gray-100">
                              <span className="text-gray-500 font-medium text-sm mb-3 block">Quick Actions</span>
                              
                              {/* Mobile-first approach: Always show grid on small screens */}
                              <div className="grid grid-cols-3 gap-2 md:hidden">
                                <button className="px-2 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-xs touch-manipulation min-h-[36px] flex items-center justify-center">
                                  Quick Actions
                                </button>
                                <button className="px-2 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium text-xs touch-manipulation min-h-[36px] flex items-center justify-center">
                                  Health Record
                                </button>
                                <button className="px-2 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium text-xs touch-manipulation min-h-[36px] flex items-center justify-center">
                                  Book Visit
                                </button>
                              </div>
                              
                              {/* Desktop: Horizontal layout */}
                              <div className="hidden md:flex items-center justify-between text-sm">
                                <div className="flex space-x-2 ml-auto">
                                  <button className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium">
                                    Health Record
                                  </button>
                                  <button className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium">
                                    Book Visit
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Hover Effect Border */}
                          <div className="absolute inset-0 rounded-2xl border-2 border-blue-400/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                        </div>
                      ))}
                    </div>

                    {/* Pet Diary Section */}
                    <div className="mt-8">
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <DocumentTextIcon className="w-5 h-5 text-[#0032A0]" />
                          Pet Health Diary
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Track your pets' daily activities, health observations, and behavioral patterns.
                        </p>
                      </div>
                      
                      <PetDiary 
                        pets={pets.map(pet => ({
                          id: pet.id,
                          name: pet.name,
                          species: pet.species,
                          breed: pet.breed || '',
                          profile_picture_url: pet.profile_picture_url || ''
                        }))}
                        petOwnerId={petOwnerProfile?.id || 0}
                        refreshTrigger={diaryRefreshTrigger}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Appointments Tab */}
            {activeTab === 'appointments' && (
              <div className="space-y-6">
                {/* Appointments Header */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center">
                      <CalendarDaysIcon className="w-6 h-6 text-[#0032A0] mr-2" />
                        My Appointments
                      </h2>
                    <p className="text-gray-600 text-sm mt-1">
                        Track your pet's healthcare appointments and history
                      </p>
                    </div>
                    <button
                      onClick={() => handleTabChange('clinics')}
                    className="bg-[#0032A0] text-white px-4 py-2 rounded-lg hover:bg-[#0053d6] flex items-center space-x-2 transition-colors"
                    >
                      <PlusIcon className="w-4 h-4" />
                      <span>Book New Appointment</span>
                    </button>
                  </div>
                </div>

                {/* Appointment Status Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <ClockIcon className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                      <p className="text-2xl font-bold text-gray-900">
                          {appointments.filter(apt => apt.status === 'pending').length}
                        </p>
                      <p className="text-xs text-gray-600">Pending</p>
                      </div>
                    </div>
                  </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center space-x-3">
                    <div className="p-2 bg-[#0032A0]/10 rounded-lg">
                      <CheckCircleIcon className="w-5 h-5 text-[#0032A0]" />
                      </div>
                      <div>
                      <p className="text-2xl font-bold text-gray-900">
                          {appointments.filter(apt => apt.status === 'confirmed').length}
                        </p>
                      <p className="text-xs text-gray-600">Confirmed</p>
                      </div>
                    </div>
                  </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                      <p className="text-2xl font-bold text-gray-900">
                          {appointments.filter(apt => apt.status === 'completed').length}
                        </p>
                      <p className="text-xs text-gray-600">Completed</p>
                      </div>
                    </div>
                  </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-stone-100 rounded-lg">
                        <CalendarDaysIcon className="w-5 h-5 text-stone-600" />
                      </div>
                      <div>
                      <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
                      <p className="text-xs text-gray-600">Total</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Appointments List */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Appointment History</h3>
                  </div>

                  {appointments.length === 0 ? (
                    <div className="p-8 text-center">
                    <CalendarDaysIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Appointments Yet</h4>
                    <p className="text-gray-600 mb-6">
                        You haven't booked any appointments for your pets yet.
                      </p>
                      <button
                        onClick={() => handleTabChange('clinics')}
                        className="bg-[#0032A0] text-white px-6 py-3 rounded-lg hover:bg-[#0053d6] flex items-center space-x-2 mx-auto transition-colors"
                      >
                        <PlusIcon className="w-5 h-5" />
                        <span>Book Your First Appointment</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Mobile Cards */}
                      <div className="md:hidden">
                        {appointments.map((appointment) => (
                        <div key={appointment.id} className="p-4 border-b border-gray-200 last:border-b-0">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <HeartIcon className="w-4 h-4 text-[#0032A0]" />
                                <span className="font-medium text-gray-900">
                                    {appointment.patients?.name}
                                  </span>
                                <span className="text-sm text-gray-500">
                                    ({appointment.patients?.species})
                                  </span>
                                </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                                  <UserCircleIcon className="w-4 h-4" />
                                  <span>Dr. {appointment.veterinarians?.full_name}</span>
                                </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                                  <BuildingOfficeIcon className="w-4 h-4" />
                                  <span>{appointment.clinics?.name}</span>
                                </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <CalendarDaysIcon className="w-4 h-4" />
                                  <span>
                                    {new Date(appointment.appointment_date).toLocaleDateString()} at {appointment.appointment_time}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end space-y-2">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  appointment.status === 'completed'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : appointment.status === 'confirmed'
                                      ? 'bg-[#b3c7e6] text-[#0032A0]'
                                      : appointment.status === 'pending'
                                        ? 'bg-amber-100 text-amber-800'
                                        : appointment.status === 'cancelled'
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-stone-100 text-stone-800'
                                }`}>
                                  {appointment.status === 'in_progress' ? 'In Progress' : 
                                   appointment.status === 'no_show' ? 'No Show' :
                                   appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                </span>
                                {appointment.total_amount && (
                                <span className="text-sm font-medium text-gray-900">
                                    ₱{appointment.total_amount.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            {appointment.reason_for_visit && (
                              <div className="mt-3 p-3 bg-stone-50 rounded-lg">
                              <p className="text-sm text-gray-600">
                                  <span className="font-medium">Reason:</span> {appointment.reason_for_visit}
                                </p>
                              </div>
                            )}
                            <div className="flex space-x-2 mt-3">
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('Test button clicked for appointment:', appointment.id);
                                  handleTestModal(appointment.id);
                                }}
                                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded transition-colors"
                              >
                                Test
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('View details clicked for appointment:', appointment.id);
                                  handleViewDetails(appointment.id);
                                }}
                                className="flex-1 text-[#0032A0] hover:text-[#0053d6] text-sm font-medium"
                              >
                                View Details
                              </button>
                              {appointment.status === 'pending' && (
                                <button 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('Cancel clicked for appointment:', appointment.id);
                                    handleCancelAppointment(appointment.id);
                                  }}
                                  className="flex-1 text-red-600 hover:text-red-900 text-sm font-medium"
                                >
                                  Cancel
                                </button>
                              )}
                              {appointment.status === 'completed' && (
                                <button 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('Leave review clicked for appointment:', appointment.id);
                                    handleLeaveReview(appointment);
                                  }}
                                  className="flex-1 text-yellow-600 hover:text-yellow-900 text-sm font-medium"
                                >
                                  Leave Review
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop Table */}
                      <div className="hidden md:block overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Pet & Owner
                              </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Veterinarian
                              </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date & Time
                              </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Clinic
                              </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
                              </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {appointments.map((appointment) => (
                            <tr key={appointment.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="w-10 h-10 bg-[#b3c7e6] rounded-full flex items-center justify-center mr-3">
                                      <HeartIcon className="w-5 h-5 text-[#0032A0]" />
                                    </div>
                                    <div>
                                    <div className="text-sm font-medium text-gray-900">
                                        {appointment.patients?.name}
                                      </div>
                                    <div className="text-sm text-gray-500">
                                        {appointment.patients?.species} • {appointment.patients?.breed}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div>
                                  <div className="text-sm font-medium text-gray-900">
                                      Dr. {appointment.veterinarians?.full_name}
                                    </div>
                                  <div className="text-sm text-gray-500">
                                      {appointment.veterinarians?.specialization || 'General Practice'}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                    {formatDate(appointment.appointment_date)}
                                  </div>
                                <div className="text-sm text-gray-500">
                                    {appointment.appointment_time ? formatTime(
                                      new Date(`${appointment.appointment_date}T${appointment.appointment_time}`)
                                    ) : appointment.appointment_time}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{appointment.clinics?.name}</div>
                                <div className="text-sm text-gray-500">{appointment.clinics?.address}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    appointment.status === 'completed'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : appointment.status === 'confirmed'
                                        ? 'bg-[#b3c7e6] text-[#0032A0]'
                                        : appointment.status === 'pending'
                                          ? 'bg-amber-100 text-amber-800'
                                          : appointment.status === 'cancelled'
                                            ? 'bg-red-100 text-red-800'
                                            : appointment.status === 'in_progress'
                                              ? 'bg-blue-100 text-blue-800'
                                              : 'bg-stone-100 text-stone-800'
                                  }`}>
                                    {appointment.status === 'in_progress' ? 'In Progress' : 
                                     appointment.status === 'no_show' ? 'No Show' :
                                     appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                  </span>
                                </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {appointment.total_amount ? `₱${appointment.total_amount.toLocaleString()}` : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex space-x-2">
                                    {/* Test Button */}
                                    <button 
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('Test button clicked for appointment:', appointment.id);
                                        handleTestModal(appointment.id);
                                      }}
                                      className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded font-medium transition-colors"
                                      title="Open Test Modal"
                                    >
                                      Test
                                    </button>
                                    <button 
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('Eye icon clicked for appointment:', appointment.id);
                                        handleViewDetails(appointment.id);
                                      }}
                                      className="text-teal-600 hover:text-teal-900"
                                      title="View Appointment Details"
                                    >
                                      <EyeIcon className="w-4 h-4" />
                                    </button>
                                    {appointment.status === 'pending' && (
                                      <button 
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          console.log('Cancel icon clicked for appointment:', appointment.id);
                                          handleCancelAppointment(appointment.id);
                                        }}
                                        className="text-red-600 hover:text-red-900"
                                        title="Cancel Appointment"
                                      >
                                        <XCircleIcon className="w-4 h-4" />
                                      </button>
                                    )}
                                    {appointment.status === 'completed' && (
                                      <>
                                        <button className="text-amber-600 hover:text-amber-900" title="View Report">
                                          <DocumentTextIcon className="w-4 h-4" />
                                        </button>
                                        {/* Leave Review Button for completed appointments */}
                                        <button 
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            console.log('Leave review clicked for appointment:', appointment.id);
                                            handleLeaveReview(appointment);
                                          }}
                                          className="text-yellow-600 hover:text-yellow-900"
                                          title="Leave Review"
                                        >
                                          <StarIcon className="w-4 h-4" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>

                {/* Recent Activity or Tips */}
                {appointments.length > 0 && (
                  <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl border border-teal-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Appointment Tips</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start space-x-3">
                        <div className="bg-teal-100 p-2 rounded-lg">
                          <ClockIcon className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                        <h5 className="font-medium text-gray-900">Arrive Early</h5>
                        <p className="text-sm text-gray-600">
                            Arrive 10-15 minutes before your appointment for check-in
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="bg-emerald-100 p-2 rounded-lg">
                          <DocumentTextIcon className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                        <h5 className="font-medium text-gray-900">Bring Records</h5>
                        <p className="text-sm text-gray-600">
                            Bring any previous medical records or vaccination certificates
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'clinics' && <FindClinics />}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                {/* Analytics Header */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                        <ChartBarIcon className="w-6 h-6 text-gray-600 dark:text-gray-400 mr-2" />
                        {t('analytics.title')}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                        {t('analytics.description')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => fetchAnalyticsData()}
                        className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 flex items-center space-x-2 transition-colors text-sm"
                      >
                        <ArrowPathIcon className="w-4 h-4" />
                        <span>Refresh Data</span>
                      </button>
                    </div>
                  </div>
                </div>

                {analyticsData.loading ? (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading analytics data...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Key Metrics Summary */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Overview</h3>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="group text-center p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200 cursor-pointer">
                          <div className="text-2xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                            {analyticsData.appointmentTrends.reduce((sum, item) => sum + item.total, 0)}
                          </div>
                          <div className="text-sm text-gray-600 mt-1 group-hover:text-gray-500 transition-colors">Total Appointments</div>
                          <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gray-400 rounded-full group-hover:bg-gray-500 transition-all duration-500" style={{width: '100%'}}></div>
                          </div>
                        </div>
                        <div className="group text-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-sm transition-all duration-200 cursor-pointer">
                          <div className="text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                            {analyticsData.appointmentTrends.reduce((sum, item) => sum + item.completed, 0)}
                          </div>
                          <div className="text-sm text-gray-600 mt-1 group-hover:text-green-500 transition-colors">Completed</div>
                          <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-green-400 rounded-full group-hover:bg-green-500 transition-all duration-500" 
                                 style={{width: `${(analyticsData.appointmentTrends.reduce((sum, item) => sum + item.completed, 0) / Math.max(analyticsData.appointmentTrends.reduce((sum, item) => sum + item.total, 0), 1)) * 100}%`}}></div>
                          </div>
                        </div>
                        <div className="group text-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all duration-200 cursor-pointer">
                          <div className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            ₱{analyticsData.monthlySpending.reduce((sum, item) => sum + item.spending, 0).toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600 mt-1 group-hover:text-blue-500 transition-colors">Total Spent</div>
                          <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-400 rounded-full group-hover:bg-blue-500 transition-all duration-500" style={{width: '85%'}}></div>
                          </div>
                        </div>
                        <div className="group text-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-sm transition-all duration-200 cursor-pointer">
                          <div className="text-2xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                            ₱{Math.round(analyticsData.monthlySpending.reduce((sum, item) => sum + item.spending, 0) / 6).toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600 mt-1 group-hover:text-purple-500 transition-colors">Avg Monthly</div>
                          <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-400 rounded-full group-hover:bg-purple-500 transition-all duration-500" style={{width: '60%'}}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Monthly Breakdown */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Monthly Activity (Last 6 Months)</h3>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <span className="text-xs text-gray-500">Hover for details</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {analyticsData.appointmentTrends.map((month, index) => {
                          const spending = analyticsData.monthlySpending.find(s => s.month === month.month)?.spending || 0;
                          const completionRate = month.total > 0 ? (month.completed / month.total) * 100 : 0;
                          return (
                            <div key={index} className="group relative">
                              <div className="flex items-center justify-between py-4 px-4 rounded-lg border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-all duration-200 cursor-pointer">
                                <div className="flex items-center space-x-3">
                                  <div className="font-medium text-gray-900 group-hover:text-gray-700 transition-colors">{month.month}</div>
                                  <div className="flex-1 max-w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500" 
                                         style={{width: `${completionRate}%`}}></div>
                                  </div>
                                  <span className="text-xs text-gray-500 group-hover:text-gray-600">{completionRate.toFixed(0)}%</span>
                                </div>
                                <div className="flex items-center space-x-6 text-sm">
                                  <div className="text-center group-hover:transform group-hover:scale-105 transition-transform">
                                    <div className="font-medium text-gray-900">{month.total}</div>
                                    <div className="text-gray-600 text-xs">Total</div>
                                  </div>
                                  <div className="text-center group-hover:transform group-hover:scale-105 transition-transform">
                                    <div className="font-medium text-green-600">{month.completed}</div>
                                    <div className="text-gray-600 text-xs">Done</div>
                                  </div>
                                  {month.pending > 0 && (
                                    <div className="text-center group-hover:transform group-hover:scale-105 transition-transform">
                                      <div className="font-medium text-amber-600">{month.pending}</div>
                                      <div className="text-gray-600 text-xs">Pending</div>
                                    </div>
                                  )}
                                  {month.cancelled > 0 && (
                                    <div className="text-center group-hover:transform group-hover:scale-105 transition-transform">
                                      <div className="font-medium text-red-500">{month.cancelled}</div>
                                      <div className="text-gray-600 text-xs">Cancelled</div>
                                    </div>
                                  )}
                                  <div className="text-center group-hover:transform group-hover:scale-105 transition-transform">
                                    <div className="font-medium text-gray-900">₱{spending.toLocaleString()}</div>
                                    <div className="text-gray-600 text-xs">Spent</div>
                                  </div>
                                </div>
                              </div>
                              {/* Tooltip-like expansion */}
                              <div className="absolute left-0 right-0 top-full mt-1 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 transition-all duration-200 pointer-events-none z-10">
                                <div className="flex justify-between items-center">
                                  <span>Success rate: {completionRate.toFixed(1)}%</span>
                                  {spending > 0 && <span>Avg per visit: ₱{Math.round(spending / Math.max(month.completed, 1)).toLocaleString()}</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Pet Care Summary */}
                    {analyticsData.petHealthMetrics.length > 0 && (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">Pet Care Summary</h3>
                          <div className="flex items-center space-x-1">
                            {analyticsData.petHealthMetrics.map((_, i) => (
                              <div key={i} className={`w-1.5 h-1.5 rounded-full ${
                                i === 0 ? 'bg-blue-400' : i === 1 ? 'bg-green-400' : i === 2 ? 'bg-purple-400' : 'bg-gray-400'
                              }`}></div>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {analyticsData.petHealthMetrics.map((pet, index) => {
                            const avgSpending = pet.completedVisits > 0 ? pet.totalSpent / pet.completedVisits : 0;
                            const colors = ['blue', 'green', 'purple', 'indigo'];
                            const color = colors[index % colors.length];
                            return (
                              <div key={index} className={`group border border-gray-200 hover:border-${color}-300 rounded-lg p-4 hover:shadow-sm transition-all duration-200 cursor-pointer relative overflow-hidden`}>
                                <div className={`absolute top-0 right-0 w-16 h-16 bg-${color}-50 rounded-full -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                                <div className="relative">
                                  <div className="flex items-center justify-between mb-3">
                                    <div>
                                      <h4 className={`font-medium text-gray-900 group-hover:text-${color}-600 transition-colors`}>{pet.name}</h4>
                                      <p className="text-sm text-gray-600">{pet.species}</p>
                                    </div>
                                    <div className="text-right">
                                      <div className={`text-lg font-semibold text-gray-900 group-hover:text-${color}-600 transition-colors`}>{pet.completedVisits}</div>
                                      <div className="text-xs text-gray-600">visits</div>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-gray-600">Total spent:</span>
                                      <span className="font-medium text-gray-900">₱{pet.totalSpent.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-gray-600">Avg per visit:</span>
                                      <span className="font-medium text-gray-700">₱{Math.round(avgSpending).toLocaleString()}</span>
                                    </div>
                                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                      <div className={`h-full bg-${color}-400 rounded-full transition-all duration-500 group-hover:bg-${color}-500`} 
                                           style={{width: `${Math.min((pet.completedVisits / 10) * 100, 100)}%`}}></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Services Used */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Services Used</h3>
                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {analyticsData.serviceBreakdown.length} services
                        </div>
                      </div>
                      <div className="space-y-2">
                        {analyticsData.serviceBreakdown.map((service, index) => {
                          const maxCount = Math.max(...analyticsData.serviceBreakdown.map(s => s.count));
                          const width = (service.count / maxCount) * 100;
                          const colors = ['blue', 'green', 'purple', 'indigo', 'pink'];
                          const color = colors[index % colors.length];
                          return (
                            <div key={index} className="group relative">
                              <div className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                                <div className="flex items-center space-x-3 flex-1">
                                  <div className={`w-2 h-2 bg-${color}-400 rounded-full flex-shrink-0`}></div>
                                  <span className={`text-gray-700 group-hover:text-${color}-600 transition-colors font-medium`}>{service.service}</span>
                                  <div className="flex-1 mx-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className={`h-full bg-${color}-400 rounded-full transition-all duration-500 group-hover:bg-${color}-500`} 
                                         style={{width: `${width}%`}}></div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3 text-sm">
                                  <span className="text-gray-600 group-hover:text-gray-700 transition-colors">{service.count} times</span>
                                  <span className={`font-medium text-gray-900 group-hover:text-${color}-600 transition-colors min-w-[3rem] text-right`}>{service.percentage.toFixed(1)}%</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Recent Activity */}
                    {analyticsData.spendingAnalysis.length > 0 && (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                            <span className="text-xs text-gray-500">Last 5 transactions</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {analyticsData.spendingAnalysis.slice(0, 5).map((item, index) => {
                            const colors = ['orange', 'blue', 'green', 'purple', 'pink'];
                            const color = colors[index % colors.length];
                            return (
                              <div key={index} className="group relative">
                                <div className="flex items-center justify-between py-3 px-3 rounded-lg border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-all duration-200 cursor-pointer">
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-2 h-2 bg-${color}-400 rounded-full flex-shrink-0 group-hover:scale-125 transition-transform`}></div>
                                    <div>
                                      <div className={`font-medium text-gray-900 group-hover:text-${color}-600 transition-colors`}>{item.service}</div>
                                      <div className="text-sm text-gray-600 group-hover:text-gray-500 transition-colors">{item.pet} • {item.date}</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <div className={`font-medium text-gray-900 group-hover:text-${color}-600 transition-colors`}>₱{item.amount.toLocaleString()}</div>
                                    <div className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <svg className={`w-4 h-4 text-${color}-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                                {/* Progress indicator */}
                                <div className="absolute left-0 bottom-0 h-0.5 bg-gray-100 w-full">
                                  <div className={`h-full bg-${color}-400 transition-all duration-300 group-hover:bg-${color}-500`} 
                                       style={{width: `${((index + 1) / 5) * 100}%`}}></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-100">
                          <div className="text-center">
                            <button className="text-sm text-gray-500 hover:text-gray-700 transition-colors inline-flex items-center space-x-1">
                              <span>View all transactions</span>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Profile Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 flex items-center">
                        <UserCircleIcon className="w-6 h-6 text-[#0032A0] mr-2" />
                        My Profile
                      </h2>
                      <p className="text-gray-600 text-sm mt-1">
                        Manage your account information and contact details
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setProfileForm({
                          full_name: petOwnerProfile?.full_name || '',
                          phone: petOwnerProfile?.phone || '',
                          address: petOwnerProfile?.address || '',
                          emergency_contact_name: petOwnerProfile?.emergency_contact_name || '',
                          emergency_contact_phone: petOwnerProfile?.emergency_contact_phone || '',
                          profile_picture_url: (petOwnerProfile as any)?.profile_picture_url || ''
                        });
                        setProfileImagePreview((petOwnerProfile as any)?.profile_picture_url || null);
                        setShowProfileModal(true);
                      }}
                      className="bg-[#0032A0] text-white px-4 py-2 rounded-lg hover:bg-[#0053d6] flex items-center space-x-2 transition-colors"
                    >
                      <PencilIcon className="w-4 h-4" />
                      <span>Edit Profile</span>
                    </button>
                  </div>
                </div>

                {/* Profile Information */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h3>
                  
                  <div className="flex items-start space-x-6 mb-6">
                    <div className="w-24 h-24 bg-[#0032A0]/10 rounded-full flex items-center justify-center overflow-hidden">
                      {petOwnerProfile?.profile_picture_url ? (
                        <img 
                          src={petOwnerProfile.profile_picture_url} 
                          alt={petOwnerProfile.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserCircleIcon className="w-12 h-12 text-[#0032A0]" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-900">{petOwnerProfile?.full_name || 'Pet Owner'}</h4>
                      <p className="text-gray-600">Member since {petOwnerProfile?.created_at 
                        ? formatDate(petOwnerProfile.created_at)
                        : 'Unknown'
                      }</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <p className="text-gray-900 font-medium">{petOwnerProfile?.full_name || 'Not provided'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                        <p className="text-gray-900 font-medium">{petOwnerProfile?.phone || 'Not provided'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                        <p className="text-gray-900 font-medium">{petOwnerProfile?.address || 'Not provided'}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Name</label>
                        <p className="text-gray-900 font-medium">{petOwnerProfile?.emergency_contact_name || 'Not provided'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Phone</label>
                        <p className="text-gray-900 font-medium">{petOwnerProfile?.emergency_contact_phone || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Statistics */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Account Statistics</h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 border border-gray-200 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{petOwnerStats.totalPets}</p>
                      <p className="text-sm text-gray-600">Total Pets</p>
                    </div>
                    
                    <div className="text-center p-4 border border-gray-200 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{petOwnerStats.completedAppointments}</p>
                      <p className="text-sm text-gray-600">Completed Visits</p>
                    </div>
                    
                    <div className="text-center p-4 border border-gray-200 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{petOwnerStats.upcomingAppointments}</p>
                      <p className="text-sm text-gray-600">Upcoming Visits</p>
                    </div>
                    
                    <div className="text-center p-4 border border-gray-200 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">₱{petOwnerStats.totalSpent.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Total Spent</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <UserSettingsPanel />
              </div>
            )}
          </div>

          {/* Add Pet Modal */}
          {showAddPetModal && (
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              {/* Enhanced Background with More Vibrant Gradient */}
              <div className="absolute inset-0 bg-transparent">

              </div>
              
              <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl relative border border-white/20">
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-6 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                        <HeartIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Add New Pet</h3>
                        <p className="text-teal-100 text-sm">Register your beloved companion</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowAddPetModal(false)}
                      className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                    >
                      <XCircleIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleAddPet} className="p-6 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                    <label className="flex items-center text-sm font-semibold text-gray-800 mb-2">
                        <HeartIcon className="w-4 h-4 mr-2 text-teal-600" />
                        Pet Name
                      </label>
                      <input
                        type="text"
                        required
                        value={newPet.name}
                        onChange={(e) => setNewPet(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-white focus:bg-white text-gray-900 placeholder:text-gray-500 font-medium"
                        placeholder="e.g., Buddy, Luna"
                      />
                    </div>
                    <div>
                    <label className="flex items-center text-sm font-semibold text-gray-800 mb-2">
                        <DocumentTextIcon className="w-4 h-4 mr-2 text-teal-600" />
                        Species
                      </label>
                      <select
                        required
                        value={newPet.species}
                        onChange={(e) => handleSpeciesChange(e.target.value)}
                        key={`species-${availableSpecies.length}-${isMounted}`}
                      className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-white focus:bg-white text-gray-900 font-medium"
                    >
                      <option value="" className="text-gray-500">Select Species</option>
                      {availableSpecies.map(species => (
                        <option key={species} value={species} className="text-gray-900">
                          {species}
                        </option>
                      ))}
                      </select>
                      
                      {/* Custom Species Input - Only show when 'Others' is selected */}
                      {newPet.species === 'Others' && (
                        <div className="mt-3">
                          <label className="block text-sm font-semibold text-gray-800 mb-2">
                            Please specify the pet type *
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              required
                              value={newPet.customSpecies}
                              onChange={(e) => setNewPet(prev => ({ ...prev, customSpecies: e.target.value }))}
                              maxLength={50}
                              minLength={2}
                              className="flex-1 px-4 py-3 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-white focus:bg-white text-gray-900 placeholder:text-gray-500 font-medium"
                              placeholder="Enter your pet's type (e.g., Octopus, Ferret)"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleCustomSpeciesSubmit();
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={handleCustomSpeciesSubmit}
                              disabled={!newPet.customSpecies.trim()}
                              className="px-4 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                            >
                              Add
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            This will be saved and available for future selections
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pet Image Upload Section */}
                  <div className="space-y-4">
                  <label className="flex items-center text-sm font-semibold text-gray-800 mb-2">
                      <HeartIcon className="w-4 h-4 mr-2 text-teal-600" />
                      Pet Photo (Optional)
                    </label>
                    
                    <div className="flex flex-col items-center space-y-4">
                      {/* Image Preview */}
                      <div className="w-32 h-32 border-2 border-dashed border-stone-300 rounded-xl flex items-center justify-center bg-stone-50 overflow-hidden">
                        {imagePreview ? (
                          <img 
                            src={imagePreview} 
                            alt="Pet preview" 
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <div className="text-center">
                            <HeartIcon className="w-8 h-8 text-stone-400 mx-auto mb-1" />
                            <p className="text-xs text-stone-500">Upload photo</p>
                          </div>
                        )}
                      </div>
                      
                      {/* File Input */}
                      <div className="flex items-center space-x-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                          id="pet-image-upload"
                        />
                        <label
                          htmlFor="pet-image-upload"
                          className="cursor-pointer bg-teal-100 hover:bg-teal-200 text-teal-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                        >
                          <PlusIcon className="w-4 h-4" />
                          <span>Choose Photo</span>
                        </label>
                        
                        {selectedImage && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedImage(null);
                              setImagePreview(null);
                            }}
                            className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                          >
                            <XCircleIcon className="w-4 h-4" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                      
                      {/* Upload Status */}
                      {uploadingImage && (
                        <div className="flex items-center space-x-2 text-sm text-teal-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
                          <span>Uploading image...</span>
                        </div>
                      )}
                      
                      <p className="text-xs text-stone-500 text-center max-w-xs">
                        Supported formats: JPG, PNG, GIF. Max size: 5MB
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Breed
                      </label>
                      {showBreedDropdown && availableBreeds.length > 0 ? (
                        <div className="space-y-3">
                          <select
                            value={newPet.breed}
                            onChange={(e) => handleBreedSelect(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-white focus:bg-white text-gray-900 font-medium"
                          >
                            <option value="" className="text-gray-500">Select Breed</option>
                            {availableBreeds.map(breed => (
                              <option key={breed} value={breed} className="text-gray-900">
                                {breed}
                              </option>
                            ))}
                          </select>
                          <div className="text-center">
                            <button
                              type="button"
                              onClick={() => setShowBreedDropdown(false)}
                              className="text-sm text-teal-600 hover:text-teal-700 underline"
                            >
                              Or type a custom breed
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={newPet.breed}
                            onChange={(e) => setNewPet(prev => ({ ...prev, breed: e.target.value }))}
                            className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-white focus:bg-white text-gray-900 placeholder:text-gray-500 font-medium"
                            placeholder="e.g., Golden Retriever"
                          />
                          {newPet.species && hasPredefindedBreeds(newPet.species) && (
                            <div className="text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setAvailableBreeds(getBreedsForSpecies(newPet.species));
                                  setShowBreedDropdown(true);
                                  setNewPet(prev => ({ ...prev, breed: '' }));
                                }}
                                className="text-sm text-teal-600 hover:text-teal-700 underline"
                              >
                                Choose from {newPet.species} breeds
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Gender
                      </label>
                      <select
                        value={newPet.gender}
                        onChange={(e) => setNewPet(prev => ({ ...prev, gender: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-white focus:bg-white text-gray-900 font-medium"
                    >
                      <option value="" className="text-gray-500">Select Gender</option>
                      <option value="male" className="text-gray-900">Male</option>
                      <option value="female" className="text-gray-900">Female</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={newPet.date_of_birth}
                        onChange={(e) => setNewPet(prev => ({ ...prev, date_of_birth: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-white focus:bg-white text-gray-900 font-medium"
                      />
                    </div>
                    <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={newPet.weight}
                        onChange={(e) => setNewPet(prev => ({ ...prev, weight: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-white focus:bg-white text-gray-900 placeholder:text-gray-500 font-medium"
                        placeholder="e.g., 5.2"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-stone-200">
                    <button
                      type="button"
                      onClick={() => setShowAddPetModal(false)}
                      className="flex-1 px-6 py-3 border-2 border-stone-300 text-stone-700 rounded-xl hover:bg-stone-50 hover:border-stone-400 transition-all duration-200 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingPet || !isMounted}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl hover:from-teal-700 hover:to-teal-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isSubmittingPet ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Adding Pet...</span>
                        </div>
                      ) : (
                        '🐾 Add Pet'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Success Modal */}
          {showSuccessModal && addedPet && (
            <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform transition-all duration-300 animate-in zoom-in">
                {/* Success Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-6 rounded-t-2xl text-center">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircleIcon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Pet Added Successfully! 🎉</h3>
                  <p className="text-emerald-100 text-sm mt-1">Welcome to the family!</p>
                </div>

                {/* Pet Info */}
                <div className="p-6">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center overflow-hidden">
                      {imagePreview ? (
                        <img 
                          src={imagePreview} 
                          alt={addedPet.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <HeartIcon className="w-8 h-8 text-teal-600" />
                      )}
                    </div>
                    <div className="flex-1">
                    <h4 className="text-lg font-bold text-gray-900">{addedPet.name}</h4>
                    <p className="text-gray-600">{addedPet.species}</p>
                      {addedPet.breed && (
                      <p className="text-sm text-gray-500">{addedPet.breed}</p>
                      )}
                    </div>
                  </div>

                  {/* Pet Details */}
                  <div className="bg-stone-50 rounded-lg p-4 mb-6">
                  <h5 className="font-semibold text-gray-900 mb-3">Pet Details</h5>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {addedPet.gender && (
                        <div>
                        <span className="text-gray-600">Gender:</span>
                        <p className="font-medium text-gray-900 capitalize">{addedPet.gender}</p>
                        </div>
                      )}
                      {addedPet.weight && (
                        <div>
                        <span className="text-gray-600">Weight:</span>
                        <p className="font-medium text-gray-900">{addedPet.weight} kg</p>
                        </div>
                      )}
                      {addedPet.date_of_birth && (
                        <div className="col-span-2">
                        <span className="text-gray-600">Date of Birth:</span>
                        <p className="font-medium text-gray-900">
                            {new Date(addedPet.date_of_birth).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-lg p-4 mb-6">
                  <h5 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <CalendarDaysIcon className="w-4 h-4 text-teal-600 mr-2" />
                      What's Next?
                    </h5>
                  <p className="text-sm text-gray-700">
                      You can now book appointments for {addedPet.name} at veterinary clinics near you!
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        setShowSuccessModal(false);
                        setAddedPet(null);
                      }}
                      className="flex-1 px-4 py-3 border-2 border-stone-200 text-stone-700 rounded-xl hover:bg-stone-50 hover:border-stone-300 transition-all duration-200 font-medium"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        setShowSuccessModal(false);
                        setAddedPet(null);
                        handleTabChange('clinics');
                      }}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl hover:from-teal-700 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center space-x-2"
                    >
                      <CalendarDaysIcon className="w-4 h-4" />
                      <span>Book Appointment</span>
                    </button>
                  </div>
                </div>

                {/* Auto-close indicator */}
                <div className="px-6 pb-4">
                  <div className="w-full bg-stone-200 rounded-full h-1 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-[4000ms] ease-linear"
                      style={{ width: '100%', animation: 'shrink 4s linear forwards' }}
                    ></div>
                  </div>
                  <p className="text-xs text-stone-500 text-center mt-2">Auto-closing in 4 seconds...</p>
                </div>
              </div>
            </div>
          )}

          {/* Edit Pet Modal */}
          {showEditModal && selectedPet && (
            <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-6 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                        <PencilIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Edit {selectedPet.name}</h3>
                        <p className="text-amber-100 text-sm">Update your pet's information</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                    >
                      <XCircleIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleUpdatePet} className="p-6 space-y-6">
                  {/* Same form fields as Add Pet but pre-filled */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                    <label className="flex items-center text-sm font-semibold text-amber-600 mb-2">
                        <HeartIcon className="w-4 h-4 mr-2 text-amber-600" />
                        Pet Name
                      </label>
                      <input
                        type="text"
                        required
                        value={newPet.name}
                        onChange={(e) => setNewPet(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-amber-500 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white text-gray-900 placeholder:text-gray-500 font-medium"
                        placeholder="e.g., Buddy, Luna"
                      />
                    </div>
                    <div>
                    <label className="flex items-center text-sm font-semibold text-amber-600 mb-2">
                        <DocumentTextIcon className="w-4 h-4 mr-2 text-amber-600" />
                        Species
                      </label>
                      <select
                        required
                        value={newPet.species}
                        onChange={(e) => handleSpeciesChange(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-amber-500 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white text-gray-900 font-medium"
                    >
                      <option value="" className="text-gray-500">Select Species</option>
                      {availableSpecies.map(species => (
                        <option key={species} value={species} className="text-gray-900">
                          {species}
                        </option>
                      ))}
                      </select>
                      
                      {/* Custom Species Input - Only show when 'Others' is selected */}
                      {newPet.species === 'Others' && (
                        <div className="mt-3">
                          <label className="block text-sm font-semibold text-amber-600 mb-2">
                            Please specify the pet type *
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              required
                              value={newPet.customSpecies}
                              onChange={(e) => setNewPet(prev => ({ ...prev, customSpecies: e.target.value }))}
                              maxLength={50}
                              minLength={2}
                              className="flex-1 px-4 py-3 border-2 border-amber-500 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white focus:bg-white text-gray-900 placeholder:text-gray-500 font-medium"
                              placeholder="Enter your pet's type (e.g., Octopus, Ferret)"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleCustomSpeciesSubmit();
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={handleCustomSpeciesSubmit}
                              disabled={!newPet.customSpecies.trim()}
                              className="px-4 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                            >
                              Add
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            This will be saved and available for future selections
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Image Upload Section for Edit */}
                  <div className="space-y-4">
                  <label className="flex items-center text-sm font-semibold text-amber-600 mb-2">
                      <HeartIcon className="w-4 h-4 mr-2 text-amber-600" />
                      Pet Photo
                    </label>
                    
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-32 h-32 border-2 border-dashed border-stone-300 rounded-xl flex items-center justify-center bg-stone-50 overflow-hidden">
                        {imagePreview ? (
                          <img 
                            src={imagePreview} 
                            alt="Pet preview" 
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <div className="text-center">
                            <HeartIcon className="w-8 h-8 text-stone-400 mx-auto mb-1" />
                            <p className="text-xs text-stone-500">Upload photo</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                          id="edit-pet-image-upload"
                        />
                        <label
                          htmlFor="edit-pet-image-upload"
                          className="cursor-pointer bg-amber-100 hover:bg-amber-200 text-amber-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                        >
                          <PlusIcon className="w-4 h-4" />
                          <span>Change Photo</span>
                        </label>
                        
                        {imagePreview && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedImage(null);
                              setImagePreview(null);
                            }}
                            className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                          >
                            <XCircleIcon className="w-4 h-4" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-amber-600 mb-2">Breed</label>
                      {showBreedDropdown && availableBreeds.length > 0 ? (
                        <div className="space-y-3">
                          <select
                            value={newPet.breed}
                            onChange={(e) => handleBreedSelect(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-amber-500 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white focus:bg-white text-gray-900 font-medium"
                          >
                            <option value="" className="text-gray-500">Select Breed</option>
                            {availableBreeds.map(breed => (
                              <option key={breed} value={breed} className="text-gray-900">
                                {breed}
                              </option>
                            ))}
                          </select>
                          <div className="text-center">
                            <button
                              type="button"
                              onClick={() => setShowBreedDropdown(false)}
                              className="text-sm text-amber-600 hover:text-amber-700 underline"
                            >
                              Or type a custom breed
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={newPet.breed}
                            onChange={(e) => setNewPet(prev => ({ ...prev, breed: e.target.value }))}
                            className="w-full px-4 py-3 border-2 border-amber-500 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white text-gray-900 placeholder:text-gray-500 font-medium"
                            placeholder="e.g., Golden Retriever"
                          />
                          {newPet.species && hasPredefindedBreeds(newPet.species) && (
                            <div className="text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setAvailableBreeds(getBreedsForSpecies(newPet.species));
                                  setShowBreedDropdown(true);
                                  setNewPet(prev => ({ ...prev, breed: '' }));
                                }}
                                className="text-sm text-amber-600 hover:text-amber-700 underline"
                              >
                                Choose from {newPet.species} breeds
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                    <label className="block text-sm font-semibold text-amber-600 mb-2">Gender</label>
                      <select
                        value={newPet.gender}
                        onChange={(e) => setNewPet(prev => ({ ...prev, gender: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-amber-500 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white text-gray-900 font-medium"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                    <label className="block text-sm font-semibold text-amber-600 mb-2">Date of Birth</label>
                      <input
                        type="date"
                        value={newPet.date_of_birth}
                        onChange={(e) => setNewPet(prev => ({ ...prev, date_of_birth: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-amber-500 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white text-gray-900 font-medium"
                      />
                    </div>
                    <div>
                    <label className="block text-sm font-semibold text-amber-600 mb-2">Weight (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={newPet.weight}
                        onChange={(e) => setNewPet(prev => ({ ...prev, weight: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-amber-500 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 bg-white text-gray-900 placeholder:text-gray-500 font-medium"
                        placeholder="e.g., 5.2"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="flex-1 px-6 py-3 border-2 border-stone-200 text-stone-700 rounded-xl hover:bg-stone-50 hover:border-stone-300 transition-all duration-200 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Updating...</span>
                        </div>
                      ) : (
                        '✏️ Update Pet'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* View Pet Modal */}
          {showViewModal && selectedPet && (
            <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
                <div className="bg-gradient-to-r from-teal-500 to-blue-600 px-6 py-6 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                        <EyeIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{selectedPet.name}</h3>
                        <p className="text-teal-100 text-sm">Pet Profile Details</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowViewModal(false)}
                      className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                    >
                      <XCircleIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center overflow-hidden">
                      {selectedPet.profile_picture_url ? (
                        <img 
                          src={selectedPet.profile_picture_url} 
                          alt={selectedPet.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <HeartIcon className="w-10 h-10 text-teal-600" />
                      )}
                    </div>
                    <div>
                    <h4 className="text-xl font-bold text-gray-900">{selectedPet.name}</h4>
                    <p className="text-gray-600">{selectedPet.species}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-stone-50 rounded-lg p-3">
                        <span className="text-xs text-stone-500 uppercase tracking-wide">Breed</span>
                      <p className="font-semibold text-gray-900">{selectedPet.breed || 'Mixed'}</p>
                      </div>
                      <div className="bg-stone-50 rounded-lg p-3">
                        <span className="text-xs text-stone-500 uppercase tracking-wide">Gender</span>
                      <p className="font-semibold text-gray-900 capitalize">{selectedPet.gender || 'Unknown'}</p>
                      </div>
                      <div className="bg-stone-50 rounded-lg p-3">
                        <span className="text-xs text-stone-500 uppercase tracking-wide">Weight</span>
                      <p className="font-semibold text-gray-900">{selectedPet.weight ? `${selectedPet.weight} kg` : 'Not recorded'}</p>
                      </div>
                      <div className="bg-stone-50 rounded-lg p-3">
                        <span className="text-xs text-stone-500 uppercase tracking-wide">Age</span>
                      <p className="font-semibold text-gray-900">
                          {selectedPet.date_of_birth 
                            ? `${new Date().getFullYear() - new Date(selectedPet.date_of_birth).getFullYear()} years`
                            : 'Unknown'
                          }
                        </p>
                      </div>
                    </div>

                    {selectedPet.date_of_birth && (
                      <div className="bg-stone-50 rounded-lg p-3">
                        <span className="text-xs text-stone-500 uppercase tracking-wide">Date of Birth</span>
                      <p className="font-semibold text-gray-900">
                          {new Date(selectedPet.date_of_birth).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    <div className="bg-stone-50 rounded-lg p-3">
                      <span className="text-xs text-stone-500 uppercase tracking-wide">Member Since</span>
                    <p className="font-semibold text-gray-900">
                        {new Date(selectedPet.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <button
                      onClick={() => setShowViewModal(false)}
                      className="flex-1 px-4 py-3 border-2 border-stone-200 text-stone-700 rounded-xl hover:bg-stone-50 hover:border-stone-300 transition-all duration-200 font-medium"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        handleEditPet(selectedPet);
                      }}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-xl hover:from-teal-700 hover:to-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center space-x-2"
                    >
                      <PencilIcon className="w-4 h-4" />
                      <span>Edit Pet</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteModal && selectedPet && (
            <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
                <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-6 rounded-t-2xl">
                  <div className="flex items-center space-x-3">
                    <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                      <XCircleIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Remove Pet</h3>
                      <p className="text-red-100 text-sm">This action cannot be undone</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center overflow-hidden">
                      {selectedPet.profile_picture_url ? (
                        <img 
                          src={selectedPet.profile_picture_url} 
                          alt={selectedPet.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <HeartIcon className="w-8 h-8 text-red-600" />
                      )}
                    </div>
                    <div>
                    <h4 className="text-lg font-bold text-gray-900">{selectedPet.name}</h4>
                    <p className="text-gray-600">{selectedPet.species}</p>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-red-800 text-sm">
                      Are you sure you want to remove <strong>{selectedPet.name}</strong> from your pets? 
                      This will also remove all associated appointment history.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="flex-1 px-4 py-3 border-2 border-stone-200 text-stone-700 rounded-xl hover:bg-stone-50 hover:border-stone-300 transition-all duration-200 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDeletePet}
                      disabled={actionLoading}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      {actionLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Removing...</span>
                        </div>
                      ) : (
                        <>
                          <XCircleIcon className="w-4 h-4" />
                          <span>Remove Pet</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Profile Edit Modal */}
          {showProfileModal && (
            <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="bg-gradient-to-r from-[#0032A0] to-[#0053d6] px-6 py-6 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                        <UserCircleIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Edit Profile</h3>
                        <p className="text-blue-100 text-sm">Update your personal information</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowProfileModal(false)}
                      className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                    >
                      <XCircleIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="p-6 space-y-6">
                  {/* Profile Image Upload */}
                  <div className="space-y-4">
                    <label className="flex items-center text-sm font-semibold text-gray-800 mb-2">
                      <UserCircleIcon className="w-4 h-4 mr-2 text-[#0032A0]" />
                      Profile Photo
                    </label>
                    
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden">
                        {profileImagePreview ? (
                          <img 
                            src={profileImagePreview} 
                            alt="Profile preview" 
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <div className="text-center">
                            <UserCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-1" />
                            <p className="text-xs text-gray-500">Upload photo</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfileImageSelect}
                          className="hidden"
                          id="profile-image-upload"
                        />
                        <label
                          htmlFor="profile-image-upload"
                          className="cursor-pointer bg-[#0032A0]/10 hover:bg-[#0032A0]/20 text-[#0032A0] px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                        >
                          <PlusIcon className="w-4 h-4" />
                          <span>Choose Photo</span>
                        </label>
                        
                        {(croppedImageBlob || profileImagePreview) && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProfileImage(null);
                              setProfileImagePreview(null);
                              setCroppedImageBlob(null);
                              setImageForCropping(null);
                            }}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                          >
                            <XCircleIcon className="w-4 h-4" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>
                      
                      {uploadingProfileImage && (
                        <div className="flex items-center space-x-2 text-sm text-[#0032A0]">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0032A0]"></div>
                          <span>Uploading image...</span>
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500 text-center max-w-xs">
                        Supported formats: JPG, PNG, GIF. Max size: 5MB
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center text-sm font-semibold text-gray-800 mb-2">
                        <UserCircleIcon className="w-4 h-4 mr-2 text-[#0032A0]" />
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={profileForm.full_name}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0032A0] focus:border-[#0032A0] transition-all duration-200 bg-white text-gray-900 placeholder:text-gray-500 font-medium"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="flex items-center text-sm font-semibold text-gray-800 mb-2">
                        <PhoneIcon className="w-4 h-4 mr-2 text-[#0032A0]" />
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0032A0] focus:border-[#0032A0] transition-all duration-200 bg-white text-gray-900 placeholder:text-gray-500 font-medium"
                        placeholder="+63 912 345 6789"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center text-sm font-semibold text-gray-800 mb-2">
                      <MapPinIcon className="w-4 h-4 mr-2 text-[#0032A0]" />
                      Address
                    </label>
                    <textarea
                      value={profileForm.address}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0032A0] focus:border-[#0032A0] transition-all duration-200 bg-white text-gray-900 placeholder:text-gray-500 font-medium resize-none"
                      placeholder="Enter your complete address"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center text-sm font-semibold text-gray-800 mb-2">
                        <UserCircleIcon className="w-4 h-4 mr-2 text-[#0032A0]" />
                        Emergency Contact Name
                      </label>
                      <input
                        type="text"
                        value={profileForm.emergency_contact_name}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0032A0] focus:border-[#0032A0] transition-all duration-200 bg-white text-gray-900 placeholder:text-gray-500 font-medium"
                        placeholder="Emergency contact person"
                      />
                    </div>
                    <div>
                      <label className="flex items-center text-sm font-semibold text-gray-800 mb-2">
                        <PhoneIcon className="w-4 h-4 mr-2 text-[#0032A0]" />
                        Emergency Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={profileForm.emergency_contact_phone}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0032A0] focus:border-[#0032A0] transition-all duration-200 bg-white text-gray-900 placeholder:text-gray-500 font-medium"
                        placeholder="+63 912 345 6789"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowProfileModal(false)}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-[#0032A0] to-[#0053d6] text-white rounded-xl hover:from-[#0053d6] hover:to-[#0032A0] transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50"
                    >
                      {profileLoading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Updating...</span>
                        </div>
                      ) : (
                        '💾 Update Profile'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Action Success Modal */}
          {actionSuccess.type && (
            <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform transition-all duration-300 animate-in zoom-in">
                <div className={`px-6 py-6 rounded-t-2xl text-center ${
                  actionSuccess.type === 'edit' 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600'
                    : actionSuccess.type === 'delete'
                      ? 'bg-gradient-to-r from-red-500 to-red-600'
                      : 'bg-gradient-to-r from-teal-500 to-blue-600'
                }`}>
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    {actionSuccess.type === 'edit' && <PencilIcon className="w-10 h-10 text-white" />}
                    {actionSuccess.type === 'delete' && <CheckCircleIcon className="w-10 h-10 text-white" />}
                    {actionSuccess.type === 'view' && <EyeIcon className="w-10 h-10 text-white" />}
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    {actionSuccess.type === 'edit' && actionSuccess.pet ? 'Pet Updated! ✏️' : 'Profile Updated! ✏️'}
                    {actionSuccess.type === 'delete' && 'Pet Removed! 🗑️'}
                    {actionSuccess.type === 'view' && 'Pet Details! 👁️'}
                  </h3>
                  <p className="text-white text-opacity-90 text-sm mt-1">
                    {actionSuccess.message}
                  </p>
                </div>

                <div className="p-6">
                  {actionSuccess.pet && (
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center overflow-hidden">
                        {actionSuccess.pet.profile_picture_url ? (
                          <img 
                            src={actionSuccess.pet.profile_picture_url} 
                            alt={actionSuccess.pet.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <HeartIcon className="w-8 h-8 text-stone-600" />
                        )}
                      </div>
                      <div>
                      <h4 className="text-lg font-bold text-gray-900">{actionSuccess.pet.name}</h4>
                      <p className="text-gray-600">{actionSuccess.pet.species}</p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setActionSuccess({ type: null, message: '', pet: null })}
                    className="w-full px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-all duration-200 font-medium"
                  >
                    Close
                  </button>
                </div>

                <div className="px-6 pb-4">
                  <div className="w-full bg-stone-200 rounded-full h-1 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-stone-400 to-stone-500 rounded-full transition-all duration-[4000ms] ease-linear"
                      style={{ width: '100%', animation: 'shrink 4s linear forwards' }}
                    ></div>
                  </div>
                  <p className="text-xs text-stone-500 text-center mt-2">Auto-closing in 4 seconds...</p>
                </div>
              </div>
            </div>
          )}

          <style jsx>{`
            @keyframes shrink {
              from { width: 100%; }
              to { width: 0%; }
            }
          `}</style>

          {/* Test Modal */}
          {testAppointmentId && (
            <TestModal
              isOpen={isTestModalOpen}
              onClose={handleCloseTestModal}
              appointmentId={testAppointmentId}
            />
          )}

          {/* Appointment Details Modal */}
          {detailsAppointmentId && (
            <AppointmentDetailsModal
              isOpen={isDetailsModalOpen}
              onClose={handleCloseDetailsModal}
              appointmentId={detailsAppointmentId}
              onAppointmentUpdate={handleAppointmentUpdate}
            />
          )}

          {/* Review Submission Modal */}
          {selectedAppointmentForReview && (
            <ReviewSubmissionModal
              isOpen={showReviewModal}
              onClose={() => {
                setShowReviewModal(false);
                setSelectedAppointmentForReview(null);
              }}
              appointment={selectedAppointmentForReview}
              onReviewSubmitted={handleReviewSubmitted}
            />
          )}

          {/* Image Crop Modal */}
          {showCropModal && imageForCropping && (
            <ImageCrop
              src={imageForCropping}
              onCropComplete={handleCropComplete}
              onCancel={handleCropCancel}
              aspect={1}
              circularCrop={true}
              minWidth={150}
              minHeight={150}
            />
          )}

        </div>
    </ProtectedRoute>
  );
}
