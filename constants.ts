import { Ticket, TicketStatus, AnalyticsData } from './types';

export const mockAnalyticsData: AnalyticsData = {
  totalTickets: 238,
  resolvedTickets: 215,
  automationRate: 62,
  avgResolutionTime: '3h 45m',
  commonIssues: [
    { name: 'VPN/Connectivity', value: 45 },
    { name: 'Password Resets', value: 38 },
    { name: 'Software Access', value: 29 },
    { name: 'Printer Issues', value: 21 },
    { name: 'Hardware Failure', value: 15 },
  ],
  resolutionBy: [
    { name: 'FixDesk AI', value: 133 },
    { name: 'IT Support Team', value: 82 },
  ],
};
