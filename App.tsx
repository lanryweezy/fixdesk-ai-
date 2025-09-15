
import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { TicketsList } from './components/TicketsList';
import { TicketDetail } from './components/TicketDetail';
import { ReportIssueModal } from './components/ReportIssueModal';
import { RemoteControlView } from './components/RemoteControlView';
import { StartRemoteSession } from './components/StartRemoteSession';
import { Ticket } from './types';
import { BrainCircuit } from './components/icons/Icons';

export type Page = 'dashboard' | 'tickets' | 'remote' | 'start-remote-session';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    const fetchTickets = async () => {
      const storedTickets = await window.electronAPI.getTickets();
      setTickets(storedTickets);
    };
    fetchTickets();
  }, []);

  const handleCreateTicket = async (newTicket: Omit<Ticket, 'id' | 'createdAt' | 'reportedBy'>) => {
    const ticket: Ticket = {
      ...newTicket,
      id: `TICK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      reportedBy: 'Alex Smith', // Mocked user
    };
    const createdTicket = await window.electronAPI.createTicket(ticket);
    setTickets(prevTickets => [createdTicket, ...prevTickets]);
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
      case 'start-remote-session':
        return <StartRemoteSession />;
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
