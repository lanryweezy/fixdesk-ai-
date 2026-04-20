
export enum TicketStatus {
  NEW = 'New',
  IN_PROGRESS = 'In Progress',
  RESOLVED = 'Resolved',
  NEEDS_ATTENTION = 'Needs Attention',
  AI_RESOLVED = 'AI Resolved',
  SELF_HEALED = 'Self-Healed'
}

export interface Activity {
    id: string;
    timestamp: string;
    type: 'status_change' | 'assignment' | 'note' | 'resolution';
    message: string;
    user: string;
}

export interface Ticket {
  id: string;
  workspaceId?: string;
  title: string;
  description: string;
  status: TicketStatus;
  reportedBy: string;
  assignedTo?: string;
  createdAt: string;
  resolution?: string;
  mitigationCommand?: string;
  videoUrl?: string; // a mock url
  logs?: string[];
  priority: 'Low' | 'Medium' | 'High';
  sentiment?: 'Frustrated' | 'Neutral' | 'Positive';
  activities?: Activity[];
  attachments?: { name: string; url: string }[];
  customFields?: Record<string, any>;
  slaDeadline?: string;
  slaStatus?: 'Met' | 'Breached' | 'Warning';
}

export interface CustomFieldDefinition {
  id: string;
  workspaceId: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'dropdown';
  options?: string[];
  isRequired: boolean;
}

export interface SLAPolicy {
  id: string;
  workspaceId: string;
  name: string;
  priority: 'Low' | 'Medium' | 'High';
  responseTimeHours: number;
  resolutionTimeHours: number;
}

export interface LicenseInfo {
  status: 'trial' | 'active' | 'expired' | 'revoked';
  licenseKey: string;
  expiryDate: string;
  seats: number;
  activatedAt?: string;
}

export interface BackupConfig {
  autoBackupEnabled: boolean;
  frequency: 'daily' | 'weekly';
  lastBackupAt?: string;
  retentionDays: number;
  provider: 'local' | 's3';
}

export interface RecordedAction {
  type: 'move' | 'click' | 'key';
  payload: any;
}

export interface Solution {
  id: string;
  workspaceId?: string;
  problemDescription: string;
  solutionDescription: string;
  tags?: string[];
  actions?: RecordedAction[];
  executableActions?: string[]; // New: whitelisted shell commands
}

export interface AnalyticsData {
  totalTickets: number;
  resolvedTickets: number;
  automationRate: number;
  avgResolutionTime: string;
  commonIssues: { name: string; value: number }[];
  resolutionBy: { name: string; value: number }[];
}

export interface RemoteSession {
  ticketId: string;
  offer?: string;
  answer?: string;
  updatedAt: string;
}

export interface AnalysisResult {
  title: string;
  description: string;
  resolution: string | null;
  status: TicketStatus;
  priority: 'Low' | 'Medium' | 'High';
  suggestedScript?: string[];
}

export type ConversationResult = {
  type: 'analysis';
  data: AnalysisResult;
} | {
  type: 'question';
  question: string;
} | {
  type: 'error';
  message: string;
};

// --- AIOps Automation Rules Engine Types ---

export type AutomationTrigger = 'TICKET_CREATED' | 'SYSTEM_METRIC_THRESHOLD' | 'USER_SENTIMENT_NEGATIVE' | 'SCHEDULED';

export type AutomationAction = 'EXECUTE_SHELL' | 'ASSIGN_TICKET' | 'POST_NOTE' | 'SET_PRIORITY' | 'RESOLVE_TICKET';

export interface AutomationRule {
    id: string;
    workspaceId: string;
    name: string;
    description: string;
    isEnabled: boolean;
    trigger: AutomationTrigger;
    conditions: {
        field: string;
        operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
        value: any;
    }[];
    actions: {
        type: AutomationAction;
        params: Record<string, any>;
    }[];
    executionCount: number;
    lastExecutedAt?: string;
}
