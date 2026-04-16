import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Electron API
(window as any).electronAPI = {
  getTickets: vi.fn(),
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
  updateTicket: vi.fn(),
  updateTicketStatus: vi.fn(),
  createTicket: vi.fn(),
  createSolution: vi.fn(),
  getSolutions: vi.fn(),
  findSolutions: vi.fn(),
  getSystemDiagnostics: vi.fn(),
  getSystemHealth: vi.fn(),
  categorizeAndPrioritize: vi.fn(),
  askAboutTicket: vi.fn(),
  draftAiResponse: vi.fn(),
  summarizeTicket: vi.fn(),
  generateKbArticle: vi.fn(),
  startConversation: vi.fn(),
  deleteRemoteSession: vi.fn(),
  getRemoteSession: vi.fn(),
  upsertRemoteSession: vi.fn(),
  send: vi.fn(),
  executeCommand: vi.fn(),
};

// Mock ResizeObserver for Recharts
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));
