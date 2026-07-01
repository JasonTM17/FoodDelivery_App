export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  phone: string;
  logo: string;
  coverImage: string;
  isActive: boolean;
  openingHours: OpeningHours;
  createdAt: string;
  updatedAt: string;
}

export interface OpeningHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface DayHours {
  open: string;
  close: string;
  isClosed: boolean;
}

export interface Order {
  id: string;
  code: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  tableNumber: string | null;
  note: string;
  restaurantId: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
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

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  options: OrderItemOption[];
}

export interface OrderItemOption {
  name: string;
  value: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
  options: MenuItemOption[];
  restaurantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItemOption {
  id: string;
  name: string;
  type: 'single' | 'multi';
  required: boolean;
  choices: MenuItemChoice[];
}

export interface MenuItemChoice {
  id: string;
  name: string;
  price: number;
}

export interface RevenueData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  dailyRevenue: DailyRevenue[];
  topSellingItems: TopSellingItem[];
}

export interface DailyRevenue {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopSellingItem {
  id: string;
  name: string;
  quantity: number;
  revenue: number;
}

export interface AuthResponse {
  token: string;
  restaurant: Restaurant;
}

export interface ApiError {
  message: string;
  status: number;
}

export interface OrderStatusTimeline {
  status: OrderStatus;
  label: string;
  timestamp: string | null;
  icon: string;
}

export const LEGACY_ORDER_STATUSES = [
  { status: 'pending', label: 'Chờ xác nhận' },
  { status: 'confirmed', label: 'Đã xác nhận' },
  { status: 'preparing', label: 'Đang chuẩn bị' },
  { status: 'ready', label: 'Sẵn sàng' },
  { status: 'delivering', label: 'Đang giao' },
  { status: 'delivered', label: 'Đã giao' },
];

// ── Promotion types ────────────────────────────────────────────

export const ORDER_STATUSES: { status: OrderStatus; label: string }[] = [
  { status: 'restaurant_pending', label: 'Chờ xác nhận' },
  { status: 'restaurant_accepted', label: 'Đã xác nhận' },
  { status: 'preparing', label: 'Đang chuẩn bị' },
  { status: 'ready_for_pickup', label: 'Sẵn sàng lấy món' },
  { status: 'delivering', label: 'Đang giao' },
  { status: 'delivered', label: 'Đã giao' },
];

export type PromotionType = 'percent' | 'fixed' | 'bogof' | 'combo';
export type PromotionAudience = 'all' | 'new' | 'vip' | 'lapsed' | 'segment' | 'order_history';
export type PromotionChannel = 'in_app' | 'push' | 'email' | 'sms';
export type PromotionStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'expired' | 'archived';
export type PromotionRecurringType = 'weekly' | 'monthly';

export interface PromotionTarget {
  audience: PromotionAudience;
  segmentId?: string;
  minOrderCount?: number;
  lastOrderWithinDays?: number;
}

export interface PromotionSchedule {
  validFrom: Date;
  validUntil: Date;
  recurring?: {
    type: PromotionRecurringType;
    daysOfWeek?: number[];
    dayOfMonth?: number;
  };
}

export interface ComboConfig {
  buy: number;
  get: number;
  getItemIds: string[];
}

export interface Promotion {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: PromotionType;
  discountValue: number;
  minOrderVnd?: number;
  maxDiscountVnd?: number;
  appliesTo: 'all' | 'category' | 'items';
  categoryId?: string;
  itemIds?: string[];
  comboConfig?: ComboConfig;
  target: PromotionTarget;
  schedule: PromotionSchedule;
  channels: PromotionChannel[];
  stackable: boolean;
  maxUsage?: number;
  perUserLimit: number;
  status: PromotionStatus;
  createdAt: string;
  createdBy: string;
}

// ── Revenue types ────────────────────────────────────────────────

export type RevenueSource = 'organic' | 'promotion' | 'referral' | 'search';
export type PaymentMethod = 'cash' | 'card' | 'wallet' | 'sepay' | 'vnpay';

export interface RevenueSummary {
  total: { vnd: number; orderCount: number };
  avg: { orderValue: number; perDay: number };
  delta: {
    vsYesterday: number | null;
    vsLastWeek: number | null;
    vsLastMonth: number | null;
  };
  byDay: { date: string; vnd: number; orderCount: number }[];
  byCategory: { categoryId: string; name: string; vnd: number; pct: number }[];
  byHour: { hour: number; vnd: number; orderCount: number }[];
  bySource: { source: RevenueSource; vnd: number; pct: number }[];
  byPayment: { method: PaymentMethod; vnd: number; pct: number }[];
}

export interface IndustryBenchmark {
  restaurant: { avgOrderValue: number; repeatCustomerRate: number };
  industry: { avgOrderValue: number; repeatCustomerRate: number };
  cohortSize: number;
  source: 'cohort' | 'platform';
  updatedAt: string;
}

export interface RevenueBreakdownRow extends Record<string, string | number> {
  date: string;
  orders: number;
  gross: number;
  discount: number;
  net: number;
  avgOrder: number;
  newCustomers: number;
  returning: number;
}

export interface DashboardOrder {
  id: string;
  code: string;
  status: string;
  total: number;
  customerName: string;
  createdAt: string;
  items: Array<{ name: string; quantity: number }>;
}

export interface RestaurantDashboard {
  store: {
    id: string;
    name: string;
    isOpen: boolean;
    approvalStatus: string;
    onboardingCompletedAt: string | null;
  };
  summary: RevenueSummary;
  bestSellers: BestSeller[];
  recentOrders: DashboardOrder[];
  latestReviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    customerName: string;
    customerAvatar?: string | null;
    createdAt: string;
  }>;
  alerts: { hiddenItems: number; activePromotions: number };
}

// ── Review types ─────────────────────────────────────────────────

export interface Review {
  id: string;
  rating: number;
  comment: string;
  customerName: string;
  customerAvatar?: string;
  dishName: string;
  dishId?: string;
  photos: string[];
  repliedAt?: string;
  reply?: string;
  createdAt: string;
}

export interface RatingDistribution {
  five: number;
  four: number;
  three: number;
  two: number;
  one: number;
}

// ── Insights types ───────────────────────────────────────────────

export type SuggestionType = 'pricing' | 'menu_mix' | 'marketing' | 'operations';

export interface AiSuggestion {
  id: string;
  type: SuggestionType;
  title: string;
  description: string;
  predictedImpact: string;
  actionable: boolean;
}

export interface SlowMover {
  itemId: string;
  name: string;
  ordersInPeriod: number;
  period: number; // days
  pctDecline: number;
  recommendation: 'bundle' | 'discount' | 'remove';
}

export interface BestSeller {
  itemId: string;
  name: string;
  orderCount: number;
  revenueShare: number;
  trendVsLastWeek: number; // percentage points
}

export interface PeakHour {
  day: number; // 0-6
  hour: number; // 0-23
  orderCount: number;
}

export interface RevenueForecastPoint {
  date: string;
  predicted: number;
  actual?: number;
  lower?: number;
  upper?: number;
}

export interface RestaurantInsights {
  suggestions: AiSuggestion[];
  peakHours: PeakHour[];
  bestSellers: BestSeller[];
  slowMovers: SlowMover[];
  forecast: RevenueForecastPoint[];
}

// ── Staff types ─────────────────────────────────────────────────

export type StaffRole = 'owner' | 'manager' | 'kitchen' | 'cashier' | 'viewer';
export type StaffCapability = 'orders' | 'menu' | 'reports' | 'settings' | 'staff' | 'promotions';

export interface StaffMember {
  id: string;
  userId?: string;
  name: string;
  email: string;
  role: StaffRole;
  avatar?: string | null;
  lastActive?: string;
  joinedAt?: string;
  isActive?: boolean;
  permissions: StaffCapability[];
  schedule?: StaffShift[];
}

export interface StaffShift {
  day: number; // 0-6 Mon-Sun
  startHour: number;
  endHour: number;
}

export interface StaffInvitePayload {
  emails: string[];
  role: StaffRole;
}

// ── Menu Category types ──────────────────────────────────────────

export interface MenuCategory {
  id: string;
  name: string;
  icon: string; // emoji
  parentId?: string;
  sortOrder: number;
  itemCount: number;
  isVisible: boolean;
  children?: MenuCategory[];
}
