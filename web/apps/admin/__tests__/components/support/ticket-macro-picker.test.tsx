import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TicketMacroPicker from '@/components/support/ticket-macro-picker';

describe('TicketMacroPicker', () => {
  it('renders database-backed macros and inserts the resolved body', async () => {
    const onSelect = vi.fn();

    render(
      <TicketMacroPicker
        macros={[
          {
            id: 'macro-1',
            name: 'Refund SLA reply',
            body: 'Hello {{customer.name}}, order {{order.id}} is being reviewed.',
            tags: ['refund'],
          },
        ]}
        context={{ customer: { name: 'An' }, order: { id: 'ORD-42' } }}
        onSelect={onSelect}
      />,
    );

    fireEvent.click(screen.getByTestId('macro-picker-trigger'));

    expect(await screen.findByText('Refund SLA reply')).toBeInTheDocument();
    expect(screen.getAllByText('refund').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByTestId('macro-macro-1'));

    expect(onSelect).toHaveBeenCalledWith(
      'Hello An, order ORD-42 is being reviewed.',
      'macro-1',
    );
  });

  it('groups untagged macros under the localized uncategorized label', async () => {
    render(
      <TicketMacroPicker
        macros={[
          {
            id: 'macro-2',
            name: 'General close',
            body: 'Resolved ticket {{ticket.id}}',
          },
        ]}
        context={{ ticket: { id: 'ticket-1' } }}
        onSelect={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('macro-picker-trigger'));

    expect(await screen.findByText('General close')).toBeInTheDocument();
    expect(screen.getByText('uncategorized')).toBeInTheDocument();
  });
});
