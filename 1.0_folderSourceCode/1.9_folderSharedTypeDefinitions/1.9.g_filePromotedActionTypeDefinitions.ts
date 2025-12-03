// ============================================
// PROTOCOL OS - PROMOTED ACTION TYPE DEFINITIONS
// ============================================
// Address: 1.9.g
// Purpose: Define PromotedAction types for quick-access operations
// ============================================

/**
 * Action trigger type - what initiates this action
 */
export type ActionTriggerType =
  | 'button'      // User clicks a button
  | 'schedule'    // Runs on a schedule
  | 'webhook'     // Triggered by external webhook
  | 'chain'       // Triggered by another action completing
  | 'startup';    // Runs when app loads

/**
 * Action status tracking
 */
export type ActionStatus =
  | 'idle'        // Not running
  | 'pending'     // Queued to run
  | 'running'     // Currently executing
  | 'success'     // Last run succeeded
  | 'failed';     // Last run failed

/**
 * Execution log entry for an action
 */
export interface ActionLogEntry {
  /** Timestamp of the log entry */
  timestamp: string;
  
  /** Log level */
  level: 'info' | 'warn' | 'error' | 'success';
  
  /** Log message */
  message: string;
  
  /** Additional data (if any) */
  data?: unknown;
}

/**
 * PromotedAction represents a quick-access operation.
 * These appear as prominent buttons/cards for frequently used operations.
 * 
 * Serial Format: PROMO-XXXX
 */
export interface PromotedAction {
  /** Unique identifier (UUID format) */
  id: string;
  
  /** Serial number segment */
  serial: string;
  
  /** Display name for this action */
  name: string;
  
  /** Description of what this action does */
  description: string;
  
  /** Icon to display (emoji or icon class) */
  icon: string;
  
  /** How this action is triggered */
  triggerType: ActionTriggerType;
  
  /** Current status of this action */
  status: ActionStatus;
  
  /** 
   * Reference to the cURL request or schema model to execute.
   * Format: 'curl:{id}' or 'schema:{id}'
   */
  executionRef: string;
  
  /** Pre-filled input value (optional) */
  prefilledInput?: string;
  
  /** Whether to show in the promoted actions panel */
  isVisible: boolean;
  
  /** Display order (lower = first) */
  order: number;
  
  /** Last execution timestamp */
  lastExecutedAt?: string;
  
  /** Last execution duration in ms */
  lastExecutionDuration?: number;
  
  /** Execution log history */
  executionLog: ActionLogEntry[];
  
  /** Maximum log entries to keep */
  maxLogEntries: number;
  
  /** Chain configuration (for 'chain' trigger type) */
  chainConfig?: {
    /** Action ID that triggers this one */
    triggeredBy: string;
    /** Only trigger if parent succeeded */
    onlyOnSuccess: boolean;
    /** Delay before executing (ms) */
    delayMs: number;
  };
  
  /** Schedule configuration (for 'schedule' trigger type) */
  scheduleConfig?: {
    /** Cron expression */
    cron: string;
    /** Timezone */
    timezone: string;
    /** Whether schedule is active */
    enabled: boolean;
  };
}

/**
 * Partial PromotedAction for updates
 */
export type PromotedActionUpdate = Partial<Omit<PromotedAction, 'id'>> & { id: string };

/**
 * PromotedAction creation payload
 */
export type PromotedActionCreate = Omit<PromotedAction, 'id' | 'serial' | 'executionLog' | 'status'>;

/**
 * Default values for new PromotedAction
 */
export const DEFAULT_PROMOTED_ACTION: Omit<PromotedAction, 'id' | 'serial'> = {
  name: 'New Action',
  description: 'Description of this action',
  icon: '⚡',
  triggerType: 'button',
  status: 'idle',
  executionRef: '',
  isVisible: true,
  order: 0,
  executionLog: [],
  maxLogEntries: 50,
};

/**
 * PromotedAction with parent handshake context
 */
export interface PromotedActionWithContext extends PromotedAction {
  parentHandshakeId: string;
  parentHandshakeSerial: string;
}

/**
 * Action execution request
 */
export interface ActionExecutionRequest {
  /** The action to execute */
  actionId: string;
  
  /** Override input (if different from prefilled) */
  inputOverride?: string;
  
  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Action execution result
 */
export interface ActionExecutionResult {
  /** The action that was executed */
  actionId: string;
  
  /** Whether execution succeeded */
  success: boolean;
  
  /** Execution duration in ms */
  durationMs: number;
  
  /** Response data (if any) */
  responseData?: unknown;
  
  /** Error message (if failed) */
  errorMessage?: string;
  
  /** Timestamp of execution */
  executedAt: string;
}
