import type { Promotion, PromotionType } from './types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePromotion(p: Partial<Promotion>): ValidationResult {
  const errors: string[] = [];

  if (!p.code || p.code.trim().length < 3) {
    errors.push('codeTooShort');
  }
  if (!p.name || p.name.trim().length < 2) {
    errors.push('nameTooShort');
  }
  if (!p.type || !['percent', 'fixed', 'bogof', 'combo'].includes(p.type)) {
    errors.push('invalidType');
  }
  if (!p.discountValue || p.discountValue <= 0) {
    errors.push('discountPositive');
  }
  if (p.type === 'percent' && p.discountValue && p.discountValue > 100) {
    errors.push('percentMax');
  }
  if ((p.type === 'bogof' || p.type === 'combo') && !p.comboConfig) {
    errors.push('comboRequired');
  }
  if (p.type === 'bogof' && p.comboConfig && p.comboConfig.buy < 1) {
    errors.push('buyQuantityPositive');
  }
  if (p.schedule) {
    const from = new Date(p.schedule.validFrom);
    const until = new Date(p.schedule.validUntil);
    if (isNaN(from.getTime()) || isNaN(until.getTime())) {
      errors.push('invalidDate');
    } else if (from >= until) {
      errors.push('dateRangeInvalid');
    }
  } else {
    errors.push('scheduleRequired');
  }

  return { valid: errors.length === 0, errors };
}

export function computeDiscountAmount(
  type: PromotionType,
  discountValue: number,
  orderTotal: number,
  maxDiscountVnd?: number
): number {
  let amount = 0;
  switch (type) {
    case 'percent':
      amount = (orderTotal * discountValue) / 100;
      if (maxDiscountVnd && maxDiscountVnd > 0) {
        amount = Math.min(amount, maxDiscountVnd);
      }
      break;
    case 'fixed':
      amount = Math.min(discountValue, orderTotal);
      break;
    case 'bogof':
    case 'combo':
      amount = discountValue; // combo price is the fixed price
      break;
  }
  return Math.max(0, Math.round(amount));
}

export function getPromotionStatusColor(status: string): string {
  const map: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    scheduled: 'bg-blue-100 text-blue-700',
    active: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    expired: 'bg-red-100 text-red-700',
    archived: 'bg-gray-200 text-gray-500',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
}
