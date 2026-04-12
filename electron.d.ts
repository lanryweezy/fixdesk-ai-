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
    getSolutions: () => Promise<Solution[]>;
    createSolution: (solution: Omit<Solution, 'id'>) => Promise<Solution>;
    findSolutions: (problemDescription: string) => Promise<Solution[]>;
    upsertRemoteSession: (session: RemoteSession) => Promise<RemoteSession>;
    getRemoteSession: (ticketId: string) => Promise<RemoteSession | undefined>;
    deleteRemoteSession: (ticketId: string) => Promise<void>;
}

declare global {
    interface Window {
        electronAPI: ElectronApi;
    }
}
