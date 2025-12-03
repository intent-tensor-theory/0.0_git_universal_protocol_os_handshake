// ============================================
// PROTOCOL OS - HANDSHAKE EDITOR PAGE
// ============================================
// Address: 1.6.3.a
// Purpose: Full-featured handshake configuration editor
// ============================================

import React, { useState, useEffect } from 'react';
import { useHandshakeStore } from '@context/1.5.3_folderHandshakeContext/1.5.3.a_fileHandshakeStore';
import { useExecutionStore } from '@context/1.5.4_folderExecutionContext/1.5.4.a_fileExecutionStore';
import { useUiStore } from '@context/1.5.6_folderUiContext/1.5.6.a_fileUiStore';
import { EkgStatusIndicator } from '@ui/1.7.2_folderEkgStatusIndicator/1.7.2.a_fileEkgStatusIndicatorComponent';
import { SystemLoggerDisplay } from '@ui/1.7.1_folderSystemLoggerDisplay/1.7.1.a_fileSystemLoggerDisplayComponent';
import { CopyToClipboardButton } from '@ui/1.7.4_folderCopyToClipboardButton/1.7.4.a_fileCopyToClipboardButtonComponent';
import { PrimaryButton, DangerButton, SecondaryButton, GhostButton } from '@ui/1.7.7_folder3dButton/1.7.7.a_file3dButtonComponent';
import type { Handshake, ProtocolType } from '@types/1.9.f_fileHandshakeTypeDefinitions';
import type { CurlRequest } from '@types/1.9.e_fileCurlRequestTypeDefinitions';

/**
 * Protocol type options
 */
const PROTOCOL_OPTIONS: { value: ProtocolType; label: string }[] = [
  { value: 'curl-default', label: 'cURL Default' },
  { value: 'oauth-pkce', label: 'OAuth 2.0 PKCE' },
  { value: 'oauth-auth-code', label: 'OAuth Authorization Code' },
  { value: 'oauth-implicit', label: 'OAuth Implicit (Deprecated)' },
  { value: 'client-credentials', label: 'Client Credentials' },
  { value: 'rest-api-key', label: 'REST API Key' },
  { value: 'graphql', label: 'GraphQL' },
  { value: 'websocket', label: 'WebSocket' },
  { value: 'soap-xml', label: 'SOAP/XML' },
  { value: 'github-repo-runner', label: 'GitHub Repo Runner' },
  { value: 'keyless-scraper', label: 'Keyless Scraper' },
];

/**
 * cURL Request Editor
 */
interface CurlRequestEditorProps {
  request: CurlRequest;
  onUpdate: (updates: Partial<CurlRequest>) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

const CurlRequestEditor: React.FC<CurlRequestEditorProps> = ({
  request,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border border-gray-700/50 rounded-lg bg-gray-900/30 overflow-hidden">
      {/* Request Header */}
      <div 
        className="flex items-center gap-3 p-3 bg-gray-800/50 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="text-gray-500 font-mono text-sm">#{request.serial}</span>
        <input
          type="text"
          value={request.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 bg-transparent text-white font-medium focus:outline-none"
          placeholder="Request title"
        />
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {onMoveUp && (
            <GhostButton size="small" onClick={onMoveUp}>↑</GhostButton>
          )}
          {onMoveDown && (
            <GhostButton size="small" onClick={onMoveDown}>↓</GhostButton>
          )}
          <DangerButton size="small" onClick={onDelete}>×</DangerButton>
        </div>
      </div>

      {/* Request Body */}
      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* cURL Command */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">cURL Command</label>
            <div className="relative">
              <textarea
                value={request.command}
                onChange={(e) => onUpdate({ command: e.target.value })}
                className="w-full h-32 px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-teal-500/50 resize-none"
                placeholder="curl -X GET https://api.example.com/resource"
              />
              <div className="absolute top-2 right-2">
                <CopyToClipboardButton textToCopy={request.command} size="small" />
              </div>
            </div>
          </div>

          {/* Test Data */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Test Data (Optional)</label>
            <textarea
              value={request.testData ?? ''}
              onChange={(e) => onUpdate({ testData: e.target.value || undefined })}
              className="w-full h-20 px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-teal-500/50 resize-none"
              placeholder="Sample request body or parameters for testing"
            />
          </div>

          {/* Expected Response */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Expected Response (Optional)</label>
            <textarea
              value={request.expectedResponse ?? ''}
              onChange={(e) => onUpdate({ expectedResponse: e.target.value || undefined })}
              className="w-full h-20 px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-teal-500/50 resize-none"
              placeholder="Expected response format or values"
            />
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Handshake Editor Page Props
 */
interface HandshakeEditorPageProps {
  platformId: string;
  resourceId: string;
  handshakeId?: string; // If provided, editing existing; otherwise creating new
}

/**
 * Handshake Editor Page Component
 */
export const HandshakeEditorPage: React.FC<HandshakeEditorPageProps> = ({
  platformId,
  resourceId,
  handshakeId,
}) => {
  const { activeHandshake, setActiveHandshake, updateActiveHandshake, saveActiveHandshake, isDirty, getHandshakeById, createHandshake } = useHandshakeStore();
  const { ekgStatus, isExecuting, startExecution, addLog, completeExecution, failExecution } = useExecutionStore();
  const { showToast, showLogger } = useUiStore();

  // Initialize handshake
  useEffect(() => {
    if (handshakeId) {
      const existing = getHandshakeById(platformId, resourceId, handshakeId);
      setActiveHandshake(existing ?? null);
    } else {
      // Create new handshake template
      setActiveHandshake({
        id: crypto.randomUUID(),
        title: 'New Handshake',
        protocolType: 'curl-default',
        authenticationConfig: {},
        curlRequests: [],
      });
    }

    return () => setActiveHandshake(null);
  }, [handshakeId, platformId, resourceId, getHandshakeById, setActiveHandshake]);

  // Handle save
  const handleSave = async () => {
    if (!activeHandshake) return;

    try {
      if (handshakeId) {
        await saveActiveHandshake(platformId, resourceId);
      } else {
        const { id: _id, ...data } = activeHandshake;
        await createHandshake(platformId, resourceId, data);
      }
      showToast({ type: 'success', title: 'Handshake saved' });
    } catch (error) {
      showToast({ type: 'error', title: 'Failed to save', message: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  // Handle execute
  const handleExecute = async () => {
    if (!activeHandshake || isExecuting) return;

    const runId = startExecution(activeHandshake.id, resourceId, platformId);
    addLog(runId, { timestamp: new Date().toISOString(), level: 'SYSTEM', message: 'Starting handshake execution...' });

    // Simulated execution for now
    setTimeout(() => {
      addLog(runId, { timestamp: new Date().toISOString(), level: 'INFO', message: 'Executing requests...' });
      
      setTimeout(() => {
        const success = Math.random() > 0.3; // 70% success rate for demo
        if (success) {
          completeExecution(runId, {
            success: true,
            metrics: {
              startTime: new Date().toISOString(),
              endTime: new Date().toISOString(),
              totalDurationMs: 1500,
              statusCode: 200,
            },
            headers: { 'content-type': 'application/json' },
            responseBody: { status: 'ok', data: {} },
            logs: [],
          });
          showToast({ type: 'success', title: 'Execution completed' });
        } else {
          failExecution(runId, 'Request timeout');
          showToast({ type: 'error', title: 'Execution failed' });
        }
      }, 1500);
    }, 500);
  };

  // Add curl request
  const addCurlRequest = () => {
    if (!activeHandshake) return;
    
    const existingSerials = activeHandshake.curlRequests?.map(r => r.serial) ?? [];
    const nextSerial = existingSerials.length > 0 ? Math.max(...existingSerials) + 1 : 1;
    
    updateActiveHandshake({
      curlRequests: [
        ...(activeHandshake.curlRequests ?? []),
        {
          id: crypto.randomUUID(),
          serial: nextSerial,
          title: `Request ${nextSerial}`,
          command: 'curl -X GET "https://api.example.com/resource"',
        },
      ],
    });
  };

  if (!activeHandshake) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
        <div className="flex items-center gap-3">
          <EkgStatusIndicator status={ekgStatus} size="medium" />
          <div>
            <input
              type="text"
              value={activeHandshake.title}
              onChange={(e) => updateActiveHandshake({ title: e.target.value })}
              className="text-xl font-bold text-white bg-transparent focus:outline-none"
            />
            {isDirty && <span className="text-orange-400 text-sm ml-2">• Unsaved changes</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SecondaryButton onClick={() => window.history.back()} disabled={isExecuting}>
            Cancel
          </SecondaryButton>
          <PrimaryButton onClick={handleSave} disabled={isExecuting}>
            Save
          </PrimaryButton>
          <PrimaryButton onClick={handleExecute} loading={isExecuting}>
            Execute
          </PrimaryButton>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Basic Info */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Protocol Type</label>
            <select
              value={activeHandshake.protocolType}
              onChange={(e) => updateActiveHandshake({ protocolType: e.target.value as ProtocolType })}
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:border-teal-500/50"
            >
              {PROTOCOL_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <input
              type="text"
              value={activeHandshake.description ?? ''}
              onChange={(e) => updateActiveHandshake({ description: e.target.value || undefined })}
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:border-teal-500/50"
              placeholder="Brief description of this handshake"
            />
          </div>
        </div>

        {/* cURL Requests */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">cURL Requests</h2>
            <SecondaryButton size="small" onClick={addCurlRequest}>
              + Add Request
            </SecondaryButton>
          </div>
          
          <div className="space-y-3">
            {activeHandshake.curlRequests?.map((request, index) => (
              <CurlRequestEditor
                key={request.id}
                request={request}
                onUpdate={(updates) => {
                  const newRequests = [...(activeHandshake.curlRequests ?? [])];
                  newRequests[index] = { ...newRequests[index], ...updates };
                  updateActiveHandshake({ curlRequests: newRequests });
                }}
                onDelete={() => {
                  const newRequests = activeHandshake.curlRequests?.filter(r => r.id !== request.id);
                  updateActiveHandshake({ curlRequests: newRequests });
                }}
                onMoveUp={index > 0 ? () => {
                  const newRequests = [...(activeHandshake.curlRequests ?? [])];
                  [newRequests[index - 1], newRequests[index]] = [newRequests[index], newRequests[index - 1]];
                  newRequests.forEach((r, i) => r.serial = i + 1);
                  updateActiveHandshake({ curlRequests: newRequests });
                } : undefined}
                onMoveDown={index < (activeHandshake.curlRequests?.length ?? 0) - 1 ? () => {
                  const newRequests = [...(activeHandshake.curlRequests ?? [])];
                  [newRequests[index], newRequests[index + 1]] = [newRequests[index + 1], newRequests[index]];
                  newRequests.forEach((r, i) => r.serial = i + 1);
                  updateActiveHandshake({ curlRequests: newRequests });
                } : undefined}
              />
            ))}
            
            {(!activeHandshake.curlRequests || activeHandshake.curlRequests.length === 0) && (
              <div className="text-center py-8 bg-gray-800/30 rounded-lg border border-dashed border-gray-700">
                <p className="text-gray-500 mb-3">No cURL requests configured</p>
                <SecondaryButton onClick={addCurlRequest}>
                  Add Your First Request
                </SecondaryButton>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Logger Panel */}
      {showLogger && (
        <div className="border-t border-gray-700/50">
          <SystemLoggerDisplay maxHeight="200px" />
        </div>
      )}
    </div>
  );
};

export default HandshakeEditorPage;
