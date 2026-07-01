import { api } from '@/lib/api';
import { validatePromotion } from '@/lib/promotion-engine';
import type { Promotion, PromotionStatus } from '@/lib/types';

export interface PromotionListResponse {
  promotions: Promotion[];
  total: number;
}

export async function fetchPromotions(params?: {
  status?: PromotionStatus;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PromotionListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  const qs = searchParams.toString();
  return api.get<PromotionListResponse>(`/restaurant/promotions${qs ? `?${qs}` : ''}`);
}

export async function fetchPromotion(id: string): Promise<Promotion> {
  const data = await api.get<{ promotion: Promotion }>(`/restaurant/promotions/${id}`);
  return data.promotion;
}

export async function createPromotion(data: Partial<Promotion>): Promise<Promotion> {
  const validation = validatePromotion(data);
  if (!validation.valid) {
    throw new Error(validation.errors.join('; '));
  }
  const result = await api.post<{ promotion: Promotion }>('/restaurant/promotions', data);
  return result.promotion;
}

export async function updatePromotion(id: string, data: Partial<Promotion>): Promise<Promotion> {
  const result = await api.patch<{ promotion: Promotion }>(`/restaurant/promotions/${id}`, data);
  return result.promotion;
}

export async function updatePromotionStatus(
  id: string,
  status: PromotionStatus
): Promise<Promotion> {
  return updatePromotion(id, { status } as Partial<Promotion>);
}

export async function archivePromotion(id: string): Promise<void> {
  await api.patch(`/restaurant/promotions/${id}`, { status: 'archived' });
}

export async function bulkUpdatePromotions(
  ids: string[],
  action: 'pause' | 'resume' | 'archive'
): Promise<void> {
  await api.post('/restaurant/promotions/bulk', { ids, action });
}

export async function broadcastPromotion(id: string): Promise<{ sent: number }> {
  const result = await api.post<{ sent: number }>(`/restaurant/promotions/${id}/broadcast`);
  return result;
}

export async function deletePromotion(id: string): Promise<void> {
  await api.delete(`/restaurant/promotions/${id}`);
}
