import { Ticket } from './types';

export interface ElectronApi {
    getScreenSources: (opts: { types: Array<'screen' | 'window'> }) => Promise<Electron.DesktopCapturerSource[]>;
    send: (channel: string, data: any) => void;
    getTickets: () => Promise<Ticket[]>;
    createTicket: (ticket: Ticket) => Promise<Ticket>;
      updateTicketStatus: (id: string, status: TicketStatus) => Promise<Ticket>;
      updateTicket: (ticket: Ticket) => Promise<Ticket>;
    getTicketById: (id: string) => Promise<Ticket | undefined>;
    executeCommand: (commands: string[]) => Promise<{ stdout: string; stderr: string }>;
    getSystemMetrics: () => Promise<{ cpuUsage: number; memUsage: number; diskUsage: number }>;
    getSolutions: () => Promise<Solution[]>;
    createSolution: (solution: Omit<Solution, 'id'>) => Promise<Solution>;
    findSolutions: (problemDescription: string) => Promise<Solution[]>;
    upsertRemoteSession: (session: RemoteSession) => Promise<RemoteSession>;
    getRemoteSession: (ticketId: string) => Promise<RemoteSession | undefined>;
    deleteRemoteSession: (ticketId: string) => Promise<void>;
    getSettings: () => Promise<{ role: 'staff' | 'admin', isDarkMode: boolean, userName: string, userAvatar: string, activeWorkspaceId: string, aiOpsPolicy: string, autoLaunch: boolean, geminiApiKey?: string }>;
    updateSettings: (settings: Partial<{ role: 'staff' | 'admin', isDarkMode: boolean, userName: string, userAvatar: string, activeWorkspaceId: string, aiOpsPolicy: string, autoLaunch: boolean, geminiApiKey?: string }>) => Promise<{ role: 'staff' | 'admin', isDarkMode: boolean, userName: string, userAvatar: string, activeWorkspaceId: string, aiOpsPolicy: string, autoLaunch: boolean, geminiApiKey?: string }>;
    generateMockData: () => Promise<boolean>;
    exportSupportBundle: () => Promise<boolean>;
    exportAuditReport: () => Promise<boolean>;
    getAuditLogs: () => Promise<any[]>;
    getSystemDiagnostics: () => Promise<any>;
    aiChat: (message: string, history: any[], screenshot?: string) => Promise<string>;
    categorizeAndPrioritize: (title: string, description: string) => Promise<{ priority: 'Low' | 'Medium' | 'High', category: string }>;
    askAboutTicket: (ticket: Ticket, question: string) => Promise<string>;
    draftAiResponse: (ticket: Ticket) => Promise<string>;
    summarizeTicket: (ticket: Ticket) => Promise<string>;
    generateKbArticle: (ticket: Ticket) => Promise<string>;
    getSystemHealth: (tickets: Ticket[]) => Promise<{ status: string, summary: string, risks: string[] }>;
    rootCauseAnalysis: (ticket: Ticket) => Promise<string>;
    parseSearchQuery: (query: string) => Promise<{ status: any, priority: any, category: any, timeRange: any, keyword: any }>;
    analyzeSupportBundle: () => Promise<{ analysis: string, fileName: string } | null>;
    startConversation: (videoBase64: string, prompt: string) => Promise<any>;
    onAIOpsNotification: (callback: (data: { title: string, message: string }) => void) => void;
}

declare global {
    interface Window {
        electronAPI: ElectronApi;
    }
}
