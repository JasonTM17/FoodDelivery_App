'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { apiGet, apiGetEnvelope } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import OrderStatusBadge from '@/components/badges/order-status-badge';
import { useTableFilters } from '@/hooks/use-table-filters';
import { useDebouncedSearch } from '@/hooks/use-debounced-search';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import OrderDetailSheet, { type OrderDetail } from './order-detail-sheet';

interface OrdersPage {
  orders: OrderDetail[];
  meta: { page: number; limit: number; total: number };
}

const ORDER_STATUSES = [
  'all',
  'restaurant_pending',
  'restaurant_accepted',
  'preparing',
  'ready_for_pickup',
  'driver_assigned',
  'delivering',
  'delivered',
  'completed',
  'cancelled',
] as const;

export default function OrdersTableClient() {
  const t = useTranslations('orders');
  const { page, setPage, filter: status, setFilter: setStatus, prevPage, nextPage } =
    useTableFilters();
  const { value: search, setValue: setSearch, debouncedValue } = useDebouncedSearch();
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery<OrdersPage>({
    queryKey: ['orders', page, status, debouncedValue],
    queryFn: async () => {
      const response = await apiGetEnvelope<OrderDetail[]>('/admin/orders', {
        params: {
          page,
          limit: 15,
          status: status === 'all' ? undefined : status,
          search: debouncedValue || undefined,
        },
      });
      return {
        orders: response.data,
        meta: response.meta ?? { page, limit: 15, total: response.data.length },
      };
    },
  });

  const totalPages = Math.max(1, Math.ceil((data?.meta.total ?? 0) / (data?.meta.limit ?? 15)));

  const handleViewOrder = async (orderId: string) => {
    try {
      setSelectedOrder(await apiGet<OrderDetail>(`/admin/orders/${orderId}`));
    } catch {
      setSelectedOrder(data?.orders.find((order) => order.id === orderId) ?? null);
    }
    setSheetOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>{t('listTitle')}</CardTitle>
              <CardDescription>
                {data ? t('count', { count: data.meta.total }) : t('loading')}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  aria-label={t('searchLabel')}
                  placeholder={t('searchPlaceholder')}
                  className="w-full pl-8 sm:w-56"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full sm:w-48" aria-label={t('statusFilter')}>
                  <SelectValue placeholder={t('statusFilter')} />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((value) => (
                    <SelectItem key={value} value={value}>{t(`statuses.${value}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3" aria-label={t('loading')}>
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="h-12 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : isError ? (
            <div role="alert" className="flex h-32 flex-col items-center justify-center gap-3 text-sm text-destructive">
              <span>{(error as { status?: number })?.status === 403 ? t('permissionDenied') : t('loadError')}</span>
              <Button variant="outline" size="sm" onClick={() => refetch()}>{t('retry')}</Button>
            </div>
          ) : data && data.orders.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('orderCode')}</TableHead>
                    <TableHead>{t('customer')}</TableHead>
                    <TableHead>{t('restaurant')}</TableHead>
                    <TableHead>{t('driver')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead className="text-right">{t('total')}</TableHead>
                    <TableHead>{t('date')}</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.orders.map((order) => (
                    <TableRow key={order.id} className="cursor-pointer" onClick={() => handleViewOrder(order.id)}>
                      <TableCell className="font-medium">{order.orderCode}</TableCell>
                      <TableCell>{order.customer?.name || '—'}</TableCell>
                      <TableCell>{order.restaurant?.name || '—'}</TableCell>
                      <TableCell>{order.driver?.name || t('noDriver')}</TableCell>
                      <TableCell><OrderStatusBadge status={order.status} /></TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(order.total)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t('viewOrder', { code: order.orderCode })}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleViewOrder(order.id);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">{t('page', { page: data.meta.page, totalPages })}</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={prevPage} disabled={page <= 1}>
                    <ChevronLeft className="h-4 w-4" />{t('previousPage')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => nextPage(totalPages)} disabled={page >= totalPages}>
                    {t('nextPage')}<ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div role="status" className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              {t('emptyTitle')}
            </div>
          )}
        </CardContent>
      </Card>

      <OrderDetailSheet
        order={selectedOrder}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onStatusChange={() => refetch()}
      />
    </>
  );
}
