import { describe, it, expect } from 'vitest';
import { Ticket, TicketStatus, Activity } from '../../types';

describe('Analytics Calculations', () => {
  it('should correctly calculate average resolution time', () => {
    const mockTickets: Partial<Ticket>[] = [
      {
        id: '1',
        createdAt: '2024-01-01T10:00:00.000Z',
        status: TicketStatus.RESOLVED,
        activities: [
          { id: 'a1', timestamp: '2024-01-01T12:00:00.000Z', type: 'resolution', message: 'Fixed', user: 'Admin' } as Activity
        ]
      },
      {
        id: '2',
        createdAt: '2024-01-01T10:00:00.000Z',
        status: TicketStatus.RESOLVED,
        activities: [
          { id: 'a2', timestamp: '2024-01-01T14:00:00.000Z', type: 'resolution', message: 'Fixed', user: 'Admin' } as Activity
        ]
      }
    ];

    // Calculation logic from Dashboard.tsx
    const resolved = mockTickets.filter(t => t.status === TicketStatus.RESOLVED);
    let totalResTime = 0;
    resolved.forEach(t => {
        const resolutionActivity = (t.activities || []).find(a => a.type === 'resolution');
        if (resolutionActivity) {
            const start = new Date(t.createdAt!).getTime();
            const end = new Date(resolutionActivity.timestamp).getTime();
            totalResTime += (end - start);
        }
    });
    const avgResMs = resolved.length > 0 ? totalResTime / resolved.length : 0;
    const avgResHours = Math.round((avgResMs / (1000 * 60 * 60)) * 10) / 10;

    // (2h + 4h) / 2 = 3h
    expect(avgResHours).toBe(3);
  });
});
