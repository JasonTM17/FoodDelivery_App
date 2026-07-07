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

export type AdminExportFormat = 'csv' | 'xlsx';
export type AdminExportJobFormat = AdminExportFormat | 'parquet';
export type AdminExportStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface AdminExportJob {
  id: string;
  type: AdminExportResource;
  resource: AdminExportResource;
  format: AdminExportJobFormat;
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
export type AdminDriverLocationStatus = 'online' | 'offline' | 'free' | 'delivering' | 'busy';
export type DeliveryRoutePhase = 'pickup' | 'dropoff';

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

export interface OrderTrackingDriverLocation {
  lat: number;
  lng: number;
  lastUpdated: string;
}

export interface OrderTrackingResponse {
  orderId: string;
  status:
    | 'created'
    | 'pending_payment'
    | 'paid'
    | 'restaurant_pending'
    | 'restaurant_accepted'
    | 'preparing'
    | 'ready_for_pickup'
    | 'driver_assigned'
    | 'driver_arriving_restaurant'
    | 'picked_up'
    | 'delivering'
    | 'delivered'
    | 'completed'
    | 'cancelled'
    | 'refunded';
  driverLocation: OrderTrackingDriverLocation | null;
  etaMinutes: number | null;
  routePolyline: string | null;
  routePhase: DeliveryRoutePhase;
}

export interface AdminDispatchHeatmapPoint {
  districtCode: string;
  lat: number;
  lng: number;
  orderCount: number;
}

export interface AdminKpiCard {
  key: string;
  label: string;
  value: number;
  formattedValue: string;
  delta: number;
  sparkline: number[];
  drillDownHref: string;
}

export interface AdminKpisResponse {
  kpis: AdminKpiCard[];
}

export interface AdminRecentOrder {
  id: string;
  orderCode: string;
  customer: { name: string };
  restaurant: { name: string };
  driver: { name: string } | null;
  status: string;
  total: number;
  placedAt: string;
}

export interface AdminRecentOrdersResponse {
  orders: AdminRecentOrder[];
}

export interface AdminPromotionAnalytics {
  redemptions: number;
  gmv: number;
  discountCost: number;
  roi: number | null;
}

export type AdminKycStatus = 'pending' | 'approved' | 'rejected';

export interface AdminKycSubmission {
  id: string;
  status: AdminKycStatus;
  documentUrls: Record<string, unknown>;
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface AdminKycPayload {
  available: boolean;
  reason?: string;
  submissions?: AdminKycSubmission[];
}

export interface AdminKycReviewRequest {
  submissionId: string;
  status: 'approved' | 'rejected';
  reason?: string;
}

export type RestaurantInsightSuggestionType = 'pricing' | 'menu_mix' | 'marketing' | 'operations';
export type RestaurantInsightSuggestionParams = Record<string, string | number | boolean | null | undefined>;

export interface RestaurantInsightSuggestion {
  id: string;
  type: RestaurantInsightSuggestionType;
  titleKey: string;
  descriptionKey: string;
  predictedImpactKey: string;
  params: RestaurantInsightSuggestionParams;
  actionable: boolean;
}

export interface RestaurantPeakHour {
  day: number;
  hour: number;
  orderCount: number;
}

export interface RestaurantBestSeller {
  itemId: string;
  name: string;
  orderCount: number;
  revenueShare: number;
  trendVsLastWeek: number;
}

export interface RestaurantSlowMover {
  itemId: string;
  name: string;
  ordersInPeriod: number;
  period: number;
  pctDecline: number;
  recommendation: 'bundle' | 'discount' | 'remove';
}

export interface RestaurantRevenueForecastPoint {
  date: string;
  predicted: number;
  actual?: number;
  lower?: number;
  upper?: number;
}

export interface RestaurantInsights {
  suggestions: RestaurantInsightSuggestion[];
  peakHours: RestaurantPeakHour[];
  bestSellers: RestaurantBestSeller[];
  slowMovers: RestaurantSlowMover[];
  forecast: RestaurantRevenueForecastPoint[];
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
