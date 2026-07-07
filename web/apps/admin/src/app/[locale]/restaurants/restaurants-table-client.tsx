'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Star, Store } from 'lucide-react';
import { apiGet, apiPatch } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import RestaurantDetailSheet, { type RestaurantDetail } from './restaurant-detail-sheet';

interface RestaurantsResponse {
  restaurants: RestaurantDetail[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RawRestaurant {
  id: string;
  name: string;
  owner?: RestaurantDetail['owner'];
  profiles?: { user?: { fullName?: string | null; email?: string | null; phone?: string | null } }[];
  cuisine?: string;
  cuisineTypes?: string[];
  rating?: number | string | null;
  totalOrders?: number | null;
  status?: string;
  isActive?: boolean;
  address?: string;
  addressLine?: string;
  createdAt: string;
}

interface RawRestaurantsResponse {
  restaurants: RawRestaurant[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

function normalizeRestaurantStatus(restaurant: RawRestaurant): string {
  if (typeof restaurant.isActive === 'boolean') return restaurant.isActive ? 'active' : 'disabled';
  return restaurant.status === 'active' ? 'active' : 'disabled';
}

export function normalizeRestaurantDetail(restaurant: RawRestaurant): RestaurantDetail {
  const rating = restaurant.rating == null ? null : Number(restaurant.rating);
  const owner = restaurant.owner ?? {
    name: restaurant.profiles?.[0]?.user?.fullName ?? undefined,
    email: restaurant.profiles?.[0]?.user?.email ?? undefined,
    phone: restaurant.profiles?.[0]?.user?.phone ?? undefined,
  };

  return {
    id: restaurant.id,
    name: restaurant.name,
    owner,
    cuisine: restaurant.cuisine ?? restaurant.cuisineTypes?.join(', ') ?? '—',
    rating: rating !== null && Number.isFinite(rating) ? rating : null,
    totalOrders: restaurant.totalOrders ?? null,
    status: normalizeRestaurantStatus(restaurant),
    address: restaurant.address ?? restaurant.addressLine ?? '—',
    createdAt: restaurant.createdAt,
  };
}

export function normalizeRestaurantsResponse(response: RawRestaurantsResponse): RestaurantsResponse {
  const page = response.meta?.page ?? response.page ?? 1;
  const limit = response.meta?.limit ?? response.limit ?? 20;
  const total = response.meta?.total ?? response.total ?? response.restaurants.length;
  return {
    restaurants: response.restaurants.map(normalizeRestaurantDetail),
    total,
    page,
    limit,
    totalPages: response.meta?.totalPages ?? response.totalPages ?? Math.max(1, Math.ceil(total / limit)),
  };
}

export default function RestaurantsTableClient() {
  const t = useTranslations('restaurants');
  const queryClient = useQueryClient();
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantDetail | null>(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data, isLoading } = useQuery<RestaurantsResponse>({
    queryKey: ['restaurants'],
    queryFn: async () => normalizeRestaurantsResponse(await apiGet<RawRestaurantsResponse>('/admin/restaurants')),
  });

  const handleViewRestaurant = async (restaurantId: string) => {
    setSelectedRestaurantId(restaurantId);
    setSelectedRestaurant(null);
    setDetailError(false);
    setIsDetailLoading(true);
    setSheetOpen(true);
    try {
      const restaurant = await apiGet<RestaurantDetail>(`/admin/restaurants/${restaurantId}`);
      setSelectedRestaurant(restaurant);
    } catch {
      setDetailError(true);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleSheetOpenChange = (open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setSelectedRestaurant(null);
      setDetailError(false);
      setIsDetailLoading(false);
    }
  };

  const toggleStatus = async (restaurantId: string, currentStatus: string) => {
    const isActive = currentStatus !== 'active';
    const newStatus = isActive ? 'active' : 'disabled';
    await apiPatch(`/admin/restaurants/${restaurantId}/status`, { isActive });
    queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    if (selectedRestaurant?.id === restaurantId) {
      setSelectedRestaurant((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('listTitle')}</CardTitle>
          <CardDescription>
            {data ? t('count', { count: data.total }) : t('loading')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="h-12 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : data && data.restaurants.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('columns.restaurant')}</TableHead>
                  <TableHead>{t('columns.owner')}</TableHead>
                  <TableHead>{t('columns.cuisine')}</TableHead>
                  <TableHead>{t('columns.rating')}</TableHead>
                  <TableHead>{t('columns.totalOrders')}</TableHead>
                  <TableHead>{t('columns.status')}</TableHead>
                  <TableHead className="w-24">{t('columns.activation')}</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.restaurants.map((restaurant) => (
                  <TableRow key={restaurant.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-muted-foreground" />
                        {restaurant.name}
                      </div>
                    </TableCell>
                    <TableCell>{restaurant.owner?.name || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{restaurant.cuisine}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span>{restaurant.rating === null ? '—' : restaurant.rating.toFixed(1)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{restaurant.totalOrders ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={restaurant.status === 'active' ? 'success' : 'secondary'}>
                        {restaurant.status === 'active' ? t('statusActive') : t('statusDisabled')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={restaurant.status === 'active'}
                        onCheckedChange={() => toggleStatus(restaurant.id, restaurant.status)}
                        aria-label={t('toggleStatus', { name: restaurant.name })}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewRestaurant(restaurant.id)}
                        aria-label={t('viewRestaurant', { name: restaurant.name })}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              {t('empty')}
            </div>
          )}
        </CardContent>
      </Card>

      <RestaurantDetailSheet
        restaurant={selectedRestaurant}
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        onStatusChange={toggleStatus}
        isLoading={isDetailLoading}
        loadError={detailError}
        onRetry={selectedRestaurantId ? () => handleViewRestaurant(selectedRestaurantId) : undefined}
      />
    </>
  );
}
