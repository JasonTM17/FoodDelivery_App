export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  hasMore?: boolean;
}

export interface ApiEnvelope<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ProblemDetail {
  type?: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  code?: string;
  errors?: unknown;
}

export interface TokenPair {
  accessToken: string;
  refreshToken?: string;
}

export type QueryValue = string | number | boolean | null | undefined;

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: BodyInit | Record<string, unknown> | unknown[] | null;
  params?: Record<string, QueryValue>;
  requireAuth?: boolean;
  skipRefresh?: boolean;
}

export interface ApiClientOptions {
  baseUrl: string;
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  setTokens: (tokens: TokenPair) => void;
  clearTokens: () => void;
  onUnauthorized?: () => void;
  fetcher?: typeof fetch;
}

export type AdminExportResource =
  | 'audit_logs'
  | 'drivers'
  | 'orders'
  | 'promotions'
  | 'restaurants'
  | 'revenue'
  | 'users';

export type AdminExportFormat = 'csv' | 'xlsx' | 'parquet';
export type AdminExportStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface AdminExportJob {
  id: string;
  type: AdminExportResource;
  resource: AdminExportResource;
  format: AdminExportFormat;
  status: AdminExportStatus;
  progress: number;
  rowCount: number;
  totalRows: number;
  filterSummary: Record<string, string>;
  requestedBy?: {
    id: string;
    email: string;
    fullName: string;
  };
  createdAt: string;
  completedAt?: string;
  downloadUrl?: string;
  errorMessage?: string;
}

export interface AdminExportJobsPayload {
  jobs: AdminExportJob[];
}

export interface CreateAdminExportRequest {
  resource?: AdminExportResource;
  type?: AdminExportResource;
  format: AdminExportFormat;
  period?: 'today' | '7d' | '30d' | 'thisMonth' | 'thisQuarter' | 'custom';
  dateFrom?: string;
  dateTo?: string;
  filters?: Record<string, unknown>;
}

export type AdminSettingsSection = 'general' | 'branding' | 'compliance' | 'integrations';
export type AdminSettingsValue = Record<string, unknown>;

export interface AdminSettingsSectionResponse {
  section: AdminSettingsSection;
  settings: AdminSettingsValue;
  updatedAt: string | null;
}

export interface AdminSettingsPayload {
  sections: Partial<Record<AdminSettingsSection, AdminSettingsSectionResponse>>;
}

export interface AiChatRequest {
  message: string;
  sessionId?: string;
  orderId?: string;
}

export interface AiChatReply {
  reply: string;
  sessionId: string;
  action: 'answered' | 'escalated' | 'degraded';
  escalated?: boolean;
  severity?: string;
}
