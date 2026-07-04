'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { apiGet, apiPatch } from '@/lib/api';
import { RestaurantDetailContent } from './restaurant-detail-content';
import { RestaurantDetailEmptyState, RestaurantDetailLoading } from './restaurant-detail-state-panels';
import type { Restaurant } from './restaurant-detail-types';

export default function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: restaurant, isLoading } = useQuery<Restaurant>({
    queryKey: ['restaurant', id],
    queryFn: () => apiGet<Restaurant>(`/admin/restaurants/${id}`),
  });

  const toggleStatus = async () => {
    if (!restaurant) return;
    const newStatus = restaurant.status === 'active' ? 'disabled' : 'active';
    await apiPatch(`/admin/restaurants/${id}/status`, { status: newStatus });
    queryClient.invalidateQueries({ queryKey: ['restaurant', id] });
  };

  if (isLoading) {
    return <RestaurantDetailLoading />;
  }

  if (!restaurant) {
    return <RestaurantDetailEmptyState />;
  }

  return <RestaurantDetailContent restaurant={restaurant} onToggleStatus={toggleStatus} />;
}
