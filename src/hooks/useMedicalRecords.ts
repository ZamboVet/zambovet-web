import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface MedicalRecord {
  patient: {
    id: number;
    name: string;
    species: string;
    breed?: string;
    gender?: string;
    date_of_birth?: string;
    weight?: number;
    medical_conditions?: string[];
    vaccination_records?: any[];
    age?: {
      years: number;
      months: number;
      formatted: string;
    };
  };
  owner: {
    full_name: string;
    phone?: string;
    address?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
  };
  appointments: any[];
  reviews: any[];
  emergencyRequests: any[];
  statistics: {
    totalAppointments: number;
    completedAppointments: number;
    pendingAppointments: number;
    cancelledAppointments: number;
    averageRating: string | null;
    totalReviews: number;
    emergencyRequestsCount: number;
    lastAppointmentDate: string | null;
    nextAppointmentDate: string | null;
  };
  medicalHistory: {
    conditions: string[];
    vaccinations: any[];
    lastUpdated: string;
  };
}

interface UseMedicalRecordsOptions {
  enableRealtime?: boolean;
  autoRefetch?: boolean;
  refetchInterval?: number;
}

interface UseMedicalRecordsReturn {
  medicalRecord: MedicalRecord | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  refresh: () => Promise<void>;
  isRefreshing: boolean;
  lastUpdated: Date | null;
}

export function useMedicalRecords(
  patientId: string | null,
  options: UseMedicalRecordsOptions = {}
): UseMedicalRecordsReturn {
  const {
    enableRealtime = true,
    autoRefetch = false,
    refetchInterval = 60000 // 1 minute
  } = options;

  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMedicalRecords = useCallback(async (isRefresh = false) => {
    if (!patientId) {
      setMedicalRecord(null);
      setError(null);
      return;
    }

    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      
      setError(null);

      const response = await fetch(`/api/patients/${patientId}/medical-records`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        // Add cache busting for real-time updates
        cache: 'no-cache'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch medical records');
      }

      setMedicalRecord(result.data);
      setLastUpdated(new Date());
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load medical records';
      setError(errorMessage);
      console.error('Error fetching medical records:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [patientId]);

  // Initial fetch
  useEffect(() => {
    if (patientId) {
      fetchMedicalRecords();
    }
  }, [fetchMedicalRecords, patientId]);

  // Auto-refetch interval
  useEffect(() => {
    if (!autoRefetch || !patientId || refetchInterval <= 0) return;

    const interval = setInterval(() => {
      fetchMedicalRecords(true);
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [autoRefetch, patientId, refetchInterval, fetchMedicalRecords]);

  // Real-time subscriptions
  useEffect(() => {
    if (!enableRealtime || !patientId) return;

    console.log('Setting up real-time subscriptions for patient:', patientId);

    // Subscribe to appointment changes
    const appointmentSubscription = supabase
      .channel(`appointments_${patientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `pet_id=eq.${patientId}`
        },
        (payload) => {
          console.log('Appointment data changed:', payload);
          fetchMedicalRecords(true);
        }
      )
      .subscribe();

    // Subscribe to patient changes
    const patientSubscription = supabase
      .channel(`patient_${patientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patients',
          filter: `id=eq.${patientId}`
        },
        (payload) => {
          console.log('Patient data changed:', payload);
          fetchMedicalRecords(true);
        }
      )
      .subscribe();

    // Subscribe to review changes
    const reviewSubscription = supabase
      .channel(`reviews_${patientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reviews',
          filter: `pet_id=eq.${patientId}`
        },
        (payload) => {
          console.log('Review data changed:', payload);
          fetchMedicalRecords(true);
        }
      )
      .subscribe();

    // Subscribe to emergency request changes
    const emergencySubscription = supabase
      .channel(`emergency_${patientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emergency_requests',
          filter: `pet_id=eq.${patientId}`
        },
        (payload) => {
          console.log('Emergency request data changed:', payload);
          fetchMedicalRecords(true);
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      console.log('Cleaning up real-time subscriptions for patient:', patientId);
      appointmentSubscription.unsubscribe();
      patientSubscription.unsubscribe();
      reviewSubscription.unsubscribe();
      emergencySubscription.unsubscribe();
    };
  }, [enableRealtime, patientId, fetchMedicalRecords]);

  const refetch = useCallback(() => fetchMedicalRecords(), [fetchMedicalRecords]);
  const refresh = useCallback(() => fetchMedicalRecords(true), [fetchMedicalRecords]);

  return {
    medicalRecord,
    loading,
    error,
    refetch,
    refresh,
    isRefreshing,
    lastUpdated
  };
}

export default useMedicalRecords;
