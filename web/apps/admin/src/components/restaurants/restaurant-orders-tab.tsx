'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Search, ShoppingBag } from 'lucide-react';
import { EmptyState } from '@foodflow/ui/empty-state';
import { apiGet } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import OrderStatusBadge from '@/components/badges/order-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface OrderEntry {
  id: string;
  orderCode: string;
  customer: { name: string };
  driver: { name: string } | null;
  status: string;
  total: number;
  createdAt: string;
}

interface OrdersResponse {
  orders: OrderEntry[];
  total: number;
}

const pageSize = 15;

export default function RestaurantOrdersTab({ restaurantId }: { restaurantId: string }) {
  const t = useTranslations('restaurantOrdersTab');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery<OrdersResponse>({
    queryKey: ['restaurant-orders', restaurantId, page, statusFilter, search],
    queryFn: () =>
      apiGet<OrdersResponse>(`/admin/restaurants/${restaurantId}/orders`, {
        params: { page, limit: pageSize, status: statusFilter || undefined, search: search || undefined },
      }),
  });

  const totalPages = data ? Math.ceil(data.total / pageSize) : 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchPlaceholder')}
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          className="rounded-md border bg-background px-3 py-2 text-sm"
          value={statusFilter}
          aria-label={t('statusFilter')}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">{t('statuses.all')}</option>
          <option value="pending">{t('statuses.pending')}</option>
          <option value="confirmed">{t('statuses.confirmed')}</option>
          <option value="preparing">{t('statuses.preparing')}</option>
          <option value="delivering">{t('statuses.delivering')}</option>
          <option value="delivered">{t('statuses.delivered')}</option>
          <option value="cancelled">{t('statuses.cancelled')}</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-12 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : !data?.orders?.length ? (
            <EmptyState
              icon={ShoppingBag}
              title={t('emptyTitle')}
              description={t('emptyDescription')}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('columns.orderCode')}</TableHead>
                    <TableHead>{t('columns.customer')}</TableHead>
                    <TableHead>{t('columns.driver')}</TableHead>
                    <TableHead>{t('columns.status')}</TableHead>
                    <TableHead className="text-right">{t('columns.total')}</TableHead>
                    <TableHead>{t('columns.date')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono font-medium">{order.orderCode}</TableCell>
                      <TableCell>{order.customer?.name || '—'}</TableCell>
                      <TableCell>{order.driver?.name || '—'}</TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(order.total)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {data.total > pageSize && (
                <div className="flex items-center justify-between p-4">
                  <span className="text-sm text-muted-foreground">
                    {t('page', { page, totalPages })}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((currentPage) => currentPage - 1)}
                    >
                      {t('previousPage')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page * pageSize >= data.total}
                      onClick={() => setPage((currentPage) => currentPage + 1)}
                    >
                      {t('nextPage')}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
