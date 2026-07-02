import type { BestSeller } from './insights-types';
import type { RevenueSummary } from './revenue-types';

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
