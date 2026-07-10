export type AiMonitorStatus = 'online' | 'degraded' | 'not_configured';
export type AiTelemetryStatus = 'live' | 'awaiting_requests' | 'unavailable';

export interface AiMonitorOverview {
  instance: {
    status: AiMonitorStatus;
    dashboardUrl: string | null;
    degradedReason: string | null;
    provider: 'deepseek';
    model: string;
    telemetry: {
      status: AiTelemetryStatus;
      lastRequestAt: string | null;
      lastSuccessfulRequestAt: string | null;
      lastFailureCode: string | null;
    };
  };
  stats: AiMonitorStats;
}

export interface AiMonitorStats {
  totalConversations: number | null;
  selfResolved: number | null;
  escalated: number | null;
  resolutionRate: number | null;
  costTodayUsd: number | null;
  budgetTodayUsd: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  requests: number | null;
  failedRequests: number | null;
  averageLatencyMs: number | null;
}
