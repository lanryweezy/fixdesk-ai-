
import React, { useState, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
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
import { Card } from './components/common/Card';
import { useToast } from './services/ToastContext';
import { Ticket, Activity, Solution } from './types';
import { BrainCircuit, ArrowUturnLeftIcon } from './components/icons/Icons';

export type Page = 'dashboard' | 'tickets' | 'remote' | 'start-remote-session' | 'knowledge-base' | 'settings' | 'kb-article';

export default function App() {
  const { addToast } = useToast();
  const [page, setPage] = useState<Page>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedSolution, setSelectedSolution] = useState<Solution | null>(null);
  const [remoteTicketId, setRemoteTicketId] = useState<string | null>(null);
  const [role, setRole] = useState<'staff' | 'admin'>('admin');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userName, setUserName] = useState('Alex Smith');
  const [userAvatar, setUserAvatar] = useState('AS');
  const [activeWorkspaceId, setActiveWorkspaceId] = useState('DEFAULT');
  const [aiOpsPolicy, setAiOpsPolicy] = useState<'autonomous' | 'manual'>('manual');
  const [autoLaunch, setAutoLaunch] = useState(true);

  useEffect(() => {
    // Listen for AIOps events
    window.electronAPI.onAIOpsNotification((data) => {
        addToast(`${data.title}: ${data.message}`, 'success');
        refreshTickets(); // Refresh to show the new auto-generated ticket
    });

    window.electronAPI.onNavigate((target: string) => {
        if (target === 'report-issue') {
            setIsModalOpen(true);
        } else if (target === 'dashboard') {
            setPage('dashboard');
        }
    });

    const initApp = async () => {
        // Load tickets
        const storedTickets = await window.electronAPI.getTickets();
        setTickets(storedTickets);

        // Load settings
        const storedSettings = await window.electronAPI.getSettings();
        if (storedSettings) {
            setRole(storedSettings.role);
            setIsDarkMode(storedSettings.isDarkMode);
            if (storedSettings.userName) setUserName(storedSettings.userName);
            if (storedSettings.userAvatar) setUserAvatar(storedSettings.userAvatar);
            if (storedSettings.activeWorkspaceId) setActiveWorkspaceId(storedSettings.activeWorkspaceId);
            if (storedSettings.aiOpsPolicy) setAiOpsPolicy(storedSettings.aiOpsPolicy as any);
            if (storedSettings.autoLaunch !== undefined) setAutoLaunch(storedSettings.autoLaunch);
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
      reportedBy: userName,
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
    setSelectedSolution(null);
    setPage(prev => (prev === 'kb-article' ? 'knowledge-base' : prev));
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

  const handleUpdateProfile = useCallback(async (name: string) => {
    const avatar = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    setUserName(name);
    setUserAvatar(avatar);
    await window.electronAPI.updateSettings({ userName: name, userAvatar: avatar });
  }, []);

  const handleWorkspaceChange = useCallback(async (id: string) => {
    await window.electronAPI.updateSettings({ activeWorkspaceId: id });
    setActiveWorkspaceId(id);
    refreshTickets();
    addToast(`Switched to workspace: ${id}`, 'success');
  }, [refreshTickets, addToast]);

  const handleSelectSolution = useCallback((solution: Solution) => {
    setSelectedSolution(solution);
    setPage('kb-article');
  }, []);

  const renderPage = () => {
    if (page === 'kb-article' && selectedSolution) {
        return (
            <div className="max-w-4xl mx-auto">
                <button onClick={handleBackToList} className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-brand-primary mb-6 transition-colors">
                    <ArrowUturnLeftIcon className="w-5 h-5" />
                    Back to Knowledge Base
                </button>
                <Card className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <BrainCircuit className="w-8 h-8 text-brand-primary" />
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{selectedSolution.problemDescription}</h2>
                    </div>
                    <div className="prose dark:prose-invert max-w-none prose-indigo">
                        <ReactMarkdown>{selectedSolution.solutionDescription}</ReactMarkdown>
                    </div>
                </Card>
            </div>
        );
    }
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
        return <KnowledgeBase role={role} onSelectSolution={handleSelectSolution} />;
      case 'settings':
        return (
            <Settings
                role={role}
                onRoleToggle={handleRoleToggle}
                isDarkMode={isDarkMode}
                onDarkModeToggle={handleDarkModeToggle}
                userName={userName}
                onUpdateProfile={handleUpdateProfile}
                activeWorkspaceId={activeWorkspaceId}
                aiOpsPolicy={aiOpsPolicy}
                autoLaunch={autoLaunch}
                onRefreshData={async () => {
                    const settings = await window.electronAPI.getSettings();
                    setActiveWorkspaceId(settings.activeWorkspaceId);
                    setAiOpsPolicy(settings.aiOpsPolicy as any);
                    setAutoLaunch(settings.autoLaunch);
                    refreshTickets();
                }}
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
        userName={userName}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
            role={role}
            userName={userName}
            userAvatar={userAvatar}
            activeWorkspaceId={activeWorkspaceId}
            onWorkspaceChange={handleWorkspaceChange}
        />
        <main className="flex-1 overflow-y-auto p-8">
          {renderPage()}
        </main>
      </div>
      {isModalOpen && <ReportIssueModal onClose={() => setIsModalOpen(false)} onTicketCreated={handleCreateTicket} />}
    </div>
  );
}
