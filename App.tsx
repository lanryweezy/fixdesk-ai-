
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
import { GlobalAssistant } from './components/GlobalAssistant';
import { RemoteControlView } from './components/RemoteControlView';
import { StartRemoteSession } from './components/StartRemoteSession';
import { AutomationRules } from './components/AutomationRules';
import { Card } from './components/common/Card';
import { useToast } from './services/ToastContext';
import { Ticket, Activity, Solution } from './types';
import { BrainCircuit, ArrowUturnLeftIcon } from './components/icons/Icons';

export type Page = 'dashboard' | 'tickets' | 'remote' | 'start-remote-session' | 'knowledge-base' | 'settings' | 'kb-article' | 'automation-rules';

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
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isSSOLoading, setIsSSOLoading] = useState(false);

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
            if (storedSettings.geminiApiKey) setGeminiApiKey(storedSettings.geminiApiKey);

            // Show onboarding if no API key is set
            if (!storedSettings.geminiApiKey) {
                setShowOnboarding(true);
            }
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
        message: `Ticket created and auto-categorized as ${aiInsight.category} with ${aiInsight.priority} priority. Sentiment detected: ${aiInsight.sentiment || 'Neutral'}.`,
        user: 'FixDesk AI'
    };

    const ticket: Ticket = {
      ...newTicket,
      priority: aiInsight.priority,
      sentiment: aiInsight.sentiment || (newTicket as any).sentiment,
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
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <BrainCircuit className="w-8 h-8 text-brand-primary" />
                            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{selectedSolution.problemDescription}</h2>
                        </div>
                    </div>
                    <div className="prose dark:prose-invert max-w-none prose-indigo">
                        <ReactMarkdown>{selectedSolution.solutionDescription}</ReactMarkdown>
                    </div>

                    {selectedSolution.executableActions && selectedSolution.executableActions.length > 0 && (
                        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Quick Resolve Actions</h3>
                            <div className="grid grid-cols-1 gap-3">
                                {selectedSolution.executableActions.map((cmd, idx) => (
                                    <button
                                        key={idx}
                                        onClick={async () => {
                                            try {
                                                const { stdout, stderr } = await window.electronAPI.executeCommand([cmd]);
                                                if (stderr) addToast(`Error: ${stderr}`, 'error');
                                                else addToast(`Success: ${stdout || 'Command executed'}`, 'success');
                                            } catch (e) {
                                                addToast('Failed to execute command', 'error');
                                            }
                                        }}
                                        className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-brand-primary transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-brand-primary/10 rounded-lg group-hover:bg-brand-primary group-hover:text-white transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
                                                </svg>
                                            </div>
                                            <span className="font-mono text-xs text-slate-600 dark:text-slate-300">Run: <span className="font-bold">{cmd}</span></span>
                                        </div>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-slate-400 group-hover:text-brand-primary group-hover:translate-x-1 transition-all">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                        </svg>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
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
        return <TicketsList tickets={tickets} onSelectTicket={handleSelectTicket} role={role} userName={userName} onRefresh={refreshTickets} />;
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
                geminiApiKey={geminiApiKey}
                onRefreshData={async () => {
                    const settings = await window.electronAPI.getSettings();
                    setActiveWorkspaceId(settings.activeWorkspaceId);
                    setAiOpsPolicy(settings.aiOpsPolicy as any);
                    setAutoLaunch(settings.autoLaunch);
                    setGeminiApiKey(settings.geminiApiKey || '');
                    refreshTickets();
                }}
            />
        );
      case 'remote':
        return <RemoteControlView ticketId={remoteTicketId || undefined} />;
      case 'start-remote-session':
        return <StartRemoteSession ticketId={remoteTicketId || undefined} />;
      case 'automation-rules':
        return <AutomationRules />;
      default:
        return <Dashboard tickets={tickets} />;
    }
  };

  if (showOnboarding) {
    return (
        <div className={`flex items-center justify-center h-screen font-sans ${isDarkMode ? 'dark bg-slate-900' : 'bg-slate-100'}`}>
            <Card className="max-w-md w-full p-10 text-center shadow-2xl">
                <BrainCircuit className="w-16 h-16 text-brand-primary mx-auto mb-6" />
                <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-2 tracking-tight">Welcome to FixDesk AI</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8">Let's get your autonomous IT agent set up in a few seconds.</p>

                <div className="space-y-4">
                    <div className="text-left">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Gemini API Key</label>
                        <input
                            type="password"
                            placeholder="Enter your Google AI Studio key"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-slate-800 dark:text-slate-100"
                            onChange={(e) => setGeminiApiKey(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={async () => {
                            if (geminiApiKey.trim()) {
                                await window.electronAPI.updateSettings({ geminiApiKey: geminiApiKey.trim(), role: 'admin' });
                                setShowOnboarding(false);
                                addToast('Configuration complete!', 'success');
                            }
                        }}
                        disabled={!geminiApiKey.trim()}
                        className="w-full py-3.5 bg-brand-primary text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none hover:opacity-90 transition-all disabled:opacity-50"
                    >
                        Complete Setup
                    </button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200 dark:border-slate-700"></span></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-slate-800 px-2 text-slate-400 font-bold">Or</span></div>
                    </div>

                    <button
                        onClick={async () => {
                            setIsSSOLoading(true);
                            // Simulate SSO Auth Redirect & Callback
                            setTimeout(async () => {
                                await window.electronAPI.updateSettings({
                                    userName: 'Alex Smith (Enterprise)',
                                    activeWorkspaceId: 'ENTERPRISE_DOMAIN',
                                    role: 'staff'
                                });
                                setUserName('Alex Smith (Enterprise)');
                                setActiveWorkspaceId('ENTERPRISE_DOMAIN');
                                setRole('staff');
                                setIsSSOLoading(false);
                                setShowOnboarding(false);
                                addToast('Signed in via Enterprise SSO', 'success');
                            }, 2000);
                        }}
                        className="w-full py-3.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                    >
                        {isSSOLoading ? (
                            <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <div className="w-5 h-5 bg-slate-800 rounded flex items-center justify-center text-[10px] text-white font-black">ID</div>
                        )}
                        Sign in with Enterprise SSO
                    </button>

                    <p className="text-[10px] text-slate-400 mt-4">You can find your API key at <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-brand-primary hover:underline">Google AI Studio</a>.</p>
                </div>
            </Card>
        </div>
    );
  }

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
      <GlobalAssistant />
      {isModalOpen && <ReportIssueModal onClose={() => setIsModalOpen(false)} onTicketCreated={handleCreateTicket} />}
    </div>
  );
}
