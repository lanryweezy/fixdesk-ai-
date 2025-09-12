
import React from 'react';
import { Ticket, TicketStatus } from '../types';
import { Card } from './common/Card';
import { CogIcon } from './icons/Icons';

const StatusBadge: React.FC<{ status: TicketStatus }> = ({ status }) => {
  const baseClasses = 'px-2.5 py-0.5 text-xs font-semibold rounded-full inline-block';
  const statusClasses = {
    [TicketStatus.NEW]: 'bg-blue-100 text-blue-800',
    [TicketStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800',
    [TicketStatus.RESOLVED]: 'bg-green-100 text-green-800',
    [TicketStatus.AI_RESOLVED]: 'bg-purple-100 text-purple-800',
    [TicketStatus.NEEDS_ATTENTION]: 'bg-red-100 text-red-800',
  };
  return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
};

const PriorityBadge: React.FC<{ priority: 'Low' | 'Medium' | 'High' }> = ({ priority }) => {
    const priorityClasses = {
        'Low': 'text-slate-500',
        'Medium': 'text-amber-600',
        'High': 'text-red-600'
    };
    return <span className={`font-medium ${priorityClasses[priority]}`}>{priority}</span>
}

interface TicketItemProps {
  ticket: Ticket;
  onSelect: (ticket: Ticket) => void;
}

const TicketItem: React.FC<TicketItemProps> = ({ ticket, onSelect }) => {
  const date = new Date(ticket.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric'
  });

  return (
    <div
      onClick={() => onSelect(ticket)}
      className="bg-white border border-slate-200 rounded-lg p-4 cursor-pointer hover:shadow-lg hover:border-brand-primary transition-all duration-200 flex flex-col justify-between"
    >
        <div>
            <div className="flex justify-between items-start">
                <StatusBadge status={ticket.status} />
                <span className="text-xs text-slate-400">{date}</span>
            </div>
            <h3 className="font-semibold text-slate-800 mt-2 truncate">{ticket.title}</h3>
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{ticket.description}</p>
        </div>
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
            <div className="text-sm text-slate-600">
                <span className="font-medium">{ticket.reportedBy}</span>
            </div>
            <div className='flex items-center gap-4'>
                <PriorityBadge priority={ticket.priority} />
                {ticket.status === TicketStatus.AI_RESOLVED && <CogIcon className="w-5 h-5 text-purple-500" title="Resolved by AI" />}
            </div>
        </div>
    </div>
  );
};


interface TicketsListProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
}

export const TicketsList: React.FC<TicketsListProps> = ({ tickets, onSelectTicket }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-800">My Tickets</h2>
        {/* Future filter buttons can go here */}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {tickets.map((ticket) => (
          <TicketItem key={ticket.id} ticket={ticket} onSelect={onSelectTicket} />
        ))}
      </div>
    </div>
  );
};
