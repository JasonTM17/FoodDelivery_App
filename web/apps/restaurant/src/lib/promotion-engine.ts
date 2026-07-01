import type { Promotion, PromotionType } from './types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePromotion(p: Partial<Promotion>): ValidationResult {
  const errors: string[] = [];

  if (!p.code || p.code.trim().length < 3) {
    errors.push('Mã khuyến mãi phải có ít nhất 3 ký tự');
  }
  if (!p.name || p.name.trim().length < 2) {
    errors.push('Tên khuyến mãi phải có ít nhất 2 ký tự');
  }
  if (!p.type || !['percent', 'fixed', 'bogof', 'combo'].includes(p.type)) {
    errors.push('Loại khuyến mãi không hợp lệ');
  }
  if (!p.discountValue || p.discountValue <= 0) {
    errors.push('Giá trị giảm phải lớn hơn 0');
  }
  if (p.type === 'percent' && p.discountValue && p.discountValue > 100) {
    errors.push('Giảm % không được vượt 100%');
  }
  if ((p.type === 'bogof' || p.type === 'combo') && !p.comboConfig) {
    errors.push('Cấu hình BOGOF/Combo không được để trống');
  }
  if (p.type === 'bogof' && p.comboConfig && p.comboConfig.buy < 1) {
    errors.push('Số lượng mua phải lớn hơn 0');
  }
  if (p.schedule) {
    const from = new Date(p.schedule.validFrom);
    const until = new Date(p.schedule.validUntil);
    if (isNaN(from.getTime()) || isNaN(until.getTime())) {
      errors.push('Ngày không hợp lệ');
    } else if (from >= until) {
      errors.push('Ngày bắt đầu phải trước ngày kết thúc');
    }
  } else {
    errors.push('Vui lòng thiết lập lịch khuyến mãi');
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

export function getPromotionStatusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: 'Nháp',
    scheduled: 'Đã lên lịch',
    active: 'Đang hoạt động',
    paused: 'Tạm dừng',
    expired: 'Hết hạn',
    archived: 'Đã lưu trữ',
  };
  return map[status] || status;
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

export function getPromotionTypeLabel(type: PromotionType): string {
  const map: Record<PromotionType, string> = {
    percent: 'Giảm %',
    fixed: 'Giảm tiền',
    bogof: 'Mua X tặng Y',
    combo: 'Combo',
  };
  return map[type] || type;
}

export function getAudienceLabel(audience: string): string {
  const map: Record<string, string> = {
    all: 'Tất cả khách hàng',
    new: 'Khách mới (30 ngày)',
    vip: 'Khách VIP',
    lapsed: 'Không hoạt động 30+ ngày',
    segment: 'Phân khúc',
    order_history: 'Lịch sử đơn',
  };
  return map[audience] || audience;
}

export function getChannelLabel(channel: string): string {
  const map: Record<string, string> = {
    in_app: 'In-app',
    push: 'Push',
    email: 'Email',
    sms: 'SMS',
  };
  return map[channel] || channel;
}

export function getChannelCost(channel: string): number {
  const map: Record<string, number> = {
    in_app: 0,
    push: 0,
    email: 50,
    sms: 350,
  };
  return map[channel] || 0;
}
