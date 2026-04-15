
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
  activities?: Activity[];
  attachments?: { name: string; url: string }[];
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
  actions: RecordedAction[];
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
