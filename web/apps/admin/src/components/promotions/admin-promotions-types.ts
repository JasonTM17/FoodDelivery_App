export type AdminPromotionType = 'percentage' | 'fixed';

export interface AdminPromotion {
  id: string;
  code: string;
  type: AdminPromotionType;
  value: number;
  minOrder: number;
  maxDiscount: number;
  usageCount: number;
  usageLimit: number;
  startDate: string;
  endDate: string;
  active: boolean;
  description: string;
}

export interface AdminPromotionFormData {
  code: string;
  type: AdminPromotionType;
  value: string;
  minOrder: string;
  maxDiscount: string;
  usageLimit: string;
  startDate: string;
  endDate: string;
  description: string;
  active: boolean;
}

export function createEmptyPromotionForm(): AdminPromotionFormData {
  return {
    code: '',
    type: 'percentage',
    value: '',
    minOrder: '',
    maxDiscount: '',
    usageLimit: '',
    startDate: '',
    endDate: '',
    description: '',
    active: true,
  };
}

export function promotionToFormData(promotion: AdminPromotion): AdminPromotionFormData {
  return {
    code: promotion.code,
    type: promotion.type,
    value: String(promotion.value),
    minOrder: promotion.minOrder ? String(promotion.minOrder) : '',
    maxDiscount: promotion.maxDiscount ? String(promotion.maxDiscount) : '',
    usageLimit: promotion.usageLimit ? String(promotion.usageLimit) : '',
    startDate: promotion.startDate?.split('T')[0] ?? '',
    endDate: promotion.endDate?.split('T')[0] ?? '',
    description: promotion.description ?? '',
    active: promotion.active,
  };
}

export function toPromotionPayload(formData: AdminPromotionFormData) {
  return {
    code: formData.code,
    type: formData.type,
    value: Number(formData.value),
    minOrder: formData.minOrder ? Number(formData.minOrder) : 0,
    maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : 0,
    usageLimit: formData.usageLimit ? Number(formData.usageLimit) : 0,
    startDate: formData.startDate || null,
    endDate: formData.endDate || null,
    description: formData.description,
    active: formData.active,
  };
}
