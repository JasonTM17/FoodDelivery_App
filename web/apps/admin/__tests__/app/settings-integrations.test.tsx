import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiGet } from '@/lib/api';
import SettingsIntegrationsPage from '@/app/[locale]/settings/integrations/page';

const mockedApiGet = vi.mocked(apiGet);

function renderWithClient(children: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>);
}

describe('settings integrations page', () => {
  beforeEach(() => {
    mockedApiGet.mockReset();
  });

  it('renders persisted provider states and never exposes secret inputs', async () => {
    mockedApiGet.mockImplementation(async (path: string) => {
      if (path === '/admin/settings/integrations') {
        return {
          section: 'integrations',
          settings: {
            sepayConfigured: false,
            notificationProviderConfigured: true,
            outboundWebhooksConfigured: false,
          },
          updatedAt: '2026-07-03T03:00:00.000Z',
        };
      }

      if (path === '/admin/ai-monitor') {
        return {
          instance: {
            status: 'online',
            dashboardUrl: null,
            degradedReason: null,
            provider: 'deepseek',
            model: 'deepseek-v4-flash',
            telemetry: {
              status: 'awaiting_requests',
              lastRequestAt: null,
              lastSuccessfulRequestAt: null,
              lastFailureCode: null,
            },
          },
          stats: {
            totalConversations: null,
            selfResolved: null,
            escalated: null,
            resolutionRate: null,
            costTodayUsd: null,
            budgetTodayUsd: null,
            inputTokens: null,
            outputTokens: null,
            requests: null,
            failedRequests: null,
            averageLatencyMs: null,
          },
        };
      }

      throw new Error(`Unexpected path: ${path}`);
    });

    renderWithClient(<SettingsIntegrationsPage />);

    expect(await screen.findByText('deepseek-v4-flash')).toBeInTheDocument();
    expect(screen.getByText('SePay')).toBeInTheDocument();
    expect(screen.getByText('aiChatbot')).toBeInTheDocument();
    expect(screen.getAllByText('statuses.configured')).toHaveLength(2);
    expect(screen.getAllByText('statuses.not_configured')).toHaveLength(2);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('shows a retryable error when both status sources are unavailable', async () => {
    mockedApiGet.mockRejectedValue(new Error('backend unavailable'));

    renderWithClient(<SettingsIntegrationsPage />);

    expect(await screen.findByText('loadErrorTitle')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'retry' })).toBeInTheDocument();
  });
});
