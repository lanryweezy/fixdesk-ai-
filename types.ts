
export enum TicketStatus {
  NEW = 'New',
  IN_PROGRESS = 'In Progress',
  RESOLVED = 'Resolved',
  NEEDS_ATTENTION = 'Needs Attention',
  AI_RESOLVED = 'AI Resolved'
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  reportedBy: string;
  assignedTo?: string;
  createdAt: string;
  resolution?: string;
  videoUrl?: string; // a mock url
  logs?: string[];
  priority: 'Low' | 'Medium' | 'High';
}

export interface AnalyticsData {
  totalTickets: number;
  resolvedTickets: number;
  automationRate: number;
  avgResolutionTime: string;
  commonIssues: { name: string; value: number }[];
  resolutionBy: { name: string; value: number }[];
}
