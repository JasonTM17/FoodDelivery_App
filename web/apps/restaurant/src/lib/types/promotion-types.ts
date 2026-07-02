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
  usageCount?: number;
  perUserLimit: number;
  status: PromotionStatus;
  createdAt: string;
  createdBy: string;
}
