'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Star, Store, Eye } from 'lucide-react';
import Link from 'next/link';

interface Restaurant {
  id: string;
  name: string;
  owner: { name: string; email: string; phone: string };
  cuisine: string;
  rating: number;
  totalOrders: number;
  status: string;
  address: string;
  createdAt: string;
}

interface RestaurantsResponse {
  restaurants: Restaurant[];
  total: number;
}

export default function RestaurantsPage() {
  const queryClient = useQueryClient();
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data, isLoading } = useQuery<RestaurantsResponse>({
    queryKey: ['restaurants'],
    queryFn: () => apiGet<RestaurantsResponse>('/admin/restaurants'),
  });

  const handleViewRestaurant = async (restaurantId: string) => {
    try {
      const restaurant = await apiGet<Restaurant>(`/admin/restaurants/${restaurantId}`);
      setSelectedRestaurant(restaurant);
      setSheetOpen(true);
    } catch {
      const found = data?.restaurants.find((r) => r.id === restaurantId);
      if (found) {
        setSelectedRestaurant(found);
        setSheetOpen(true);
      }
    }
  };

  const toggleStatus = async (restaurantId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    await apiPatch(`/admin/restaurants/${restaurantId}/status`, { status: newStatus });
    queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    if (selectedRestaurant?.id === restaurantId) {
      setSelectedRestaurant((prev) => prev ? { ...prev, status: newStatus } : null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quản lý nhà hàng</h1>
        <p className="text-sm text-muted-foreground">
          Danh sách nhà hàng đối tác
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nhà hàng</CardTitle>
          <CardDescription>
            {data ? `Tổng số: ${data.total} nhà hàng` : 'Đang tải...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : data && data.restaurants.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nhà hàng</TableHead>
                  <TableHead>Chủ sở hữu</TableHead>
                  <TableHead>Ẩm thực</TableHead>
                  <TableHead>Đánh giá</TableHead>
                  <TableHead>Tổng đơn</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-24">Kích hoạt</TableHead>
                  <TableHead className="w-12"></TableHead>
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
                        <span>{restaurant.rating.toFixed(1)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{restaurant.totalOrders}</TableCell>
                    <TableCell>
                      <Badge
                        variant={restaurant.status === 'active' ? 'success' : 'secondary'}
                      >
                        {restaurant.status === 'active' ? 'Đang mở' : 'Đã khóa'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={restaurant.status === 'active'}
                        onCheckedChange={() => toggleStatus(restaurant.id, restaurant.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewRestaurant(restaurant.id);
                        }}
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
              Chưa có nhà hàng nào
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Chi tiết nhà hàng</SheetTitle>
            <SheetDescription>
              {selectedRestaurant?.name || ''}
            </SheetDescription>
          </SheetHeader>
          {selectedRestaurant && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold">{selectedRestaurant.name}</span>
                </div>
                <Badge
                  variant={selectedRestaurant.status === 'active' ? 'success' : 'secondary'}
                >
                  {selectedRestaurant.status === 'active' ? 'Đang mở' : 'Đã khóa'}
                </Badge>
              </div>

              <Separator />

              <div className="space-y-3 text-sm">
                <h4 className="font-medium">Thông tin chủ sở hữu</h4>
                <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                  <p><span className="text-muted-foreground">Tên:</span> {selectedRestaurant.owner?.name}</p>
                  <p><span className="text-muted-foreground">Email:</span> {selectedRestaurant.owner?.email}</p>
                  <p><span className="text-muted-foreground">SĐT:</span> {selectedRestaurant.owner?.phone}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ẩm thực</span>
                  <span>{selectedRestaurant.cuisine}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Đánh giá</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    {selectedRestaurant.rating.toFixed(1)}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tổng đơn hàng</span>
                  <span>{selectedRestaurant.totalOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Địa chỉ</span>
                  <span className="text-right max-w-[200px]">{selectedRestaurant.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ngày tạo</span>
                  <span>{formatDate(selectedRestaurant.createdAt)}</span>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Kích hoạt nhà hàng</span>
                <Switch
                  checked={selectedRestaurant.status === 'active'}
                  onCheckedChange={() =>
                    toggleStatus(selectedRestaurant.id, selectedRestaurant.status)
                  }
                />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
