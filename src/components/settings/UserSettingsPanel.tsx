'use client';

import { useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  CogIcon,
  MoonIcon,
  SunIcon,
  ClockIcon,
  BellIcon,
  GlobeAltIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface UserSettingsPanelProps {
  onClose?: () => void;
  isModal?: boolean;
}

export default function UserSettingsPanel({ onClose, isModal = false }: UserSettingsPanelProps) {
  const { settings, updateSetting, resetSettings, formatTime } = useSettings();
  const { t, availableLanguages } = useLanguage();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSettingChange = <K extends keyof typeof settings>(
    key: K, 
    value: typeof settings[K]
  ) => {
    updateSetting(key, value);
    
    // Force immediate dark mode application
    if (key === 'darkMode' && typeof document !== 'undefined') {
      const htmlElement = document.documentElement;
      const body = document.body;
      
      if (value) {
        htmlElement.classList.add('dark');
        body.classList.add('dark');
        console.log('Force applied dark mode');
      } else {
        htmlElement.classList.remove('dark');
        body.classList.remove('dark');
        console.log('Force removed dark mode');
      }
    }
    
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleReset = () => {
    resetSettings();
    setShowResetConfirm(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const currentTime = new Date();

  const containerClasses = isModal 
    ? "bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-lg w-full"
    : "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6";

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
            <CogIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('settings.title')}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('settings.description')}</p>
          </div>
        </div>
        {isModal && onClose && (
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-800 dark:text-green-200">Settings saved</span>
          </div>
        </div>
      )}

      {/* Debug Info */}
      <div className="mb-4 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div className="text-xs text-yellow-800 dark:text-yellow-200">
          Debug: Dark mode is {settings.darkMode ? 'ON' : 'OFF'} | 
          HTML class: {typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') ? 'dark' : 'light' : 'unknown'}
        </div>
      </div>

      {/* Visual Dark Mode Test */}
      <div className="mb-4 p-3 bg-red-100 dark:bg-green-100 border rounded-lg">
        <div className="text-sm font-medium text-red-800 dark:text-green-800">
          🔴 Light Mode (RED) / 🟢 Dark Mode (GREEN) - This should be GREEN when dark mode is active
        </div>
      </div>

      {/* Settings List */}
      <div className="space-y-6">
        {/* Dark Mode */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              {settings.darkMode ? (
                <MoonIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              ) : (
                <SunIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('settings.darkMode')}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">{t('settings.darkModeDesc')}</p>
            </div>
          </div>
          <button
            onClick={() => handleSettingChange('darkMode', !settings.darkMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              settings.darkMode 
                ? 'bg-blue-600' 
                : 'bg-gray-200 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.darkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Time Format */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Time Format</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Current time: {formatTime(currentTime)}
              </p>
            </div>
          </div>
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => handleSettingChange('timeFormat', '12h')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                settings.timeFormat === '12h'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              12h
            </button>
            <button
              onClick={() => handleSettingChange('timeFormat', '24h')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                settings.timeFormat === '24h'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              24h
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <BellIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Notifications</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Receive appointment reminders</p>
            </div>
          </div>
          <button
            onClick={() => handleSettingChange('notifications', !settings.notifications)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              settings.notifications 
                ? 'bg-blue-600' 
                : 'bg-gray-200 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.notifications ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Language */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <GlobeAltIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Language</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Choose your preferred language</p>
            </div>
          </div>
          <select
            value={settings.language}
            onChange={(e) => handleSettingChange('language', e.target.value)}
            className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 px-3 py-1"
          >
            {availableLanguages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reset Settings */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Reset to Default
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Are you sure you want to reset all settings?
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}