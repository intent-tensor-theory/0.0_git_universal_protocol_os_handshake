// ============================================
// PROTOCOL OS - SAVED HANDSHAKES BROWSER PAGE
// ============================================
// Address: 1.6.4.a
// Purpose: Browse and manage saved handshake snapshots
// ============================================

import React, { useEffect, useState } from 'react';
import { useSavedHandshakesStore } from '@context/1.5.5_folderSavedHandshakesContext/1.5.5.a_fileSavedHandshakesStore';
import { useUiStore } from '@context/1.5.6_folderUiContext/1.5.6.a_fileUiStore';
import { MasterBadge, ArchivedBadge, ActiveBadge } from '@ui/1.7.3_folderMasterBadgeIndicator/1.7.3.a_fileMasterBadgeIndicatorComponent';
import { CopyToClipboardButton } from '@ui/1.7.4_folderCopyToClipboardButton/1.7.4.a_fileCopyToClipboardButtonComponent';
import { PrimaryButton, SecondaryButton, DangerButton, GhostButton } from '@ui/1.7.7_folder3dButton/1.7.7.a_file3dButtonComponent';
import type { SavedHandshake } from '@types/1.9.g_fileSavedHandshakeTypeDefinitions';

/**
 * Snapshot Card
 */
interface SnapshotCardProps {
  snapshot: SavedHandshake;
  isSelected: boolean;
  onSelect: () => void;
  onSetMaster: () => void;
  onDelete: () => void;
  onRestore: () => void;
}

const SnapshotCard: React.FC<SnapshotCardProps> = ({
  snapshot,
  isSelected,
  onSelect,
  onSetMaster,
  onDelete,
  onRestore,
}) => {
  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className={`
        p-4 rounded-lg border cursor-pointer transition-all
        ${isSelected 
          ? 'border-teal-500/50 bg-teal-500/10' 
          : 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600'}
      `}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">{snapshot.title}</h3>
            {snapshot.isMaster && <MasterBadge size="small" />}
          </div>
          <p className="text-sm text-gray-500 font-mono">{snapshot.baseName}</p>
        </div>
        <span className="text-xs text-gray-500">v{snapshot.serial}</span>
      </div>

      {/* Description */}
      {snapshot.description && (
        <p className="text-sm text-gray-400 mb-2 line-clamp-2">{snapshot.description}</p>
      )}

      {/* Tags */}
      {snapshot.tags && snapshot.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {snapshot.tags.map(tag => (
            <span 
              key={tag}
              className="px-2 py-0.5 text-xs bg-gray-700/50 text-gray-300 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Meta */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Saved: {formatDate(snapshot.savedAt)}</span>
        <span>{snapshot.curlRequests?.length ?? 0} requests</span>
      </div>

      {/* Actions */}
      {isSelected && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-700/50" onClick={(e) => e.stopPropagation()}>
          <SecondaryButton size="small" onClick={onRestore}>
            Restore
          </SecondaryButton>
          {!snapshot.isMaster && (
            <GhostButton size="small" onClick={onSetMaster}>
              Set as Master
            </GhostButton>
          )}
          <DangerButton size="small" onClick={onDelete}>
            Delete
          </DangerButton>
        </div>
      )}
    </div>
  );
};

/**
 * Saved Handshakes Browser Page Component
 */
export const SavedHandshakesBrowserPage: React.FC = () => {
  const {
    savedHandshakes,
    isLoading,
    error,
    loadSavedHandshakes,
    deleteSavedHandshake,
    setAsMaster,
    getFilteredHandshakes,
    getAllBaseNames,
    getAllTags,
    searchQuery,
    setSearchQuery,
    filterByBaseName,
    setFilterByBaseName,
    filterByTag,
    setFilterByTag,
    sortBy,
    sortOrder,
    setSorting,
    selectedSnapshotId,
    selectSnapshot,
    exportAll,
    clearError,
  } = useSavedHandshakesStore();

  const { showToast, openModal } = useUiStore();
  const [exportData, setExportData] = useState<string | null>(null);

  // Load on mount
  useEffect(() => {
    loadSavedHandshakes();
  }, [loadSavedHandshakes]);

  // Handle delete
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this snapshot?')) {
      await deleteSavedHandshake(id);
      showToast({ type: 'success', title: 'Snapshot deleted' });
    }
  };

  // Handle set master
  const handleSetMaster = async (id: string) => {
    await setAsMaster(id);
    showToast({ type: 'success', title: 'Set as master version' });
  };

  // Handle restore
  const handleRestore = (snapshot: SavedHandshake) => {
    openModal('confirm-restore', { snapshot });
    showToast({ type: 'info', title: 'Restore functionality coming soon' });
  };

  // Handle export
  const handleExport = async () => {
    const data = await exportAll();
    setExportData(data);
  };

  const filteredHandshakes = getFilteredHandshakes();
  const baseNames = getAllBaseNames();
  const tags = getAllTags();

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Saved Handshakes</h1>
          <p className="text-gray-400 mt-1">
            {savedHandshakes.length} snapshot{savedHandshakes.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SecondaryButton onClick={handleExport}>
            Export All
          </SecondaryButton>
          <PrimaryButton onClick={() => openModal('import-handshakes')}>
            Import
          </PrimaryButton>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between">
          <span className="text-red-400">{error}</span>
          <GhostButton size="small" onClick={clearError}>Dismiss</GhostButton>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search snapshots..."
            className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-teal-500/50"
          />
        </div>

        {/* Base Name Filter */}
        <select
          value={filterByBaseName ?? ''}
          onChange={(e) => setFilterByBaseName(e.target.value || null)}
          className="px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:border-teal-500/50"
        >
          <option value="">All Base Names</option>
          {baseNames.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        {/* Tag Filter */}
        <select
          value={filterByTag ?? ''}
          onChange={(e) => setFilterByTag(e.target.value || null)}
          className="px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:border-teal-500/50"
        >
          <option value="">All Tags</option>
          {tags.map(tag => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [by, order] = e.target.value.split('-');
            setSorting(by as typeof sortBy, order as typeof sortOrder);
          }}
          className="px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:border-teal-500/50"
        >
          <option value="savedAt-desc">Newest First</option>
          <option value="savedAt-asc">Oldest First</option>
          <option value="serial-desc">Highest Version</option>
          <option value="serial-asc">Lowest Version</option>
          <option value="title-asc">Title A-Z</option>
          <option value="title-desc">Title Z-A</option>
        </select>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
        </div>
      ) : filteredHandshakes.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12 bg-gray-800/30 rounded-lg border border-gray-700/50">
          <p className="text-gray-500 mb-4">
            {savedHandshakes.length === 0 
              ? 'No saved handshakes yet' 
              : 'No handshakes match your filters'}
          </p>
          {savedHandshakes.length === 0 && (
            <p className="text-sm text-gray-600">
              Save a handshake from the editor to create a snapshot
            </p>
          )}
        </div>
      ) : (
        /* Snapshot Grid */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHandshakes.map(snapshot => (
            <SnapshotCard
              key={snapshot.id}
              snapshot={snapshot}
              isSelected={selectedSnapshotId === snapshot.id}
              onSelect={() => selectSnapshot(selectedSnapshotId === snapshot.id ? null : snapshot.id)}
              onSetMaster={() => handleSetMaster(snapshot.id)}
              onDelete={() => handleDelete(snapshot.id)}
              onRestore={() => handleRestore(snapshot)}
            />
          ))}
        </div>
      )}

      {/* Export Modal */}
      {exportData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setExportData(null)}>
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Export Data</h2>
              <div className="flex items-center gap-2">
                <CopyToClipboardButton textToCopy={exportData} />
                <GhostButton onClick={() => setExportData(null)}>×</GhostButton>
              </div>
            </div>
            <pre className="bg-gray-900 p-4 rounded-lg text-sm text-gray-300 overflow-auto max-h-[50vh] font-mono">
              {exportData}
            </pre>
            <div className="flex justify-end gap-2 mt-4">
              <SecondaryButton onClick={() => {
                const blob = new Blob([exportData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `protocol-os-export-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}>
                Download File
              </SecondaryButton>
              <GhostButton onClick={() => setExportData(null)}>Close</GhostButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedHandshakesBrowserPage;
