import { describe, it, expect } from 'vitest';
import { TicketStatus } from '../../types';

describe('Ticket Logic', () => {
  it('should have correct status enums', () => {
    expect(TicketStatus.NEW).toBe('New');
    expect(TicketStatus.RESOLVED).toBe('Resolved');
    expect(TicketStatus.AI_RESOLVED).toBe('AI Resolved');
  });
});
