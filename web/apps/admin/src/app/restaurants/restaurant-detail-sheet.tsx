'use client';

import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Star, Store } from 'lucide-react';

export interface RestaurantDetail {
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

interface RestaurantDetailSheetProps {
  restaurant: RestaurantDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (id: string, currentStatus: string) => void;
}

export default function RestaurantDetailSheet({
  restaurant,
  open,
  onOpenChange,
  onStatusChange,
}: RestaurantDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Chi tiết nhà hàng</SheetTitle>
          <SheetDescription>{restaurant?.name || ''}</SheetDescription>
        </SheetHeader>
        {restaurant && (
          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" />
                <span className="text-lg font-semibold">{restaurant.name}</span>
              </div>
              <Badge variant={restaurant.status === 'active' ? 'success' : 'secondary'}>
                {restaurant.status === 'active' ? 'Đang mở' : 'Đã khóa'}
              </Badge>
            </div>

            <Separator />

            <div className="space-y-3 text-sm">
              <h4 className="font-medium">Thông tin chủ sở hữu</h4>
              <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                <p><span className="text-muted-foreground">Tên:</span> {restaurant.owner?.name}</p>
                <p><span className="text-muted-foreground">Email:</span> {restaurant.owner?.email}</p>
                <p><span className="text-muted-foreground">SĐT:</span> {restaurant.owner?.phone}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ẩm thực</span>
                <span>{restaurant.cuisine}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Đánh giá</span>
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  {restaurant.rating.toFixed(1)}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tổng đơn hàng</span>
                <span>{restaurant.totalOrders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Địa chỉ</span>
                <span className="text-right max-w-[200px]">{restaurant.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ngày tạo</span>
                <span>{formatDate(restaurant.createdAt)}</span>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Kích hoạt nhà hàng</span>
              <Switch
                checked={restaurant.status === 'active'}
                onCheckedChange={() => onStatusChange(restaurant.id, restaurant.status)}
              />
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
