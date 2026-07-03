export type AiMonitorStatus = 'online' | 'degraded' | 'not_configured';

export interface AiMonitorOverview {
  instance: {
    status: AiMonitorStatus;
    dashboardUrl: string | null;
    degradedReason: string | null;
    provider: 'deepseek';
    model: string;
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
  averageLatencyMs: number | null;
}
