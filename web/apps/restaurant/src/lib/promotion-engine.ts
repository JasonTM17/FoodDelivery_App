interface PromoSchedule {
  validFrom: string;
  validUntil: string;
}

interface PromotionInput {
  type: string;
  discountValue: number;
  minOrderValue?: number;
  startDate: string;
  endDate: string;
  maxUses: number;
  code: string;
  name: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePromotion(p: PromotionInput): ValidationResult {
  const errors: string[] = [];

  if (!p.name.trim()) errors.push('Tên khuyến mãi không được để trống');
  if (!p.code.trim()) errors.push('Mã khuyến mãi không được để trống');
  if (p.code.length > 12) errors.push('Mã khuyến mãi tối đa 12 ký tự');
  if (!/^[A-Z0-9]+$/.test(p.code)) errors.push('Mã khuyến mãi chỉ được dùng chữ hoa và số');

  if (p.type !== 'free_delivery' && p.discountValue <= 0) {
    errors.push('Giá trị giảm phải lớn hơn 0');
  }
  if (p.type === 'discount_percent' && p.discountValue > 100) {
    errors.push('Giảm % không được vượt quá 100%');
  }
  if (p.type === 'discount_amount' && p.minOrderValue != null && p.discountValue > p.minOrderValue) {
    errors.push('Số tiền giảm không được vượt quá giá trị đơn tối thiểu');
  }

  if (!p.startDate) errors.push('Vui lòng chọn ngày bắt đầu');
  if (!p.endDate) errors.push('Vui lòng chọn ngày kết thúc');
  if (p.startDate && p.endDate && p.endDate < p.startDate) {
    errors.push('Ngày kết thúc phải sau ngày bắt đầu');
  }

  if (p.maxUses < 1) errors.push('Số lần dùng tối đa phải ít nhất là 1');

  return { valid: errors.length === 0, errors };
}

export function checkScheduleOverlap(
  existing: PromoSchedule[],
  candidate: PromoSchedule
): PromoSchedule[] {
  const cStart = new Date(candidate.validFrom).getTime();
  const cEnd = new Date(candidate.validUntil).getTime();

  return existing.filter((e) => {
    const eStart = new Date(e.validFrom).getTime();
    const eEnd = new Date(e.validUntil).getTime();
    return cStart <= eEnd && cEnd >= eStart;
  });
}

export function getPromotionStatus(
  validFrom: string,
  validUntil: string,
  isActive: boolean
): 'scheduled' | 'active' | 'expired' | 'draft' {
  if (!isActive) return 'draft';
  const now = Date.now();
  const start = new Date(validFrom).getTime();
  const end = new Date(validUntil).getTime();
  if (now < start) return 'scheduled';
  if (now > end) return 'expired';
  return 'active';
}

export function calculateROI(revenueGenerated: number, discountGiven: number): number | null {
  if (discountGiven <= 0) return null;
  return parseFloat(((revenueGenerated / discountGiven)).toFixed(1));
}

export function calculateRedemptionRate(usageCount: number, usageLimit: number): number {
  if (usageLimit <= 0) return 0;
  return Math.min(100, Math.round((usageCount / usageLimit) * 100));
}

export function daysUntilExpiry(endDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function generatePromoCode(name: string): string {
  const prefix = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 4) || 'SALE';
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}${suffix}`;
}
