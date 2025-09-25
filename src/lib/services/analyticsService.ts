import { createClient } from '@supabase/supabase-js';

// Use service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear,
  subMonths,
  eachMonthOfInterval,
  parseISO,
  differenceInDays
} from 'date-fns';

export interface AnalyticsFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  clinicIds?: number[];
  veterinarianIds?: number[];
  petOwnerIds?: number[];
  appointmentStatus?: string[];
  petSpecies?: string[];
}

export class AnalyticsService {
  
  /**
   * Get system overview metrics
   */
  async getSystemOverview(filters?: AnalyticsFilters) {
    try {
      // Get current date range
      const currentDate = new Date();
      const startOfCurrentMonth = startOfMonth(currentDate);
      const endOfCurrentMonth = endOfMonth(currentDate);

      // Fetch all required data in parallel
      const [
        usersResult,
        petsResult,
        appointmentsResult,
        clinicsResult,
        applicationsResult,
        revenueResult,
        monthlyRevenueResult
      ] = await Promise.all([
        this.getUserCounts(),
        this.getPetCounts(),
        this.getAppointmentCounts(filters),
        this.getClinicCounts(),
        this.getApplicationCounts(),
        this.getTotalRevenue(filters),
        this.getMonthlyRevenue(startOfCurrentMonth, endOfCurrentMonth, filters)
      ]);

      return {
        totalUsers: usersResult.total || 0,
        totalPetOwners: usersResult.petOwners || 0,
        totalVeterinarians: usersResult.veterinarians || 0,
        totalPets: petsResult.total || 0,
        totalAppointments: appointmentsResult.total || 0,
        totalClinics: clinicsResult.total || 0,
        pendingApplications: applicationsResult.pending || 0,
        activeAppointments: appointmentsResult.active || 0,
        completedAppointments: appointmentsResult.completed || 0,
        totalRevenue: revenueResult.total || 0,
        monthlyRevenue: monthlyRevenueResult.total || 0,
        averageAppointmentValue: appointmentsResult.total > 0 
          ? (revenueResult.total || 0) / appointmentsResult.total 
          : 0
      };
    } catch (error) {
      console.error('Error fetching system overview:', error);
      throw new Error('Failed to fetch system overview data');
    }
  }

  /**
   * Get appointment analytics
   */
  async getAppointmentAnalytics(filters?: AnalyticsFilters) {
    try {
      let query = supabase.from('appointments').select('*');
      
      // Apply filters
      if (filters?.dateRange) {
        query = query.gte('appointment_date', filters.dateRange.start)
                    .lte('appointment_date', filters.dateRange.end);
      }
      
      if (filters?.veterinarianIds?.length) {
        query = query.in('veterinarian_id', filters.veterinarianIds);
      }
      
      if (filters?.appointmentStatus?.length) {
        query = query.in('status', filters.appointmentStatus);
      }

      const { data: appointments, error } = await query;
      
      if (error) throw error;

      // Process appointment data
      const statusCounts = this.countByField(appointments || [], 'status');
      const bookingTypeCounts = this.countByField(appointments || [], 'booking_type');
      const monthlyData = this.groupByMonth(appointments || [], 'created_at');
      const reasonCounts = this.countByField(appointments || [], 'reason_for_visit');
      
      const totalAppointments = appointments?.length || 0;
      const completedAppointments = appointments?.filter(a => a.status === 'confirmed')?.length || 0;
      const cancelledAppointments = appointments?.filter(a => a.status === 'cancelled')?.length || 0;
      const pendingAppointments = appointments?.filter(a => a.status === 'pending')?.length || 0;
      const confirmedAppointments = appointments?.filter(a => a.status === 'confirmed')?.length || 0;
      
      // Calculate average duration
      const durations = appointments?.filter(a => a.estimated_duration).map(a => a.estimated_duration) || [];
      const averageDuration = durations.length > 0 
        ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length 
        : 0;

      return {
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        pendingAppointments,
        confirmedAppointments,
        appointmentsByMonth: monthlyData,
        appointmentsByStatus: statusCounts,
        appointmentsByBookingType: bookingTypeCounts,
        averageDuration,
        popularReasons: reasonCounts.slice(0, 10) // Top 10 reasons
      };
    } catch (error) {
      console.error('Error fetching appointment analytics:', error);
      throw new Error('Failed to fetch appointment analytics');
    }
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(filters?: AnalyticsFilters) {
    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) throw error;

      const totalUsers = users?.length || 0;
      const roleCounts = this.countByField(users || [], 'user_role');
      const monthlyData = this.groupByMonth(users || [], 'created_at');
      
      // Calculate growth metrics
      const currentMonth = new Date();
      const lastMonth = subMonths(currentMonth, 1);
      
      const newUsersThisMonth = users?.filter(user => {
        const userDate = parseISO(user.created_at);
        return userDate >= startOfMonth(currentMonth);
      })?.length || 0;
      
      const usersLastMonth = users?.filter(user => {
        const userDate = parseISO(user.created_at);
        return userDate >= startOfMonth(lastMonth) && userDate < startOfMonth(currentMonth);
      })?.length || 0;
      
      const userGrowthRate = usersLastMonth > 0 
        ? ((newUsersThisMonth - usersLastMonth) / usersLastMonth) * 100 
        : 0;

      return {
        totalUsers,
        usersByRole: roleCounts,
        usersByMonth: monthlyData,
        activeUsers: users?.filter(u => u.is_active)?.length || 0,
        newUsersThisMonth,
        userGrowthRate,
        retentionRate: 85.2 // This would need more complex calculation with login data
      };
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      throw new Error('Failed to fetch user analytics');
    }
  }

  /**
   * Get pet analytics
   */
  async getPetAnalytics(filters?: AnalyticsFilters) {
    try {
      let query = supabase.from('patients').select('*');
      
      if (filters?.petSpecies?.length) {
        query = query.in('species', filters.petSpecies);
      }

      const { data: pets, error } = await query;
      
      if (error) throw error;

      const totalPets = pets?.length || 0;
      const activePets = pets?.filter(p => p.is_active)?.length || 0;
      const speciesCounts = this.countByField(pets || [], 'species');
      const monthlyData = this.groupByMonth(pets || [], 'created_at');
      const breedCounts = this.countByField(pets || [], 'breed');
      
      // Calculate age distribution
      const ageDistribution = this.calculateAgeDistribution(pets || []);
      
      // Get pet owner count to calculate average
      const { data: owners } = await supabase
        .from('pet_owner_profiles')
        .select('id');
      
      const averagePetsPerOwner = owners?.length ? totalPets / owners.length : 0;

      return {
        totalPets,
        activePets,
        petsBySpecies: speciesCounts,
        petsByMonth: monthlyData,
        averagePetsPerOwner,
        popularBreeds: breedCounts.slice(0, 10),
        petAgeDistribution: ageDistribution
      };
    } catch (error) {
      console.error('Error fetching pet analytics:', error);
      throw new Error('Failed to fetch pet analytics');
    }
  }

  /**
   * Get financial analytics
   */
  async getFinancialAnalytics(filters?: AnalyticsFilters) {
    try {
      let query = supabase.from('appointments').select('total_amount, payment_status, created_at, veterinarian_id');
      
      if (filters?.dateRange) {
        query = query.gte('appointment_date', filters.dateRange.start)
                    .lte('appointment_date', filters.dateRange.end);
      }

      const { data: appointments, error } = await query;
      
      if (error) throw error;

      const validAppointments = appointments?.filter(a => a.total_amount && a.total_amount > 0) || [];
      
      const totalRevenue = validAppointments.reduce((sum, apt) => sum + parseFloat(apt.total_amount), 0);
      
      // Calculate monthly and yearly revenue
      const currentDate = new Date();
      const monthlyRevenue = validAppointments
        .filter(apt => {
          const aptDate = parseISO(apt.created_at);
          return aptDate >= startOfMonth(currentDate) && aptDate <= endOfMonth(currentDate);
        })
        .reduce((sum, apt) => sum + parseFloat(apt.total_amount), 0);
      
      const yearlyRevenue = validAppointments
        .filter(apt => {
          const aptDate = parseISO(apt.created_at);
          return aptDate >= startOfYear(currentDate) && aptDate <= endOfYear(currentDate);
        })
        .reduce((sum, apt) => sum + parseFloat(apt.total_amount), 0);

      const revenueByMonth = this.groupRevenueByMonth(validAppointments);
      const paymentStatusCounts = this.countByField(appointments || [], 'payment_status');
      const averageAppointmentValue = validAppointments.length > 0 
        ? totalRevenue / validAppointments.length 
        : 0;

      // Get veterinarian revenue data
      const topEarningVeterinarians = await this.getVeterinarianRevenue(validAppointments);

      return {
        totalRevenue,
        monthlyRevenue,
        yearlyRevenue,
        revenueByMonth,
        revenueByPaymentStatus: paymentStatusCounts,
        averageAppointmentValue,
        topEarningVeterinarians,
        revenueGrowthRate: 12.5 // This would need historical comparison
      };
    } catch (error) {
      console.error('Error fetching financial analytics:', error);
      throw new Error('Failed to fetch financial analytics');
    }
  }

  /**
   * Get veterinarian analytics
   */
  async getVeterinarianAnalytics(filters?: AnalyticsFilters) {
    try {
      const { data: veterinarians, error } = await supabase
        .from('veterinarians')
        .select('*');
      
      if (error) throw error;

      const totalVeterinarians = veterinarians?.length || 0;
      const availableVeterinarians = veterinarians?.filter(v => v.is_available)?.length || 0;
      const specializationCounts = this.countVeterinariansBySpecialization(veterinarians || []);
      
      // Calculate consultation fee stats
      const fees = veterinarians?.map(v => parseFloat(v.consultation_fee || 0)).filter(fee => fee > 0) || [];
      const feeRange = this.calculateRangeStats(fees);
      
      const averageRating = veterinarians?.length > 0 
        ? veterinarians.reduce((sum, vet) => sum + (vet.average_rating || 0), 0) / veterinarians.length 
        : 0;

      // Get workload distribution
      const workloadDistribution = await this.getVeterinarianWorkload(veterinarians || []);

      return {
        totalVeterinarians,
        availableVeterinarians,
        veterinariansBySpecialization: specializationCounts,
        averageRating,
        totalConsultationsFeeRange: feeRange,
        workloadDistribution
      };
    } catch (error) {
      console.error('Error fetching veterinarian analytics:', error);
      throw new Error('Failed to fetch veterinarian analytics');
    }
  }

  /**
   * Get clinic analytics
   */
  async getClinicAnalytics(filters?: AnalyticsFilters) {
    try {
      const { data: clinics, error } = await supabase
        .from('clinics')
        .select('*');
      
      if (error) throw error;

      const totalClinics = clinics?.length || 0;
      const activeClinics = clinics?.filter(c => c.is_active)?.length || 0;
      const clinicsWithEmergency = clinics?.filter(c => c.is_emergency_available)?.length || 0;

      // Get appointment data per clinic
      const appointmentsPerClinic = await this.getAppointmentsPerClinic(clinics || []);
      const clinicUtilization = await this.getClinicUtilization(clinics || []);

      return {
        totalClinics,
        activeClinics,
        clinicsWithEmergency,
        appointmentsPerClinic,
        clinicUtilization
      };
    } catch (error) {
      console.error('Error fetching clinic analytics:', error);
      throw new Error('Failed to fetch clinic analytics');
    }
  }

  /**
   * Get application analytics
   */
  async getApplicationAnalytics(filters?: AnalyticsFilters) {
    try {
      const { data: applications, error } = await supabase
        .from('veterinarian_applications')
        .select('*');
      
      if (error) throw error;

      const pendingApplications = applications?.filter(a => a.status === 'pending')?.length || 0;
      const approvedApplications = applications?.filter(a => a.status === 'approved')?.length || 0;
      const rejectedApplications = applications?.filter(a => a.status === 'rejected')?.length || 0;
      
      const applicationsByMonth = this.groupByMonth(applications || [], 'created_at');
      const statusCounts = this.countByField(applications || [], 'status');
      
      // Calculate average processing time
      const processedApplications = applications?.filter(a => a.reviewed_at) || [];
      const averageProcessingTime = processedApplications.length > 0
        ? processedApplications.reduce((sum, app) => {
            const created = parseISO(app.created_at);
            const reviewed = parseISO(app.reviewed_at);
            return sum + differenceInDays(reviewed, created);
          }, 0) / processedApplications.length
        : 0;

      return {
        pendingApplications,
        approvedApplications,
        rejectedApplications,
        applicationsByMonth,
        averageProcessingTime,
        applicationsByStatus: statusCounts
      };
    } catch (error) {
      console.error('Error fetching application analytics:', error);
      throw new Error('Failed to fetch application analytics');
    }
  }

  // Private helper methods
  private async getUserCounts() {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('user_role');
    
    if (error) throw error;

    const total = users?.length || 0;
    const petOwners = users?.filter(u => u.user_role === 'pet_owner')?.length || 0;
    const veterinarians = users?.filter(u => u.user_role === 'veterinarian')?.length || 0;

    return { total, petOwners, veterinarians };
  }

  private async getPetCounts() {
    const { data: pets, error } = await supabase
      .from('patients')
      .select('id, is_active');
    
    if (error) throw error;

    return {
      total: pets?.length || 0,
      active: pets?.filter(p => p.is_active)?.length || 0
    };
  }

  private async getAppointmentCounts(filters?: AnalyticsFilters) {
    let query = supabase.from('appointments').select('id, status');
    
    if (filters?.dateRange) {
      query = query.gte('appointment_date', filters.dateRange.start)
                  .lte('appointment_date', filters.dateRange.end);
    }

    const { data: appointments, error } = await query;
    
    if (error) throw error;

    return {
      total: appointments?.length || 0,
      active: appointments?.filter(a => a.status === 'confirmed' || a.status === 'pending')?.length || 0,
      completed: appointments?.filter(a => a.status === 'confirmed')?.length || 0
    };
  }

  private async getClinicCounts() {
    const { data: clinics, error } = await supabase
      .from('clinics')
      .select('id');
    
    if (error) throw error;

    return { total: clinics?.length || 0 };
  }

  private async getApplicationCounts() {
    const { data: applications, error } = await supabase
      .from('veterinarian_applications')
      .select('status');
    
    if (error) throw error;

    return {
      pending: applications?.filter(a => a.status === 'pending')?.length || 0
    };
  }

  private async getTotalRevenue(filters?: AnalyticsFilters) {
    let query = supabase.from('appointments').select('total_amount');
    
    if (filters?.dateRange) {
      query = query.gte('appointment_date', filters.dateRange.start)
                  .lte('appointment_date', filters.dateRange.end);
    }

    const { data: appointments, error } = await query;
    
    if (error) throw error;

    const total = appointments
      ?.filter(a => a.total_amount)
      ?.reduce((sum, a) => sum + parseFloat(a.total_amount), 0) || 0;

    return { total };
  }

  private async getMonthlyRevenue(start: Date, end: Date, filters?: AnalyticsFilters) {
    let query = supabase.from('appointments')
      .select('total_amount')
      .gte('appointment_date', format(start, 'yyyy-MM-dd'))
      .lte('appointment_date', format(end, 'yyyy-MM-dd'));

    const { data: appointments, error } = await query;
    
    if (error) throw error;

    const total = appointments
      ?.filter(a => a.total_amount)
      ?.reduce((sum, a) => sum + parseFloat(a.total_amount), 0) || 0;

    return { total };
  }

  private countByField(data: any[], field: string) {
    const counts = data.reduce((acc, item) => {
      const value = item[field] || 'Unknown';
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = data.length;
    
    return Object.entries(counts)
      .map(([status, count]) => ({
        status,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  }

  private groupByMonth(data: any[], dateField: string) {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 11),
      end: new Date()
    });

    return months.map(month => {
      const monthStr = format(month, 'yyyy-MM');
      const count = data.filter(item => {
        const itemDate = parseISO(item[dateField]);
        return format(itemDate, 'yyyy-MM') === monthStr;
      }).length;

      return {
        date: format(month, 'yyyy-MM-dd'),
        value: count,
        count,
        label: format(month, 'MMM yyyy')
      };
    });
  }

  private groupRevenueByMonth(appointments: any[]) {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 11),
      end: new Date()
    });

    return months.map(month => {
      const monthStr = format(month, 'yyyy-MM');
      const revenue = appointments
        .filter(apt => {
          const aptDate = parseISO(apt.created_at);
          return format(aptDate, 'yyyy-MM') === monthStr;
        })
        .reduce((sum, apt) => sum + parseFloat(apt.total_amount), 0);

      return {
        date: format(month, 'yyyy-MM-dd'),
        value: revenue,
        count: appointments.filter(apt => {
          const aptDate = parseISO(apt.created_at);
          return format(aptDate, 'yyyy-MM') === monthStr;
        }).length,
        label: format(month, 'MMM yyyy')
      };
    });
  }

  private calculateAgeDistribution(pets: any[]) {
    const now = new Date();
    const ageRanges = [
      { range: '0-1 years', min: 0, max: 1 },
      { range: '1-3 years', min: 1, max: 3 },
      { range: '3-7 years', min: 3, max: 7 },
      { range: '7+ years', min: 7, max: 100 }
    ];

    return ageRanges.map(range => {
      const count = pets.filter(pet => {
        if (!pet.date_of_birth) return false;
        const birthDate = parseISO(pet.date_of_birth);
        const ageInYears = (now.getTime() - birthDate.getTime()) / (365 * 24 * 60 * 60 * 1000);
        return ageInYears >= range.min && ageInYears < range.max;
      }).length;

      return { range: range.range, count };
    });
  }

  private async getVeterinarianRevenue(appointments: any[]) {
    const { data: veterinarians } = await supabase
      .from('veterinarians')
      .select('id, full_name, specialization');

    if (!veterinarians) return [];

    return veterinarians.map(vet => {
      const vetAppointments = appointments.filter(apt => apt.veterinarian_id === vet.id);
      const totalRevenue = vetAppointments.reduce((sum, apt) => sum + parseFloat(apt.total_amount), 0);
      
      return {
        id: vet.id,
        name: vet.full_name,
        specialization: vet.specialization || 'General',
        totalRevenue,
        appointmentCount: vetAppointments.length,
        averageAppointmentValue: vetAppointments.length > 0 ? totalRevenue / vetAppointments.length : 0
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  private countVeterinariansBySpecialization(veterinarians: any[]) {
    const specializationData = veterinarians.reduce((acc, vet) => {
      const spec = vet.specialization || 'General';
      if (!acc[spec]) {
        acc[spec] = {
          count: 0,
          totalExperience: 0,
          totalFee: 0,
          feeCount: 0
        };
      }
      
      acc[spec].count++;
      acc[spec].totalExperience += vet.years_experience || 0;
      
      if (vet.consultation_fee) {
        acc[spec].totalFee += parseFloat(vet.consultation_fee);
        acc[spec].feeCount++;
      }
      
      return acc;
    }, {} as Record<string, any>);

    return Object.entries(specializationData).map(([specialization, data]) => ({
      specialization,
      count: data.count,
      averageExperience: data.count > 0 ? data.totalExperience / data.count : 0,
      averageFee: data.feeCount > 0 ? data.totalFee / data.feeCount : 0
    }));
  }

  private calculateRangeStats(values: number[]) {
    if (values.length === 0) {
      return { min: 0, max: 0, average: 0, median: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    return { min, max, average, median };
  }

  private async getVeterinarianWorkload(veterinarians: any[]) {
    const { data: appointments } = await supabase
      .from('appointments')
      .select('veterinarian_id, status');

    if (!appointments) return [];

    return veterinarians.map(vet => {
      const vetAppointments = appointments.filter(apt => apt.veterinarian_id === vet.id);
      const completedAppointments = vetAppointments.filter(apt => apt.status === 'confirmed');
      const completionRate = vetAppointments.length > 0 
        ? (completedAppointments.length / vetAppointments.length) * 100 
        : 0;

      return {
        id: vet.id,
        name: vet.full_name,
        appointmentCount: vetAppointments.length,
        completionRate,
        averageRating: vet.average_rating || 0
      };
    }).sort((a, b) => b.appointmentCount - a.appointmentCount);
  }

  private async getAppointmentsPerClinic(clinics: any[]) {
    const { data: appointments } = await supabase
      .from('appointments')
      .select('clinic_id, total_amount');

    if (!appointments) return [];

    return clinics.map(clinic => {
      const clinicAppointments = appointments.filter(apt => apt.clinic_id === clinic.id);
      const revenue = clinicAppointments
        .filter(apt => apt.total_amount)
        .reduce((sum, apt) => sum + parseFloat(apt.total_amount), 0);

      return {
        id: clinic.id,
        name: clinic.name,
        appointmentCount: clinicAppointments.length,
        revenue
      };
    }).sort((a, b) => b.appointmentCount - a.appointmentCount);
  }

  private async getClinicUtilization(clinics: any[]) {
    // This is a simplified calculation - in a real system you'd have more complex utilization metrics
    return clinics.map(clinic => ({
      id: clinic.id,
      name: clinic.name,
      utilizationRate: Math.random() * 100, // This would be calculated based on capacity vs appointments
      averageWaitTime: Math.random() * 30 // This would be calculated from actual wait time data
    }));
  }
}

export const analyticsService = new AnalyticsService();