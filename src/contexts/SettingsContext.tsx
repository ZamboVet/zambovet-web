'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { LanguageProvider } from './LanguageContext';

interface UserSettings {
  darkMode: boolean;
  timeFormat: '12h' | '24h';
  notifications: boolean;
  language: string;
}

interface SettingsContextType {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
  resetSettings: () => void;
  formatTime: (date: Date | string) => string;
  formatDate: (date: Date | string) => string;
  formatDateTime: (date: Date | string) => string;
}

const defaultSettings: UserSettings = {
  darkMode: false,
  timeFormat: '12h',
  notifications: true,
  language: 'en',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [mounted, setMounted] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('zambovet_user_settings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings({ ...defaultSettings, ...parsed });
        } catch (error) {
          console.error('Error parsing saved settings:', error);
        }
      }
      setMounted(true);
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      localStorage.setItem('zambovet_user_settings', JSON.stringify(settings));
    }
  }, [settings, mounted]);

  // Apply dark mode to document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const htmlElement = document.documentElement;
      console.log('Applying dark mode:', settings.darkMode);
      console.log('Current classes before:', htmlElement.className);
      
      if (settings.darkMode) {
        htmlElement.classList.add('dark');
        // Also add to body for better compatibility
        document.body.classList.add('dark');
        console.log('Dark mode enabled - added dark class');
      } else {
        htmlElement.classList.remove('dark');
        document.body.classList.remove('dark');
        console.log('Dark mode disabled - removed dark class');
      }
      
      console.log('Current classes after:', htmlElement.className);
      console.log('Body classes:', document.body.className);
    }
  }, [settings.darkMode]);

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  const formatTime = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (settings.timeFormat === '24h') {
      return dateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } else {
      return dateObj.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  };

  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const formattedDate = formatDate(dateObj);
    const formattedTime = formatTime(dateObj);
    return `${formattedDate} at ${formattedTime}`;
  };


  return (
    <SettingsContext.Provider value={{
      settings,
      updateSetting,
      resetSettings,
      formatTime,
      formatDate,
      formatDateTime,
    }}>
      <LanguageProvider language={settings.language}>
        {children}
      </LanguageProvider>
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}