'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { EmptyState } from '@foodflow/ui/empty-state';
import { Utensils } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  imageUrl?: string;
}

interface MenuCategory {
  category: string;
  items: MenuItem[];
}

export default function RestaurantMenuTab({ restaurantId }: { restaurantId: string }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ categories: MenuCategory[] }>({
    queryKey: ['restaurant-menu', restaurantId],
    queryFn: () => apiGet(`/admin/restaurants/${restaurantId}/menu`),
  });

  const toggleAvailability = async (itemId: string, available: boolean) => {
    await apiPatch(`/admin/restaurants/${restaurantId}/menu/${itemId}`, { available: !available });
    queryClient.invalidateQueries({ queryKey: ['restaurant-menu', restaurantId] });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (!data?.categories?.length) {
    return (
      <EmptyState
        icon={Utensils}
        title="Chưa có món ăn"
        description="Nhà hàng chưa thêm món ăn nào vào thực đơn"
      />
    );
  }

  return (
    <div className="space-y-6">
      {data.categories.map((cat) => (
        <Card key={cat.category}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{cat.category}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên món</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-24">Kích hoạt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cat.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{formatCurrency(item.price)}</TableCell>
                    <TableCell>
                      <Badge variant={item.available ? 'success' : 'secondary'}>
                        {item.available ? 'Còn bán' : 'Đã ẩn'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={item.available}
                        onCheckedChange={() => toggleAvailability(item.id, item.available)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
