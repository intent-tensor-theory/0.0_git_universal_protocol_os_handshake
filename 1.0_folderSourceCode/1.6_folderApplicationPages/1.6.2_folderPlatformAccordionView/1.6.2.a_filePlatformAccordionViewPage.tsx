// ============================================
// PROTOCOL OS - PLATFORM ACCORDION VIEW PAGE
// ============================================
// Address: 1.6.2.a
// Purpose: Hierarchical accordion view of platforms/resources/handshakes
// ============================================

import React, { useEffect } from 'react';
import { usePlatformStore } from '@context/1.5.1_folderPlatformContext/1.5.1.a_filePlatformStore';
import { useResourceStore } from '@context/1.5.2_folderResourceContext/1.5.2.a_fileResourceStore';
import { useHandshakeStore } from '@context/1.5.3_folderHandshakeContext/1.5.3.a_fileHandshakeStore';
import { useUiStore } from '@context/1.5.6_folderUiContext/1.5.6.a_fileUiStore';
import { AddResourceButton, AddHandshakeButton } from '@ui/1.7.5_folderAccordionPlusButton/1.7.5.a_fileAccordionPlusButtonComponent';
import { EkgStatusIndicator } from '@ui/1.7.2_folderEkgStatusIndicator/1.7.2.a_fileEkgStatusIndicatorComponent';
import { MasterBadge, ActiveBadge, DraftBadge } from '@ui/1.7.3_folderMasterBadgeIndicator/1.7.3.a_fileMasterBadgeIndicatorComponent';
import type { Platform } from '@types/1.9.b_filePlatformTypeDefinitions';
import type { Resource } from '@types/1.9.c_fileResourceTypeDefinitions';
import type { Handshake } from '@types/1.9.f_fileHandshakeTypeDefinitions';

/**
 * Chevron Icon
 */
const ChevronIcon: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <svg 
    className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

/**
 * Handshake Accordion Item
 */
interface HandshakeItemProps {
  handshake: Handshake;
  platformId: string;
  resourceId: string;
  isSelected: boolean;
  onSelect: () => void;
}

const HandshakeItem: React.FC<HandshakeItemProps> = ({
  handshake,
  platformId,
  resourceId,
  isSelected,
  onSelect,
}) => {
  return (
    <div
      className={`
        ml-8 p-3 rounded-lg border cursor-pointer transition-all
        ${isSelected 
          ? 'border-blue-500/50 bg-blue-500/10' 
          : 'border-gray-700/50 bg-gray-900/30 hover:border-blue-500/30'}
      `}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-blue-400 text-sm font-mono">
            {handshake.protocolType}
          </span>
          <span className="text-white font-medium">{handshake.title}</span>
        </div>
        <div className="flex items-center gap-2">
          {handshake.isMaster && <MasterBadge size="small" />}
          <span className="text-gray-500 text-xs">
            {handshake.curlRequests?.length ?? 0} requests
          </span>
        </div>
      </div>
      {handshake.description && (
        <p className="text-sm text-gray-500 mt-1 truncate">{handshake.description}</p>
      )}
    </div>
  );
};

/**
 * Resource Accordion Item
 */
interface ResourceItemProps {
  resource: Resource;
  platformId: string;
  isExpanded: boolean;
  onToggle: () => void;
}

const ResourceItem: React.FC<ResourceItemProps> = ({
  resource,
  platformId,
  isExpanded,
  onToggle,
}) => {
  const { selectedHandshakeId, selectHandshake } = useHandshakeStore();

  return (
    <div className="ml-4">
      {/* Resource Header */}
      <div
        className={`
          flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all
          ${isExpanded 
            ? 'border-green-500/50 bg-green-500/10' 
            : 'border-gray-700/50 bg-gray-800/50 hover:border-green-500/30'}
        `}
        onClick={onToggle}
      >
        <ChevronIcon expanded={isExpanded} />
        <span className="text-green-400">📁</span>
        <span className="text-white font-medium flex-1">{resource.name}</span>
        <span className="text-gray-500 text-xs font-mono">{resource.baseName}</span>
        <ActiveBadge size="small" />
      </div>

      {/* Handshakes */}
      {isExpanded && (
        <div className="mt-2 space-y-2">
          {resource.handshakes?.map(handshake => (
            <HandshakeItem
              key={handshake.id}
              handshake={handshake}
              platformId={platformId}
              resourceId={resource.id}
              isSelected={selectedHandshakeId === handshake.id}
              onSelect={() => selectHandshake(handshake.id)}
            />
          ))}
          <AddHandshakeButton
            onClick={() => {
              // Would open modal to add handshake
              console.log('Add handshake to resource:', resource.id);
            }}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Platform Accordion Item
 */
interface PlatformItemProps {
  platform: Platform;
  isExpanded: boolean;
  onToggle: () => void;
}

const PlatformItem: React.FC<PlatformItemProps> = ({
  platform,
  isExpanded,
  onToggle,
}) => {
  const { expandedResourceIds, toggleResourceExpanded } = useUiStore();

  return (
    <div className="border border-gray-700/50 rounded-lg overflow-hidden bg-gray-800/30">
      {/* Platform Header */}
      <div
        className={`
          flex items-center gap-3 p-4 cursor-pointer transition-colors
          ${isExpanded ? 'bg-teal-500/10 border-b border-gray-700/50' : 'hover:bg-gray-800/50'}
        `}
        onClick={onToggle}
      >
        <ChevronIcon expanded={isExpanded} />
        <EkgStatusIndicator status="configured" size="small" />
        <div className="flex-1">
          <h3 className="text-white font-semibold">{platform.name}</h3>
          {platform.description && (
            <p className="text-sm text-gray-500 truncate">{platform.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm">
            {platform.resources?.length ?? 0} resources
          </span>
        </div>
      </div>

      {/* Resources */}
      {isExpanded && (
        <div className="p-3 space-y-2 bg-gray-900/20">
          {platform.resources?.map(resource => (
            <ResourceItem
              key={resource.id}
              resource={resource}
              platformId={platform.id}
              isExpanded={expandedResourceIds.has(resource.id)}
              onToggle={() => toggleResourceExpanded(resource.id)}
            />
          ))}
          <AddResourceButton
            onClick={() => {
              // Would open modal to add resource
              console.log('Add resource to platform:', platform.id);
            }}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Platform Accordion View Page Component
 */
export const PlatformAccordionViewPage: React.FC = () => {
  const { platforms, loadPlatforms, isLoading } = usePlatformStore();
  const { expandedPlatformIds, togglePlatformExpanded, expandAllPlatforms, collapseAllPlatforms } = useUiStore();

  // Load platforms on mount
  useEffect(() => {
    loadPlatforms();
  }, [loadPlatforms]);

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Platforms</h1>
          <p className="text-gray-400 mt-1">
            {platforms.length} platform{platforms.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => expandAllPlatforms(platforms.map(p => p.id))}
            className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAllPlatforms}
            className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search platforms, resources, or handshakes..."
          className="w-full px-4 py-2 pl-10 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-teal-500/50"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
        </div>
      ) : platforms.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12 bg-gray-800/30 rounded-lg border border-gray-700/50">
          <p className="text-gray-500 mb-4">No platforms configured</p>
          <button
            onClick={() => window.location.hash = '#/platforms/new'}
            className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
          >
            Create Your First Platform
          </button>
        </div>
      ) : (
        /* Platform List */
        <div className="space-y-3">
          {platforms.map(platform => (
            <PlatformItem
              key={platform.id}
              platform={platform}
              isExpanded={expandedPlatformIds.has(platform.id)}
              onToggle={() => togglePlatformExpanded(platform.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PlatformAccordionViewPage;
