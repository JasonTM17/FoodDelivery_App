'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { apiGet, apiPatch } from '@/lib/api';
import { RestaurantDetailContent } from './restaurant-detail-content';
import { RestaurantDetailEmptyState, RestaurantDetailLoading } from './restaurant-detail-state-panels';
import type { Restaurant } from './restaurant-detail-types';
import { normalizeRestaurantDetail, type RawRestaurant } from '../restaurants-table-client';

type RawRestaurantPageDetail = RawRestaurant & {
  description?: string;
  revenue?: number | null;
  recentOrders?: Restaurant['recentOrders'];
};

function normalizeRestaurantPageDetail(restaurant: RawRestaurantPageDetail): Restaurant {
  const normalized = normalizeRestaurantDetail(restaurant);
  return {
    ...normalized,
    description: restaurant.description,
    revenue: restaurant.revenue ?? null,
    recentOrders: restaurant.recentOrders ?? [],
  };
}

export default function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: restaurant, isLoading } = useQuery<Restaurant>({
    queryKey: ['restaurant', id],
    queryFn: async () => normalizeRestaurantPageDetail(await apiGet<RawRestaurantPageDetail>(`/admin/restaurants/${id}`)),
  });

  const toggleStatus = async () => {
    if (!restaurant) return;
    await apiPatch(`/admin/restaurants/${id}/status`, { isActive: restaurant.status !== 'active' });
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
