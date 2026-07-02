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
  period: number;
  pctDecline: number;
  recommendation: 'bundle' | 'discount' | 'remove';
}

export interface BestSeller {
  itemId: string;
  name: string;
  orderCount: number;
  revenueShare: number;
  trendVsLastWeek: number;
}

export interface PeakHour {
  day: number;
  hour: number;
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
