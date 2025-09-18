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
  getTicketById: (id: string) => ipcRenderer.invoke('db-get-ticket-by-id', id),
  executeCommand: (commands: string[]) => ipcRenderer.invoke('execute-command', commands),
  createSolution: (solution: any) => ipcRenderer.invoke('db-create-solution', solution),
  findSolutions: (problemDescription: string) => ipcRenderer.invoke('db-find-solutions', problemDescription),

  // Remote control actions (send for one-way communication)
  send: (channel: string, data: any) => {
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
});
