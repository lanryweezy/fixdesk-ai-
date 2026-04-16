import { contextBridge, ipcRenderer } from 'electron';

// Whitelist of valid channels for IPC communication
const validChannels = [
    'desktop-capturer-get-sources',
    'robot-mouse-move',
    'robot-mouse-click',
    'robot-key-tap'
];

contextBridge.exposeInMainWorld('electronAPI', {
  // Screen recording (invoke for two-way communication)
  getScreenSources: (opts: any) => ipcRenderer.invoke('desktop-capturer-get-sources', opts),

  // Database operations
  getTickets: () => ipcRenderer.invoke('db-get-tickets'),
  createTicket: (ticket: any) => ipcRenderer.invoke('db-create-ticket', ticket),
  updateTicketStatus: (id: string, status: string) => ipcRenderer.invoke('db-update-ticket-status', id, status),
  updateTicket: (ticket: any) => ipcRenderer.invoke('db-update-ticket', ticket),
  getTicketById: (id: string) => ipcRenderer.invoke('db-get-ticket-by-id', id),
  executeCommand: (commands: string[]) => ipcRenderer.invoke('execute-command', commands),
  getSolutions: () => ipcRenderer.invoke('db-get-solutions'),
  createSolution: (solution: any) => ipcRenderer.invoke('db-create-solution', solution),
  findSolutions: (problemDescription: string) => ipcRenderer.invoke('db-find-solutions', problemDescription),
  upsertRemoteSession: (session: any) => ipcRenderer.invoke('db-upsert-remote-session', session),
  getRemoteSession: (ticketId: string) => ipcRenderer.invoke('db-get-remote-session', ticketId),
  deleteRemoteSession: (ticketId: string) => ipcRenderer.invoke('db-delete-remote-session', ticketId),
  getSettings: () => ipcRenderer.invoke('db-get-settings'),
  updateSettings: (settings: any) => ipcRenderer.invoke('db-update-settings', settings),
  generateMockData: () => ipcRenderer.invoke('db-generate-mock-data'),
  getSystemDiagnostics: () => ipcRenderer.invoke('get-system-diagnostics'),

  // AI actions
  categorizeAndPrioritize: (title: string, description: string) => ipcRenderer.invoke('ai-categorize-prioritize', { title, description }),
  askAboutTicket: (ticket: any, question: string) => ipcRenderer.invoke('ai-ask-about-ticket', { ticket, question }),
  draftAiResponse: (ticket: any) => ipcRenderer.invoke('ai-draft-response', ticket),
  summarizeTicket: (ticket: any) => ipcRenderer.invoke('ai-summarize-ticket', ticket),
  generateKbArticle: (ticket: any) => ipcRenderer.invoke('ai-generate-kb-article', ticket),
  getSystemHealth: (tickets: any) => ipcRenderer.invoke('ai-get-system-health', tickets),
  startConversation: (videoBase64: string, prompt: string) => ipcRenderer.invoke('ai-start-conversation', { videoBase64, prompt }),

  // Event Listeners
  onAIOpsNotification: (callback: any) => ipcRenderer.on('aiops-notification', (_event, data) => callback(data)),
  onNavigate: (callback: any) => ipcRenderer.on('navigate-to', (_event, page) => callback(page)),

  // Remote control actions (send for one-way communication)
  send: (channel: string, data: any) => {
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
});
