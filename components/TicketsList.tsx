
import React, { useState } from 'react';
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
  role?: 'staff' | 'admin';
}

export const TicketsList: React.FC<TicketsListProps> = ({ tickets, onSelectTicket, role = 'admin' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'All'>('All');
  const [priorityFilter, setPriorityFilter] = useState<'Low' | 'Medium' | 'High' | 'All'>('All');
  const [selectedTicketIds, setSelectedTicketIds] = useState<Set<string>>(new Set());

  const filteredTickets = tickets.filter(ticket => {
    // Role-based visibility: Staff only see their own tickets
    const matchesRole = role === 'admin' || ticket.reportedBy === 'Alex Smith'; // Mocked current user

    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ticket.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || ticket.priority === priorityFilter;
    return matchesRole && matchesSearch && matchesStatus && matchesPriority;
  });

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedTicketIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedTicketIds(newSelected);
  };

  const handleBulkStatusChange = async (status: TicketStatus) => {
    // In a real app, this would be a bulk IPC call
    for (const id of selectedTicketIds) {
        await window.electronAPI.updateTicketStatus(id, status);
    }
    setSelectedTicketIds(new Set());
    // The parent App.tsx will need to refresh tickets, or we just notify.
    // For now, assume a refresh happens on back or we could pass a refresh prop.
  };

  return (
    <div className="space-y-6 relative pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-3xl font-bold text-slate-800">My Tickets</h2>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <input
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary min-w-[200px] flex-1 md:flex-none"
            />
            <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
                <option value="All">All Statuses</option>
                {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
             <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as any)}
                className="px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
                <option value="All">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
            </select>
        </div>
      </div>

      {filteredTickets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredTickets.map((ticket) => (
                <div key={ticket.id} className="relative group">
                    {role === 'admin' && (
                        <div
                            onClick={(e) => toggleSelect(ticket.id, e)}
                            className={`absolute top-3 left-3 z-10 w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-all ${
                                selectedTicketIds.has(ticket.id) ? 'bg-brand-primary border-brand-primary' : 'bg-white/50 border-slate-300 opacity-0 group-hover:opacity-100'
                            }`}
                        >
                            {selectedTicketIds.has(ticket.id) && (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3.5 h-3.5 text-white">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg>
                            )}
                        </div>
                    )}
                    <TicketItem ticket={ticket} onSelect={onSelectTicket} />
                </div>
            ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-500">No tickets found matching your criteria.</p>
        </div>
      )}

      {selectedTicketIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 z-50 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-3 pr-6 border-r border-slate-700">
                <span className="bg-brand-primary text-[10px] font-bold px-2 py-0.5 rounded-full">{selectedTicketIds.size}</span>
                <span className="text-sm font-medium">Tickets Selected</span>
            </div>
            <div className="flex items-center gap-4">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Bulk Actions:</p>
                <select
                    onChange={(e) => handleBulkStatusChange(e.target.value as TicketStatus)}
                    className="bg-slate-800 border-none rounded-lg text-xs font-bold px-3 py-1.5 focus:ring-2 focus:ring-brand-primary outline-none"
                >
                    <option value="">Update Status...</option>
                    {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button
                    onClick={() => setSelectedTicketIds(new Set())}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                    Clear
                </button>
            </div>
        </div>
      )}
    </div>
  );
};
