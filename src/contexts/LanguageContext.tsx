'use client';

import React, { createContext, useContext, ReactNode } from 'react';

// Define translation keys and their types
interface Translations {
  // Navigation
  'nav.overview': string;
  'nav.pets': string;
  'nav.appointments': string;
  'nav.analytics': string;
  'nav.clinics': string;
  'nav.profile': string;
  'nav.settings': string;

  // Settings
  'settings.title': string;
  'settings.description': string;
  'settings.darkMode': string;
  'settings.darkModeDesc': string;
  'settings.timeFormat': string;
  'settings.timeFormatDesc': string;
  'settings.notifications': string;
  'settings.notificationsDesc': string;
  'settings.language': string;
  'settings.languageDesc': string;
  'settings.reset': string;
  'settings.resetConfirm': string;
  'settings.cancel': string;
  'settings.saved': string;

  // Dashboard
  'dashboard.welcome': string;
  'dashboard.managing': string;
  'dashboard.pet': string;
  'dashboard.pets': string;
  'dashboard.myPets': string;
  'dashboard.upcomingVisits': string;
  'dashboard.completedVisits': string;
  'dashboard.totalSpent': string;

  // Analytics
  'analytics.title': string;
  'analytics.description': string;
  'analytics.overview': string;
  'analytics.totalAppointments': string;
  'analytics.completed': string;
  'analytics.avgMonthly': string;
  'analytics.monthlyActivity': string;
  'analytics.petCareSummary': string;
  'analytics.servicesUsed': string;
  'analytics.recentActivity': string;

  // Common
  'common.loading': string;
  'common.error': string;
  'common.success': string;
  'common.save': string;
  'common.cancel': string;
  'common.delete': string;
  'common.edit': string;
  'common.view': string;
}

// Translation data
const translations: Record<string, Translations> = {
  en: {
    // Navigation
    'nav.overview': 'Overview',
    'nav.pets': 'My Pets',
    'nav.appointments': 'Appointments',
    'nav.analytics': 'Analytics',
    'nav.clinics': 'Clinics',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',

    // Settings
    'settings.title': 'Settings',
    'settings.description': 'Customize your experience',
    'settings.darkMode': 'Dark Mode',
    'settings.darkModeDesc': 'Switch between light and dark themes',
    'settings.timeFormat': 'Time Format',
    'settings.timeFormatDesc': 'Current time: {time}',
    'settings.notifications': 'Notifications',
    'settings.notificationsDesc': 'Receive appointment reminders',
    'settings.language': 'Language',
    'settings.languageDesc': 'Choose your preferred language',
    'settings.reset': 'Reset to Default',
    'settings.resetConfirm': 'Are you sure you want to reset all settings?',
    'settings.cancel': 'Cancel',
    'settings.saved': 'Settings saved',

    // Dashboard
    'dashboard.welcome': 'Pet Care Dashboard 🐾',
    'dashboard.managing': 'Managing',
    'dashboard.pet': 'pet',
    'dashboard.pets': 'pets',
    'dashboard.myPets': 'My Pets',
    'dashboard.upcomingVisits': 'Upcoming Visits',
    'dashboard.completedVisits': 'Completed Visits',
    'dashboard.totalSpent': 'Total Spent',

    // Analytics
    'analytics.title': 'Pet Care Analytics',
    'analytics.description': 'Essential insights into your pet care patterns',
    'analytics.overview': 'Overview',
    'analytics.totalAppointments': 'Total Appointments',
    'analytics.completed': 'Completed',
    'analytics.avgMonthly': 'Avg Monthly',
    'analytics.monthlyActivity': 'Monthly Activity (Last 6 Months)',
    'analytics.petCareSummary': 'Pet Care Summary',
    'analytics.servicesUsed': 'Services Used',
    'analytics.recentActivity': 'Recent Activity',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
  },
  es: {
    // Navigation
    'nav.overview': 'Resumen',
    'nav.pets': 'Mis Mascotas',
    'nav.appointments': 'Citas',
    'nav.analytics': 'Analíticas',
    'nav.clinics': 'Clínicas',
    'nav.profile': 'Perfil',
    'nav.settings': 'Configuración',

    // Settings
    'settings.title': 'Configuración',
    'settings.description': 'Personaliza tu experiencia',
    'settings.darkMode': 'Modo Oscuro',
    'settings.darkModeDesc': 'Cambia entre temas claro y oscuro',
    'settings.timeFormat': 'Formato de Hora',
    'settings.timeFormatDesc': 'Hora actual: {time}',
    'settings.notifications': 'Notificaciones',
    'settings.notificationsDesc': 'Recibir recordatorios de citas',
    'settings.language': 'Idioma',
    'settings.languageDesc': 'Elige tu idioma preferido',
    'settings.reset': 'Restablecer a Predeterminado',
    'settings.resetConfirm': '¿Estás seguro de que quieres restablecer toda la configuración?',
    'settings.cancel': 'Cancelar',
    'settings.saved': 'Configuración guardada',

    // Dashboard
    'dashboard.welcome': 'Panel de Cuidado de Mascotas 🐾',
    'dashboard.managing': 'Gestionando',
    'dashboard.pet': 'mascota',
    'dashboard.pets': 'mascotas',
    'dashboard.myPets': 'Mis Mascotas',
    'dashboard.upcomingVisits': 'Visitas Próximas',
    'dashboard.completedVisits': 'Visitas Completadas',
    'dashboard.totalSpent': 'Total Gastado',

    // Analytics
    'analytics.title': 'Analíticas de Cuidado de Mascotas',
    'analytics.description': 'Información esencial sobre los patrones de cuidado de tus mascotas',
    'analytics.overview': 'Resumen',
    'analytics.totalAppointments': 'Citas Totales',
    'analytics.completed': 'Completadas',
    'analytics.avgMonthly': 'Promedio Mensual',
    'analytics.monthlyActivity': 'Actividad Mensual (Últimos 6 Meses)',
    'analytics.petCareSummary': 'Resumen de Cuidado de Mascotas',
    'analytics.servicesUsed': 'Servicios Utilizados',
    'analytics.recentActivity': 'Actividad Reciente',

    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.view': 'Ver',
  },
  fil: {
    // Navigation
    'nav.overview': 'Pangkalahatang-tanaw',
    'nav.pets': 'Aking mga Alagang Hayop',
    'nav.appointments': 'mga Appointment',
    'nav.analytics': 'Analytics',
    'nav.clinics': 'mga Klinika',
    'nav.profile': 'Profile',
    'nav.settings': 'mga Setting',

    // Settings
    'settings.title': 'mga Setting',
    'settings.description': 'I-customize ang inyong karanasan',
    'settings.darkMode': 'Dark Mode',
    'settings.darkModeDesc': 'Magpalit sa pagitan ng liwanag at madilim na tema',
    'settings.timeFormat': 'Format ng Oras',
    'settings.timeFormatDesc': 'Kasalukuyang oras: {time}',
    'settings.notifications': 'mga Notification',
    'settings.notificationsDesc': 'Tumanggap ng mga paalala sa appointment',
    'settings.language': 'Wika',
    'settings.languageDesc': 'Piliin ang inyong gustong wika',
    'settings.reset': 'I-reset sa Default',
    'settings.resetConfirm': 'Sigurado ka ba na gusto mong i-reset ang lahat ng setting?',
    'settings.cancel': 'Kanselahin',
    'settings.saved': 'Na-save na ang mga setting',

    // Dashboard
    'dashboard.welcome': 'Pet Care Dashboard 🐾',
    'dashboard.managing': 'Namamahala ng',
    'dashboard.pet': 'alagang hayop',
    'dashboard.pets': 'mga alagang hayop',
    'dashboard.myPets': 'Aking mga Alagang Hayop',
    'dashboard.upcomingVisits': 'mga Darating na Bisita',
    'dashboard.completedVisits': 'mga Natapos na Bisita',
    'dashboard.totalSpent': 'Kabuuang Nagastos',

    // Analytics
    'analytics.title': 'Pet Care Analytics',
    'analytics.description': 'Mahalagang insight sa inyong pet care patterns',
    'analytics.overview': 'Pangkalahatang-tanaw',
    'analytics.totalAppointments': 'Kabuuang mga Appointment',
    'analytics.completed': 'Natapos na',
    'analytics.avgMonthly': 'Average kada Buwan',
    'analytics.monthlyActivity': 'Buwanang Aktibidad (Huling 6 Buwan)',
    'analytics.petCareSummary': 'Buod ng Pet Care',
    'analytics.servicesUsed': 'mga Serbisyong Ginamit',
    'analytics.recentActivity': 'Kamakailang Aktibidad',

    // Common
    'common.loading': 'Naglo-load...',
    'common.error': 'Error',
    'common.success': 'Tagumpay',
    'common.save': 'I-save',
    'common.cancel': 'Kanselahin',
    'common.delete': 'Tanggalin',
    'common.edit': 'I-edit',
    'common.view': 'Tingnan',
  },
};

interface LanguageContextType {
  language: string;
  t: (key: keyof Translations, params?: Record<string, string>) => string;
  availableLanguages: Array<{ code: string; name: string; nativeName: string }>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

interface LanguageProviderProps {
  children: ReactNode;
  language: string;
}

export function LanguageProvider({ children, language }: LanguageProviderProps) {
  const availableLanguages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'fil', name: 'Filipino', nativeName: 'Filipino' },
  ];

  const t = (key: keyof Translations, params?: Record<string, string>): string => {
    const translation = translations[language]?.[key] || translations['en'][key] || key;
    
    if (params) {
      return Object.entries(params).reduce(
        (acc, [paramKey, paramValue]) => acc.replace(`{${paramKey}}`, paramValue),
        translation
      );
    }
    
    return translation;
  };

  return (
    <LanguageContext.Provider value={{
      language,
      t,
      availableLanguages,
    }}>
      {children}
    </LanguageContext.Provider>
  );
}