export type RevenueSource = 'organic' | 'promotion' | 'referral' | 'search';
export type PaymentMethod = 'cash' | 'card' | 'wallet' | 'sepay' | 'vnpay';

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
