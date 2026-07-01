'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Clock, Phone, MapPin, User } from 'lucide-react';

interface RestaurantOverview {
  description: string;
  address: string;
  cuisine: string;
  phone: string;
  owner: { name: string; email: string; phone: string };
  hours?: { day: string; open: string; close: string }[];
  metrics?: { todayOrders: number; todayRevenue: number; avgPrepTime: number; completionRate: number };
}

export default function RestaurantOverviewTab({ restaurant }: { restaurant: { id: string; description: string; address: string; cuisine: string; hours?: { open: string; close: string }[]; phone?: string; owner: { name: string; email: string; phone: string } } }) {
  const { data: overview } = useQuery<RestaurantOverview>({
    queryKey: ['restaurant-overview', restaurant.id],
    queryFn: () => apiGet<RestaurantOverview>(`/admin/restaurants/${restaurant.id}/overview`),
    enabled: !!restaurant.id,
  });

  const info = overview || restaurant;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin chung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">{info.description || 'Chưa có mô tả'}</p>
          <Separator />
          <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{info.address}</span></div>
          <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span>{info.cuisine}</span></div>
          {info.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span>{info.phone}</span></div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Giờ hoạt động</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {info.hours?.length ? info.hours.map((h, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-muted-foreground">{h.open} - {h.close}</span>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          )) : <p className="text-muted-foreground">Chưa cập nhật giờ hoạt động</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chủ sở hữu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Tên</span><span>{info.owner?.name}</span></div>
          <Separator />
          <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{info.owner?.email}</span></div>
          <Separator />
          <div className="flex justify-between"><span className="text-muted-foreground">SĐT</span><span>{info.owner?.phone}</span></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chỉ số hôm nay</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Đơn mới</span><span className="font-medium">{overview?.metrics?.todayOrders ?? 0}</span></div>
          <Separator />
          <div className="flex justify-between"><span className="text-muted-foreground">Doanh thu</span><span className="font-medium">{formatCurrency(overview?.metrics?.todayRevenue ?? 0)}</span></div>
          <Separator />
          <div className="flex justify-between"><span className="text-muted-foreground">TG chuẩn bị TB</span><span className="font-medium">{overview?.metrics?.avgPrepTime ?? 0} phút</span></div>
          <Separator />
          <div className="flex justify-between"><span className="text-muted-foreground">Tỷ lệ hoàn thành</span><span className="font-medium">{overview?.metrics?.completionRate ?? 0}%</span></div>
        </CardContent>
      </Card>
    </div>
  );
}
