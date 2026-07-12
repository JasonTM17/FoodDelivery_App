import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SupportPage from '@/app/[locale]/support/page';
import TicketThread from '@/components/support/ticket-thread';
import { apiGet } from '@/lib/api';

const apiGetMock = vi.mocked(apiGet);

function renderWithQueryClient(children: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>);
}

describe('admin support fail-closed states', () => {
  beforeEach(() => {
    apiGetMock.mockReset();
  });

  it('shows a retryable support queue error instead of a fake empty kanban board', async () => {
    apiGetMock.mockRejectedValueOnce(new Error('support queue unavailable'));

    renderWithQueryClient(<SupportPage />);

    expect(await screen.findByText('loadErrorTitle')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'retry' })).toBeInTheDocument();
    expect(screen.queryByText('emptyColumn')).not.toBeInTheDocument();
  });

  it('rejects malformed support queue envelopes instead of rendering zero tickets', async () => {
    apiGetMock.mockResolvedValueOnce({ meta: { total: 0 } });

    renderWithQueryClient(<SupportPage />);

    expect(await screen.findByText('contractErrorTitle')).toBeInTheDocument();
    expect(screen.queryByText('emptyColumn')).not.toBeInTheDocument();
  });

  it('shows a retryable thread error instead of a fake empty conversation', async () => {
    apiGetMock.mockRejectedValueOnce(new Error('thread unavailable'));

    renderWithQueryClient(<TicketThread ticketId="ticket-1" />);

    expect(await screen.findByText('loadErrorTitle')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'retry' })).toBeInTheDocument();
    expect(screen.queryByText('empty')).not.toBeInTheDocument();
  });

  it('rejects malformed thread envelopes instead of rendering no messages yet', async () => {
    apiGetMock.mockResolvedValueOnce({ meta: { total: 0 } });

    renderWithQueryClient(<TicketThread ticketId="ticket-1" />);

    expect(await screen.findByText('contractErrorTitle')).toBeInTheDocument();
    expect(screen.queryByText('empty')).not.toBeInTheDocument();
  });
});
