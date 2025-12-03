// ============================================
// PROTOCOL OS - SETTINGS PAGE
// ============================================
// Address: 1.6.5.a
// Purpose: Application settings and configuration
// ============================================

import React from 'react';
import { useUiStore } from '@context/1.5.6_folderUiContext/1.5.6.a_fileUiStore';
import { getDatabaseProvider, getActiveProvider } from '@database/1.2.c_fileIndex';
import { DATABASE_PROVIDER_INFO, checkProviderAvailability } from '@database/1.2.b_fileActiveDatabaseProviderToggle';
import { PrimaryButton, SecondaryButton, DangerButton } from '@ui/1.7.7_folder3dButton/1.7.7.a_file3dButtonComponent';

/**
 * Setting Section
 */
interface SettingSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const SettingSection: React.FC<SettingSectionProps> = ({ title, description, children }) => (
  <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
    <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
    {description && <p className="text-sm text-gray-500 mb-4">{description}</p>}
    {children}
  </div>
);

/**
 * Toggle Switch
 */
interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
  description?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ enabled, onChange, label, description }) => (
  <div className="flex items-center justify-between py-2">
    <div>
      <p className="text-white">{label}</p>
      {description && <p className="text-sm text-gray-500">{description}</p>}
    </div>
    <button
      onClick={() => onChange(!enabled)}
      className={`
        relative w-12 h-6 rounded-full transition-colors
        ${enabled ? 'bg-teal-500' : 'bg-gray-600'}
      `}
    >
      <span 
        className={`
          absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform
          ${enabled ? 'translate-x-6' : 'translate-x-0'}
        `}
      />
    </button>
  </div>
);

/**
 * Settings Page Component
 */
export const SettingsPage: React.FC = () => {
  const {
    themeMode,
    setThemeMode,
    accentColor,
    setAccentColor,
    showLogger,
    toggleLogger,
    developerMode,
    toggleDeveloperMode,
    verboseLogging,
    toggleVerboseLogging,
    showToast,
  } = useUiStore();

  const activeProvider = getActiveProvider();
  const providerAvailability = checkProviderAvailability();

  // Accent color options
  const accentColors = [
    { value: '#14b8a6', label: 'Teal' },
    { value: '#22c55e', label: 'Green' },
    { value: '#3b82f6', label: 'Blue' },
    { value: '#8b5cf6', label: 'Purple' },
    { value: '#f97316', label: 'Orange' },
    { value: '#ef4444', label: 'Red' },
  ];

  // Handle clear data
  const handleClearData = async () => {
    if (confirm('This will delete ALL your platforms, resources, handshakes, and saved snapshots. This cannot be undone. Continue?')) {
      if (confirm('Are you REALLY sure? Type "DELETE" to confirm.')) {
        try {
          const db = getDatabaseProvider();
          await db.clearAllData();
          showToast({ type: 'success', title: 'All data cleared' });
          window.location.reload();
        } catch (error) {
          showToast({ type: 'error', title: 'Failed to clear data', message: error instanceof Error ? error.message : 'Unknown error' });
        }
      }
    }
  };

  // Handle export all
  const handleExportAll = async () => {
    try {
      const db = getDatabaseProvider();
      const result = await db.exportAllData();
      if (result.success && result.data) {
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `protocol-os-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast({ type: 'success', title: 'Data exported' });
      }
    } catch (error) {
      showToast({ type: 'error', title: 'Export failed', message: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      {/* Appearance */}
      <SettingSection title="Appearance" description="Customize the look and feel">
        {/* Theme Mode */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">Theme</label>
          <div className="flex gap-2">
            {(['dark', 'light', 'system'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setThemeMode(mode)}
                className={`
                  px-4 py-2 rounded-lg capitalize transition-colors
                  ${themeMode === mode 
                    ? 'bg-teal-500 text-white' 
                    : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'}
                `}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Accent Color */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Accent Color</label>
          <div className="flex gap-2">
            {accentColors.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setAccentColor(value)}
                title={label}
                className={`
                  w-8 h-8 rounded-full transition-transform
                  ${accentColor === value ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110' : 'hover:scale-110'}
                `}
                style={{ backgroundColor: value }}
              />
            ))}
          </div>
        </div>
      </SettingSection>

      {/* Interface */}
      <SettingSection title="Interface" description="Control UI behavior">
        <ToggleSwitch
          enabled={showLogger}
          onChange={toggleLogger}
          label="Show Logger Panel"
          description="Display the system log at the bottom of the editor"
        />
      </SettingSection>

      {/* Database */}
      <SettingSection title="Database" description="Data storage configuration">
        <div className="space-y-4">
          {/* Current Provider */}
          <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
            <div>
              <p className="text-white">Active Provider</p>
              <p className="text-sm text-gray-500">{DATABASE_PROVIDER_INFO[activeProvider]?.displayName ?? activeProvider}</p>
            </div>
            <span className={`px-2 py-1 text-xs rounded ${providerAvailability[activeProvider] ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {providerAvailability[activeProvider] ? 'Available' : 'Not Configured'}
            </span>
          </div>

          {/* Provider Info */}
          <p className="text-sm text-gray-500">
            To change the database provider, modify the <code className="text-teal-400">ACTIVE_DATABASE_PROVIDER</code> constant in <code className="text-teal-400">1.2.b_fileActiveDatabaseProviderToggle.ts</code>
          </p>

          {/* Available Providers */}
          <div className="space-y-2">
            <p className="text-sm text-gray-400">Available Providers:</p>
            {Object.entries(DATABASE_PROVIDER_INFO).map(([key, info]) => (
              <div 
                key={key}
                className={`
                  flex items-center justify-between p-2 rounded-lg text-sm
                  ${key === activeProvider ? 'bg-teal-500/10 border border-teal-500/30' : 'bg-gray-900/30'}
                `}
              >
                <div>
                  <span className="text-white">{info.displayName}</span>
                  <span className="text-gray-500 ml-2">- {info.description}</span>
                </div>
                <span className={`text-xs ${providerAvailability[key as keyof typeof providerAvailability] ? 'text-green-400' : 'text-gray-500'}`}>
                  {providerAvailability[key as keyof typeof providerAvailability] ? '✓' : '○'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </SettingSection>

      {/* Developer */}
      <SettingSection title="Developer" description="Advanced options for debugging">
        <ToggleSwitch
          enabled={developerMode}
          onChange={toggleDeveloperMode}
          label="Developer Mode"
          description="Enable advanced debugging features"
        />
        <ToggleSwitch
          enabled={verboseLogging}
          onChange={toggleVerboseLogging}
          label="Verbose Logging"
          description="Log additional details to the console"
        />
      </SettingSection>

      {/* Data Management */}
      <SettingSection title="Data Management" description="Export, import, or clear your data">
        <div className="flex flex-wrap gap-3">
          <SecondaryButton onClick={handleExportAll}>
            Export All Data
          </SecondaryButton>
          <SecondaryButton onClick={() => {
            // Would open file picker
            showToast({ type: 'info', title: 'Import functionality coming soon' });
          }}>
            Import Data
          </SecondaryButton>
          <DangerButton onClick={handleClearData}>
            Clear All Data
          </DangerButton>
        </div>
      </SettingSection>

      {/* About */}
      <SettingSection title="About">
        <div className="space-y-2 text-sm">
          <p className="text-gray-400">
            <span className="text-white">Protocol OS</span> - Universal API Handshake System
          </p>
          <p className="text-gray-500">
            Version 1.0.0 • Built with Intent Tensor Theory principles
          </p>
          <p className="text-gray-500">
            Keyboard shortcuts: <code className="text-teal-400">Ctrl+B</code> toggle sidebar, <code className="text-teal-400">Ctrl+L</code> toggle logger
          </p>
        </div>
      </SettingSection>
    </div>
  );
};

export default SettingsPage;
