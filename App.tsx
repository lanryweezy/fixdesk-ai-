
import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { TicketsList } from './components/TicketsList';
import { TicketDetail } from './components/TicketDetail';
import { KnowledgeBase } from './components/KnowledgeBase';
import { Settings } from './components/Settings';
import { ReportIssueModal } from './components/ReportIssueModal';
import { RemoteControlView } from './components/RemoteControlView';
import { StartRemoteSession } from './components/StartRemoteSession';
import { Ticket, Activity } from './types';
import { BrainCircuit } from './components/icons/Icons';

export type Page = 'dashboard' | 'tickets' | 'remote' | 'start-remote-session' | 'knowledge-base' | 'settings';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [remoteTicketId, setRemoteTicketId] = useState<string | null>(null);
  const [role, setRole] = useState<'staff' | 'admin'>('admin');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const initApp = async () => {
        // Load tickets
        const storedTickets = await window.electronAPI.getTickets();
        setTickets(storedTickets);

        // Load settings
        const storedSettings = await window.electronAPI.getSettings();
        if (storedSettings) {
            setRole(storedSettings.role);
            setIsDarkMode(storedSettings.isDarkMode);
        }
    };
    initApp();
  }, []);

  const handleCreateTicket = async (newTicket: Omit<Ticket, 'id' | 'createdAt' | 'reportedBy'>) => {
    // AI Auto-categorization
    const aiInsight = await window.electronAPI.categorizeAndPrioritize(newTicket.title, newTicket.description);

    // Diagnostic collection
    const diagnostics = await window.electronAPI.getSystemDiagnostics();
    const diagnosticLog = diagnostics.error
        ? 'Failed to gather system diagnostics.'
        : `System Diagnostics: ${diagnostics.distro} (${diagnostics.release}), ${diagnostics.cpuModel}, ${diagnostics.totalMemory} RAM, Uptime: ${diagnostics.uptime}`;

    const initialActivity: Activity = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        type: 'note',
        message: `Ticket created and auto-categorized as ${aiInsight.category} with ${aiInsight.priority} priority.`,
        user: 'FixDesk AI'
    };

    const ticket: Ticket = {
      ...newTicket,
      priority: aiInsight.priority,
      title: `${aiInsight.category}: ${newTicket.title}`,
      id: `TICK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      reportedBy: 'Alex Smith', // Mocked user
      activities: [initialActivity],
      logs: [diagnosticLog]
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

  const refreshTickets = useCallback(async () => {
    const storedTickets = await window.electronAPI.getTickets();
    setTickets(storedTickets);
  }, []);

  const handleBackToList = useCallback(async () => {
    setSelectedTicket(null);
    refreshTickets();
  }, [refreshTickets]);
  
  const handleTicketUpdate = useCallback((updatedTicket: Ticket) => {
    setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
    setSelectedTicket(updatedTicket);
  }, []);

  const handleRequestRemote = useCallback((ticketId: string) => {
    setRemoteTicketId(ticketId);
    setPage('start-remote-session');
  }, []);

  const handleRoleToggle = useCallback(async () => {
    const newRole = role === 'admin' ? 'staff' : 'admin';
    setRole(newRole);
    await window.electronAPI.updateSettings({ role: newRole });
  }, [role]);

  const handleDarkModeToggle = useCallback(async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    await window.electronAPI.updateSettings({ isDarkMode: newMode });
  }, [isDarkMode]);

  const renderPage = () => {
    if (page === 'tickets' && selectedTicket) {
      return <TicketDetail
        ticket={selectedTicket}
        onBack={handleBackToList}
        onUpdate={handleTicketUpdate}
        onRequestRemote={handleRequestRemote}
        role={role}
      />;
    }
    switch (page) {
      case 'dashboard':
        return <Dashboard tickets={tickets} role={role} />;
      case 'tickets':
        return <TicketsList tickets={tickets} onSelectTicket={handleSelectTicket} role={role} onRefresh={refreshTickets} />;
      case 'knowledge-base':
        return <KnowledgeBase role={role} />;
      case 'settings':
        return (
            <Settings
                role={role}
                onRoleToggle={handleRoleToggle}
                isDarkMode={isDarkMode}
                onDarkModeToggle={handleDarkModeToggle}
            />
        );
      case 'remote':
        return <RemoteControlView ticketId={remoteTicketId || undefined} />;
      case 'start-remote-session':
        return <StartRemoteSession ticketId={remoteTicketId || undefined} />;
      default:
        return <Dashboard tickets={tickets} />;
    }
  };

  return (
    <div className={`flex h-screen font-sans ${isDarkMode ? 'dark bg-slate-900 text-slate-100' : 'bg-slate-100 text-slate-800'}`}>
      <Sidebar
        currentPage={page}
        setPage={setPage}
        onReportIssue={() => setIsModalOpen(true)}
        role={role}
        onRoleToggle={handleRoleToggle}
        tickets={tickets}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header role={role} />
        <main className="flex-1 overflow-y-auto p-8">
          {renderPage()}
        </main>
      </div>
      {isModalOpen && <ReportIssueModal onClose={() => setIsModalOpen(false)} onTicketCreated={handleCreateTicket} />}
    </div>
  );
}
