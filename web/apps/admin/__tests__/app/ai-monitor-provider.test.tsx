import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiGet } from '@/lib/api';
import AiMonitorProviderClient from '@/app/[locale]/ai-monitor/ai-monitor-provider-client';

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

describe('AI monitor provider state', () => {
  beforeEach(() => {
    mockedApiGet.mockReset();
  });

  it('renders the configured DeepSeek model without fabricated telemetry', async () => {
    mockedApiGet.mockResolvedValueOnce({
      instance: {
        status: 'online',
        dashboardUrl: 'https://platform.deepseek.com/usage',
        degradedReason: null,
        provider: 'deepseek',
        model: 'deepseek-v4-flash',
      },
      stats: emptyStats(),
    });

    renderWithClient(<AiMonitorProviderClient />);

    expect(await screen.findByText('deepseek-v4-flash')).toBeInTheDocument();
    expect(screen.getByText('statusOnline')).toBeInTheDocument();
    expect(screen.queryByText(/AI_MONITOR_TELEMETRY_NOT_ENABLED/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'openDashboard' })).toHaveAttribute(
      'href',
      'https://platform.deepseek.com/usage',
    );
  });

  it('renders an explicit not-configured state when the model key is absent', async () => {
    mockedApiGet.mockResolvedValueOnce({
      instance: {
        status: 'not_configured',
        dashboardUrl: null,
        degradedReason: 'DEEPSEEK_NOT_CONFIGURED',
        provider: 'deepseek',
        model: 'deepseek-v4-flash',
      },
      stats: emptyStats(),
    });

    renderWithClient(<AiMonitorProviderClient />);

    expect(await screen.findByText('statusNotConfigured')).toBeInTheDocument();
    expect(screen.getByText(/DEEPSEEK_NOT_CONFIGURED/)).toBeInTheDocument();
    expect(screen.getByText('dashboardUnavailable')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'openDashboard' })).not.toBeInTheDocument();
  });
});

function emptyStats() {
  return {
    totalConversations: null,
    selfResolved: null,
    escalated: null,
    resolutionRate: null,
    costTodayUsd: null,
    budgetTodayUsd: null,
    inputTokens: null,
    outputTokens: null,
    requests: null,
    averageLatencyMs: null,
  };
}
