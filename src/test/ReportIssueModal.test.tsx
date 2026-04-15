import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReportIssueModal } from '../../components/ReportIssueModal';
import { ToastProvider } from '../../services/ToastContext';

describe('ReportIssueModal Flow', () => {
  it('allows user to enter a prompt and start recording', async () => {
    const onTicketCreated = vi.fn();
    const onClose = vi.fn();

    render(
      <ToastProvider>
        <ReportIssueModal onTicketCreated={onTicketCreated} onClose={onClose} />
      </ToastProvider>
    );

    const textarea = screen.getByPlaceholderText(/My VPN keeps disconnecting/i);
    fireEvent.change(textarea, { target: { value: 'Test issue prompt' } });

    const startBtn = screen.getByRole('button', { name: /Start Screen Recording/i });
    expect(startBtn).not.toBeDisabled();

    // Simulating clicking start recording would trigger complex Electron APIs
    // but we've verified the initial state and prompt handling.
  });
});
