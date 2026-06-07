'use client';

import { use } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Star, Store, MapPin, Phone, Mail } from 'lucide-react';
import { Link } from '@/navigation';
import OrderStatusBadge from '@/components/badges/order-status-badge';
import { RestaurantKpiCard } from './restaurant-kpi-card';

interface Restaurant {
  id: string;
  name: string;
  owner: { name: string; email: string; phone: string };
  cuisine: string;
  rating: number;
  totalOrders: number;
  revenue: number;
  status: string;
  address: string;
  description: string;
  createdAt: string;
  recentOrders: {
    id: string;
    orderCode: string;
    customer: { name: string };
    total: number;
    status: string;
    createdAt: string;
  }[];
}

export default function RestaurantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
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
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-48 animate-pulse rounded-lg bg-muted" />
          <div className="h-48 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-destructive">Không tìm thấy nhà hàng</p>
        <Button asChild><Link href="/restaurants">Quay lại</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/restaurants">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{restaurant.name}</h1>
            <Badge variant={restaurant.status === 'active' ? 'success' : 'secondary'}>
              {restaurant.status === 'active' ? 'Đang mở' : 'Đã khóa'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{restaurant.cuisine}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Kích hoạt</span>
          <Switch
            checked={restaurant.status === 'active'}
            onCheckedChange={toggleStatus}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin nhà hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {restaurant.description && (
                <p className="text-sm text-muted-foreground">{restaurant.description}</p>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{restaurant.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  <span>{restaurant.cuisine}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Đơn hàng gần đây</CardTitle>
              <CardDescription>Những đơn hàng gần nhất của nhà hàng</CardDescription>
            </CardHeader>
            <CardContent>
              {restaurant.recentOrders && restaurant.recentOrders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã đơn</TableHead>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Tổng tiền</TableHead>
                      <TableHead>Ngày</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {restaurant.recentOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderCode}</TableCell>
                        <TableCell>{order.customer?.name}</TableCell>
                        <TableCell>
                          <OrderStatusBadge status={order.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(order.total)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Chưa có đơn hàng nào
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin chủ sở hữu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-muted-foreground" />
                <span>{restaurant.owner?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{restaurant.owner?.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{restaurant.owner?.phone}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thống kê</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Đánh giá</span>
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  {restaurant.rating.toFixed(1)}
                </div>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tổng đơn hàng</span>
                <span className="font-medium">{restaurant.totalOrders}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Doanh thu</span>
                <span className="font-medium">{formatCurrency(restaurant.revenue || 0)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ngày tạo</span>
                <span>{formatDate(restaurant.createdAt)}</span>
              </div>
            </CardContent>
          </Card>
          <RestaurantKpiCard restaurantId={restaurant.id} />
        </div>
      </div>
    </div>
  );
}
