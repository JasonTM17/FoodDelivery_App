export type AiMonitorStatus = 'online' | 'degraded' | 'not_configured';

export interface AiMonitorOverview {
  instance: {
    status: AiMonitorStatus;
    dashboardUrl: string | null;
    degradedReason: string | null;
  };
  workflows: AiMonitorWorkflow[];
  executions: AiMonitorExecution[];
  stats: AiMonitorStats;
}

export interface AiMonitorWorkflow {
  id: string;
  name: string;
  status: AiMonitorStatus;
  lastRunAt: string | null;
  runs: number | null;
}

export interface AiMonitorExecution {
  id: string;
  workflowName: string;
  trigger: string | null;
  durationMs: number | null;
  status: 'success' | 'error' | 'running';
  startedAt: string | null;
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
