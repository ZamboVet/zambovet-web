import { gql } from 'graphql-tag';

export const typeDefs = gql`
  # Scalar types
  scalar Date
  scalar JSON

  # Analytics Overview Types
  type SystemOverview {
    totalUsers: Int!
    totalPetOwners: Int!
    totalVeterinarians: Int!
    totalPets: Int!
    totalAppointments: Int!
    totalClinics: Int!
    pendingApplications: Int!
    activeAppointments: Int!
    completedAppointments: Int!
    totalRevenue: Float!
    monthlyRevenue: Float!
    averageAppointmentValue: Float!
  }

  # Time Series Data
  type TimeSeriesPoint {
    date: Date!
    value: Float!
    count: Int
    label: String
  }

  # Appointment Analytics
  type AppointmentAnalytics {
    totalAppointments: Int!
    completedAppointments: Int!
    cancelledAppointments: Int!
    pendingAppointments: Int!
    confirmedAppointments: Int!
    appointmentsByMonth: [TimeSeriesPoint!]!
    appointmentsByStatus: [StatusCount!]!
    appointmentsByBookingType: [StatusCount!]!
    averageDuration: Float!
    popularReasons: [ReasonCount!]!
  }

  # User Analytics
  type UserAnalytics {
    totalUsers: Int!
    usersByRole: [RoleCount!]!
    usersByMonth: [TimeSeriesPoint!]!
    activeUsers: Int!
    newUsersThisMonth: Int!
    userGrowthRate: Float!
    retentionRate: Float!
  }

  # Pet Analytics
  type PetAnalytics {
    totalPets: Int!
    activePets: Int!
    petsBySpecies: [SpeciesCount!]!
    petsByMonth: [TimeSeriesPoint!]!
    averagePetsPerOwner: Float!
    popularBreeds: [BreedCount!]!
    petAgeDistribution: [AgeRange!]!
  }

  # Financial Analytics
  type FinancialAnalytics {
    totalRevenue: Float!
    monthlyRevenue: Float!
    yearlyRevenue: Float!
    revenueByMonth: [TimeSeriesPoint!]!
    revenueByPaymentStatus: [StatusCount!]!
    averageAppointmentValue: Float!
    topEarningVeterinarians: [VeterinarianRevenue!]!
    revenueGrowthRate: Float!
  }

  # Veterinarian Analytics
  type VeterinarianAnalytics {
    totalVeterinarians: Int!
    availableVeterinarians: Int!
    veterinariansBySpecialization: [SpecializationCount!]!
    averageRating: Float!
    totalConsultationsFeeRange: RangeStats!
    workloadDistribution: [VeterinarianWorkload!]!
  }

  # Clinic Analytics
  type ClinicAnalytics {
    totalClinics: Int!
    activeClinics: Int!
    clinicsWithEmergency: Int!
    appointmentsPerClinic: [ClinicAppointments!]!
    clinicUtilization: [ClinicUtilization!]!
  }

  # Supporting Types
  type StatusCount {
    status: String!
    count: Int!
    percentage: Float!
  }

  type RoleCount {
    role: String!
    count: Int!
    percentage: Float!
  }

  type SpeciesCount {
    species: String!
    count: Int!
    percentage: Float!
  }

  type BreedCount {
    breed: String!
    count: Int!
    species: String!
  }

  type ReasonCount {
    reason: String!
    count: Int!
  }

  type AgeRange {
    range: String!
    count: Int!
  }

  type VeterinarianRevenue {
    id: Int!
    name: String!
    specialization: String!
    totalRevenue: Float!
    appointmentCount: Int!
    averageAppointmentValue: Float!
  }

  type SpecializationCount {
    specialization: String!
    count: Int!
    averageExperience: Float!
    averageFee: Float!
  }

  type RangeStats {
    min: Float!
    max: Float!
    average: Float!
    median: Float!
  }

  type VeterinarianWorkload {
    id: Int!
    name: String!
    appointmentCount: Int!
    completionRate: Float!
    averageRating: Float!
  }

  type ClinicAppointments {
    id: Int!
    name: String!
    appointmentCount: Int!
    revenue: Float!
  }

  type ClinicUtilization {
    id: Int!
    name: String!
    utilizationRate: Float!
    averageWaitTime: Float!
  }

  # Application Analytics
  type ApplicationAnalytics {
    pendingApplications: Int!
    approvedApplications: Int!
    rejectedApplications: Int!
    applicationsByMonth: [TimeSeriesPoint!]!
    averageProcessingTime: Float!
    applicationsByStatus: [StatusCount!]!
  }

  # Input Types
  input DateRange {
    start: Date!
    end: Date!
  }

  input AnalyticsFilters {
    dateRange: DateRange
    clinicIds: [Int!]
    veterinarianIds: [Int!]
    petOwnerIds: [Int!]
    appointmentStatus: [String!]
    petSpecies: [String!]
  }

  # Query Types
  type Query {
    # Main analytics queries
    systemOverview(filters: AnalyticsFilters): SystemOverview!
    appointmentAnalytics(filters: AnalyticsFilters): AppointmentAnalytics!
    userAnalytics(filters: AnalyticsFilters): UserAnalytics!
    petAnalytics(filters: AnalyticsFilters): PetAnalytics!
    financialAnalytics(filters: AnalyticsFilters): FinancialAnalytics!
    veterinarianAnalytics(filters: AnalyticsFilters): VeterinarianAnalytics!
    clinicAnalytics(filters: AnalyticsFilters): ClinicAnalytics!
    applicationAnalytics(filters: AnalyticsFilters): ApplicationAnalytics!

    # Historical data queries
    historicalTrends(
      metric: String!
      period: String! # day, week, month, year
      dateRange: DateRange!
      filters: AnalyticsFilters
    ): [TimeSeriesPoint!]!

    # Comparison queries
    periodComparison(
      metric: String!
      currentPeriod: DateRange!
      previousPeriod: DateRange!
      filters: AnalyticsFilters
    ): JSON!
  }
`;

export default typeDefs;