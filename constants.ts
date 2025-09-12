
import { Ticket, TicketStatus, AnalyticsData } from './types';

export const mockTickets: Ticket[] = [
  {
    id: 'TICK-A4B3C2D1',
    title: 'VPN keeps disconnecting on new Macbook',
    description: 'User reports that their VPN connection drops every 5-10 minutes. This started happening after the latest OS update. Have tried restarting the machine and reinstalling the VPN client.',
    status: TicketStatus.NEEDS_ATTENTION,
    reportedBy: 'Emily White',
    assignedTo: 'IT Support',
    createdAt: '2024-07-21T14:30:00Z',
    priority: 'High',
    logs: [
      '14:30:15 - Ticket created.',
      '14:31:02 - AI Analysis: Pattern matches known issue with macOS Sonoma and Cisco AnyConnect.',
      '14:31:45 - Suggested Fix: Update to latest client version 4.10.05095.',
      '14:35:10 - User reported fix did not work. Escalating to human support.',
    ],
  },
  {
    id: 'TICK-X9Y8Z7W6',
    title: 'Cannot access shared drive "Marketing"',
    description: 'When trying to open the "Marketing" shared drive, I get a "permission denied" error. I was able to access it yesterday.',
    status: TicketStatus.IN_PROGRESS,
    reportedBy: 'John Doe',
    assignedTo: 'Jane Smith',
    createdAt: '2024-07-21T11:05:00Z',
    priority: 'Medium',
  },
  {
    id: 'TICK-F5G4H3J2',
    title: 'Outlook login loop issue',
    description: 'Outlook repeatedly asks for my password, even after entering it correctly. Clearing cache via the app did not solve it.',
    status: TicketStatus.AI_RESOLVED,
    reportedBy: 'Sarah Connor',
    createdAt: '2024-07-20T09:15:00Z',
    resolution: 'AI triggered a script to clear the credential manager cache for Office 365 and refresh the OAuth token. User confirmed the issue is resolved.',
    priority: 'Medium',
    videoUrl: 'https://mock.url/video.mp4'
  },
  {
    id: 'TICK-K1L2M3N4',
    title: 'Printer "HP_LaserJet_4th_Floor" is offline',
    description: 'The main printer on the 4th floor is showing as offline for everyone in my department. We have tried restarting it.',
    status: TicketStatus.RESOLVED,
    reportedBy: 'Michael Brown',
    assignedTo: 'Jane Smith',
    createdAt: '2024-07-19T16:45:00Z',
    resolution: 'The printer\'s network cable was unplugged. Reconnected it and power-cycled the device. It is now back online.',
    priority: 'Low',
  },
  {
    id: 'TICK-P9O8I7U6',
    title: 'Slow performance in Figma desktop app',
    description: 'Figma is running extremely slow and lagging, especially in large files. Internet connection seems fine for all other apps.',
    status: TicketStatus.NEW,
    reportedBy: 'Chris Green',
    createdAt: '2024-07-22T09:00:00Z',
    priority: 'Medium',
  }
];

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
