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

export type AiMonitorStatus = 'online' | 'degraded' | 'not_configured';

export interface AdminAiMonitorOverview {
  instance: {
    status: AiMonitorStatus;
    dashboardUrl: string | null;
    degradedReason: string | null;
    provider: 'deepseek';
    model: string;
  };
  stats: AdminAiMonitorStats;
}

export interface AdminAiMonitorStats {
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

export type AdminDriverStatus = 'online' | 'offline' | 'delivering';
export type AdminDriverVehicleType = 'motorbike' | 'car' | 'bicycle';
export type AdminDriverLocationStatus = 'online' | 'free' | 'delivering' | 'busy';

export interface AdminDriver {
  id: string;
  profileId: string;
  name: string;
  email: string;
  phone: string | null;
  rating: number;
  totalDeliveries: number;
  status: AdminDriverStatus;
  vehicleType: AdminDriverVehicleType;
  vehiclePlate: string | null;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface AdminDriverLocation {
  id: string;
  driverId: string;
  name: string;
  rating: number;
  status: AdminDriverLocationStatus;
  lat: number;
  lng: number;
  currentOrder?: string;
  vehicleType?: string;
  vehiclePlate?: string | null;
  lastSeenAt: string;
}

export type RestaurantOrderChatSenderType = 'customer' | 'driver' | 'restaurant' | 'ai' | 'system';

export interface RestaurantOrderChatMessage {
  id: string;
  senderType: RestaurantOrderChatSenderType;
  senderId: string | null;
  content: string;
  createdAt: string;
}

export interface RestaurantOrderChatMessagesPayload {
  messages: RestaurantOrderChatMessage[];
  canReply: boolean;
}

export interface CreateRestaurantOrderChatMessageRequest {
  content: string;
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
  language: 'vi' | 'en' | 'ja';
  grounded?: boolean;
  toolCalls?: Array<{
    name:
      | 'getOrderStatus'
      | 'getDriverLocation'
      | 'getRestaurantStatus'
      | 'getRefundEligibility'
      | 'createSupportTicket'
      | 'getRecommendedFoods'
      | 'notifyAdmin';
    args: Record<string, unknown>;
  }>;
}
