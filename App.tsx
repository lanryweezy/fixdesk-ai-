
import React, { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { TicketsList } from './components/TicketsList';
import { TicketDetail } from './components/TicketDetail';
import { ReportIssueModal } from './components/ReportIssueModal';
import { RemoteControlView } from './components/RemoteControlView';
import { Ticket } from './types';
import { mockTickets } from './constants';
import { BrainCircuit } from './components/icons/Icons';

type Page = 'dashboard' | 'tickets' | 'remote';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const handleCreateTicket = (newTicket: Omit<Ticket, 'id' | 'createdAt' | 'reportedBy'>) => {
    const ticket: Ticket = {
      ...newTicket,
      id: `TICK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      reportedBy: 'Alex Smith', // Mocked user
    };
    setTickets(prevTickets => [ticket, ...prevTickets]);
    setIsModalOpen(false);
    setPage('tickets');
    setSelectedTicket(ticket);
  };

  const handleSelectTicket = useCallback((ticket: Ticket) => {
    setSelectedTicket(ticket);
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedTicket(null);
  }, []);
  
  const renderPage = () => {
    if (page === 'tickets' && selectedTicket) {
      return <TicketDetail ticket={selectedTicket} onBack={handleBackToList} />;
    }
    switch (page) {
      case 'dashboard':
        return <Dashboard tickets={tickets} />;
      case 'tickets':
        return <TicketsList tickets={tickets} onSelectTicket={handleSelectTicket} />;
      case 'remote':
        return <RemoteControlView />;
      default:
        return <Dashboard tickets={tickets} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      <Sidebar currentPage={page} setPage={setPage} onReportIssue={() => setIsModalOpen(true)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-8">
          {renderPage()}
        </main>
      </div>
      {isModalOpen && <ReportIssueModal onClose={() => setIsModalOpen(false)} onTicketCreated={handleCreateTicket} />}
    </div>
  );
}
