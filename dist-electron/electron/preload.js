"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Whitelist of valid channels for IPC communication
const validChannels = [
    'desktop-capturer-get-sources',
    'robot-mouse-move',
    'robot-mouse-click',
    'robot-key-tap'
];
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Screen recording (invoke for two-way communication)
    getScreenSources: (opts) => electron_1.ipcRenderer.invoke('desktop-capturer-get-sources', opts),
    // Database operations
    getTickets: () => electron_1.ipcRenderer.invoke('db-get-tickets'),
    createTicket: (ticket) => electron_1.ipcRenderer.invoke('db-create-ticket', ticket),
    updateTicketStatus: (id, status) => electron_1.ipcRenderer.invoke('db-update-ticket-status', id, status),
    updateTicket: (ticket) => electron_1.ipcRenderer.invoke('db-update-ticket', ticket),
    getTicketById: (id) => electron_1.ipcRenderer.invoke('db-get-ticket-by-id', id),
    executeCommand: (commands) => electron_1.ipcRenderer.invoke('execute-command', commands),
    getSystemMetrics: () => electron_1.ipcRenderer.invoke('get-system-metrics'),
    getSolutions: () => electron_1.ipcRenderer.invoke('db-get-solutions'),
    createSolution: (solution) => electron_1.ipcRenderer.invoke('db-create-solution', solution),
    findSolutions: (problemDescription) => electron_1.ipcRenderer.invoke('db-find-solutions', problemDescription),
    upsertRemoteSession: (session) => electron_1.ipcRenderer.invoke('db-upsert-remote-session', session),
    getRemoteSession: (ticketId) => electron_1.ipcRenderer.invoke('db-get-remote-session', ticketId),
    deleteRemoteSession: (ticketId) => electron_1.ipcRenderer.invoke('db-delete-remote-session', ticketId),
    getSettings: () => electron_1.ipcRenderer.invoke('db-get-settings'),
    updateSettings: (settings) => electron_1.ipcRenderer.invoke('db-update-settings', settings),
    generateMockData: () => electron_1.ipcRenderer.invoke('db-generate-mock-data'),
    exportSupportBundle: () => electron_1.ipcRenderer.invoke('export-support-bundle'),
    exportAuditReport: () => electron_1.ipcRenderer.invoke('export-audit-report'),
    getAuditLogs: () => electron_1.ipcRenderer.invoke('db-get-audit-logs'),
    getSystemDiagnostics: () => electron_1.ipcRenderer.invoke('get-system-diagnostics'),
    getAutomationRules: () => electron_1.ipcRenderer.invoke('db-get-automation-rules'),
    updateAutomationRule: (rule) => electron_1.ipcRenderer.invoke('db-update-automation-rule', rule),
    createAutomationRule: (rule) => electron_1.ipcRenderer.invoke('db-create-automation-rule', rule),
    deleteAutomationRule: (id) => electron_1.ipcRenderer.invoke('db-delete-automation-rule', id),
    // AI actions
    aiChat: (message, history, screenshot) => electron_1.ipcRenderer.invoke('ai-chat', { message, history, screenshot }),
    categorizeAndPrioritize: (title, description) => electron_1.ipcRenderer.invoke('ai-categorize-prioritize', { title, description }),
    askAboutTicket: (ticket, question) => electron_1.ipcRenderer.invoke('ai-ask-about-ticket', { ticket, question }),
    draftAiResponse: (ticket) => electron_1.ipcRenderer.invoke('ai-draft-response', ticket),
    summarizeTicket: (ticket) => electron_1.ipcRenderer.invoke('ai-summarize-ticket', ticket),
    generateKbArticle: (ticket) => electron_1.ipcRenderer.invoke('ai-generate-kb-article', ticket),
    getSystemHealth: (tickets) => electron_1.ipcRenderer.invoke('ai-get-system-health', tickets),
    rootCauseAnalysis: (ticket) => electron_1.ipcRenderer.invoke('ai-root-cause-analysis', ticket),
    parseSearchQuery: (query) => electron_1.ipcRenderer.invoke('ai-parse-search-query', query),
    semanticSearchKb: (query, solutions) => electron_1.ipcRenderer.invoke('ai-semantic-search-kb', { query, solutions }),
    analyzeSupportBundle: () => electron_1.ipcRenderer.invoke('ai-analyze-support-bundle'),
    startConversation: (videoBase64, prompt) => electron_1.ipcRenderer.invoke('ai-start-conversation', { videoBase64, prompt }),
    testSSO: (config) => electron_1.ipcRenderer.invoke('auth-test-sso', config),
    // Event Listeners
    onAIOpsNotification: (callback) => electron_1.ipcRenderer.on('aiops-notification', (_event, data) => callback(data)),
    onNavigate: (callback) => electron_1.ipcRenderer.on('navigate-to', (_event, page) => callback(page)),
    // Remote control actions (send for one-way communication)
    send: (channel, data) => {
        if (validChannels.includes(channel)) {
            electron_1.ipcRenderer.send(channel, data);
        }
    },
});
