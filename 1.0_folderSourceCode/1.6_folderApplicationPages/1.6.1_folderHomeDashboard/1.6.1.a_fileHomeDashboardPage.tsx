// ============================================
// PROTOCOL OS - HOME DASHBOARD PAGE
// ============================================
// Address: 1.6.1.a
// Purpose: Main dashboard view with overview and quick actions
// ============================================

import React from 'react';
import { usePlatformStore } from '@context/1.5.1_folderPlatformContext/1.5.1.a_filePlatformStore';
import { useSavedHandshakesStore } from '@context/1.5.5_folderSavedHandshakesContext/1.5.5.a_fileSavedHandshakesStore';
import { useExecutionStore } from '@context/1.5.4_folderExecutionContext/1.5.4.a_fileExecutionStore';
import { EkgStatusIndicator } from '@ui/1.7.2_folderEkgStatusIndicator/1.7.2.a_fileEkgStatusIndicatorComponent';
import { PrimaryButton, SecondaryButton } from '@ui/1.7.7_folder3dButton/1.7.7.a_file3dButtonComponent';

/**
 * Quick Stats Card
 */
interface StatsCardProps {
  title: string;
  value: number;
  subtitle?: string;
  color: 'teal' | 'green' | 'blue' | 'purple';
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, subtitle, color }) => {
  const colorClasses = {
    teal: 'border-teal-500/30 bg-teal-500/10',
    green: 'border-green-500/30 bg-green-500/10',
    blue: 'border-blue-500/30 bg-blue-500/10',
    purple: 'border-purple-500/30 bg-purple-500/10',
  };

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-3xl font-bold text-white mt-1">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
};

/**
 * Recent Activity Item
 */
interface ActivityItemProps {
  type: 'success' | 'failed' | 'info';
  title: string;
  timestamp: string;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ type, title, timestamp }) => {
  const iconClasses = {
    success: 'text-green-400',
    failed: 'text-red-400',
    info: 'text-blue-400',
  };

  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-700/50 last:border-0">
      <span className={`w-2 h-2 rounded-full ${iconClasses[type]} bg-current`} />
      <span className="flex-1 text-sm text-gray-300 truncate">{title}</span>
      <span className="text-xs text-gray-500">{timestamp}</span>
    </div>
  );
};

/**
 * Home Dashboard Page Component
 */
export const HomeDashboardPage: React.FC = () => {
  const platforms = usePlatformStore(state => state.platforms);
  const savedHandshakes = useSavedHandshakesStore(state => state.savedHandshakes);
  const { executionHistory, ekgStatus } = useExecutionStore();

  // Calculate stats
  const totalResources = platforms.reduce((acc, p) => acc + (p.resources?.length ?? 0), 0);
  const totalHandshakes = platforms.reduce((acc, p) => 
    acc + (p.resources?.reduce((r, res) => r + (res.handshakes?.length ?? 0), 0) ?? 0), 0);
  const recentSuccesses = executionHistory.filter(e => e.status === 'success').length;
  const recentFailures = executionHistory.filter(e => e.status === 'failed').length;

  // Format timestamp
  const formatTime = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Protocol OS Dashboard</h1>
          <p className="text-gray-400 mt-1">Universal API Handshake System</p>
        </div>
        <EkgStatusIndicator status={ekgStatus} size="large" showLabel />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard 
          title="Platforms" 
          value={platforms.length} 
          subtitle="Configured"
          color="teal"
        />
        <StatsCard 
          title="Resources" 
          value={totalResources} 
          subtitle="API endpoints"
          color="green"
        />
        <StatsCard 
          title="Handshakes" 
          value={totalHandshakes} 
          subtitle="Active"
          color="blue"
        />
        <StatsCard 
          title="Saved" 
          value={savedHandshakes.length} 
          subtitle="Snapshots"
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 p-4">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <PrimaryButton onClick={() => window.location.hash = '#/platforms/new'}>
            + New Platform
          </PrimaryButton>
          <SecondaryButton onClick={() => window.location.hash = '#/import'}>
            Import Configuration
          </SecondaryButton>
          <SecondaryButton onClick={() => window.location.hash = '#/saved'}>
            Browse Saved Handshakes
          </SecondaryButton>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 p-4">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
          <div className="space-y-1">
            {executionHistory.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">
                No recent executions
              </p>
            ) : (
              executionHistory.slice(0, 5).map(run => (
                <ActivityItem
                  key={run.id}
                  type={run.status === 'success' ? 'success' : run.status === 'failed' ? 'failed' : 'info'}
                  title={`Handshake execution ${run.status}`}
                  timestamp={formatTime(run.completedAt ?? run.startedAt)}
                />
              ))
            )}
          </div>
        </div>

        {/* Execution Summary */}
        <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 p-4">
          <h2 className="text-lg font-semibold text-white mb-4">Execution Summary</h2>
          <div className="flex items-center justify-around py-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-400">{recentSuccesses}</p>
              <p className="text-sm text-gray-400">Successful</p>
            </div>
            <div className="w-px h-12 bg-gray-700" />
            <div className="text-center">
              <p className="text-3xl font-bold text-red-400">{recentFailures}</p>
              <p className="text-sm text-gray-400">Failed</p>
            </div>
            <div className="w-px h-12 bg-gray-700" />
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-400">{executionHistory.length}</p>
              <p className="text-sm text-gray-400">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Overview */}
      <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 p-4">
        <h2 className="text-lg font-semibold text-white mb-4">Platforms Overview</h2>
        {platforms.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No platforms configured yet</p>
            <PrimaryButton onClick={() => window.location.hash = '#/platforms/new'}>
              Create Your First Platform
            </PrimaryButton>
          </div>
        ) : (
          <div className="grid gap-3">
            {platforms.slice(0, 5).map(platform => (
              <div 
                key={platform.id}
                className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700/30 hover:border-teal-500/30 cursor-pointer transition-colors"
                onClick={() => window.location.hash = `#/platforms/${platform.id}`}
              >
                <div>
                  <p className="font-medium text-white">{platform.name}</p>
                  <p className="text-sm text-gray-500">
                    {platform.resources?.length ?? 0} resources • 
                    {platform.resources?.reduce((acc, r) => acc + (r.handshakes?.length ?? 0), 0) ?? 0} handshakes
                  </p>
                </div>
                <span className="text-gray-500">→</span>
              </div>
            ))}
            {platforms.length > 5 && (
              <p className="text-sm text-gray-500 text-center mt-2">
                And {platforms.length - 5} more...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeDashboardPage;
