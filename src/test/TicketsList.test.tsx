import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TicketsList } from '../../components/TicketsList';
import { TicketStatus, Ticket } from '../../types';

const mockTickets: Ticket[] = [
  {
    id: 'T1',
    workspaceId: 'DEFAULT',
    title: 'VPN issue',
    description: 'Cannot connect',
    status: TicketStatus.NEW,
    priority: 'High',
    reportedBy: 'Alex Smith',
    createdAt: new Date().toISOString()
  },
  {
    id: 'T2',
    workspaceId: 'DEFAULT',
    title: 'Hardware fail',
    description: 'Screen broken',
    status: TicketStatus.IN_PROGRESS,
    priority: 'Low',
    reportedBy: 'Jane Doe',
    createdAt: new Date().toISOString()
  }
];

describe('TicketsList Component', () => {
  it('renders all tickets initially for admin', () => {
    render(<TicketsList tickets={mockTickets} onSelectTicket={vi.fn()} role="admin" />);
    expect(screen.getByText('VPN issue')).toBeInTheDocument();
    expect(screen.getByText('Hardware fail')).toBeInTheDocument();
  });

  it('filters tickets for staff to only show their own', () => {
    render(<TicketsList tickets={mockTickets} onSelectTicket={vi.fn()} role="staff" />);
    expect(screen.getByText('VPN issue')).toBeInTheDocument();
    expect(screen.queryByText('Hardware fail')).not.toBeInTheDocument();
  });

  it('filters tickets based on search term', () => {
    render(<TicketsList tickets={mockTickets} onSelectTicket={vi.fn()} role="admin" />);
    const searchInput = screen.getByPlaceholderText(/Ask AI/i);
    fireEvent.change(searchInput, { target: { value: 'Hardware' } });
    expect(screen.queryByText('VPN issue')).not.toBeInTheDocument();
    expect(screen.getByText('Hardware fail')).toBeInTheDocument();
  });
});
