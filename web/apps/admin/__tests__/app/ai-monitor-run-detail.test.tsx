import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiGet } from '@/lib/api';
import AiMonitorRunDetailError from '@/app/[locale]/ai-monitor/[runId]/error';
import AiMonitorRunDetailPage from '@/app/[locale]/ai-monitor/[runId]/page';

const mockedApiGet = vi.mocked(apiGet);

function renderWithClient(children: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>);
}

describe('AI monitor run detail', () => {
  beforeEach(() => {
    mockedApiGet.mockReset();
  });

  it('renders localized run status and execution details from the API', async () => {
    mockedApiGet.mockResolvedValueOnce({
      id: 'run-1',
      workflowName: 'Fraud scoring',
      trigger: 'manual',
      status: 'success',
      startedAt: '2026-07-01T09:00:00.000Z',
      finishedAt: '2026-07-01T09:00:02.000Z',
      durationMs: 2100,
      inputData: { orderId: 'order-1' },
      outputData: { score: 0.12 },
      errorMessage: null,
      executionId: 'exec-1',
    });

    renderWithClient(<AiMonitorRunDetailPage params={{ runId: 'run-1' }} />);

    expect(await screen.findByRole('heading', { name: 'Fraud scoring' })).toBeInTheDocument();
    expect(screen.getByText('statusSuccess')).toBeInTheDocument();
    expect(screen.getByText('exec-1')).toBeInTheDocument();
    expect(screen.getByText('manual')).toBeInTheDocument();
  });

  it('shows localized not-found state when the run API returns empty data', async () => {
    mockedApiGet.mockResolvedValueOnce(null);

    renderWithClient(<AiMonitorRunDetailPage params={{ runId: 'missing-run' }} />);

    expect(await screen.findByText('notFound')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'back' })).toHaveAttribute('href', '/ai-monitor');
  });

  it('shows a safe localized error boundary and lets the user retry', () => {
    const reset = vi.fn();

    render(<AiMonitorRunDetailError error={new Error('internal stack trace')} reset={reset} />);

    expect(screen.getByRole('alert')).toHaveTextContent('loadErrorTitle');
    expect(screen.getByRole('alert')).toHaveTextContent('loadErrorDescription');
    expect(screen.queryByText('internal stack trace')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'retry' }));

    expect(reset).toHaveBeenCalledTimes(1);
  });
});
