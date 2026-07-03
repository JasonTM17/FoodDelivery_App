'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp } from 'lucide-react';
import { EmptyState } from '@foodflow/ui/empty-state';
import { apiGet } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RestaurantFinanceRevenueHistory, type RevenueHistoryRow } from './restaurant-finance-revenue-history';

interface FinanceData {
  revenueHistory: RevenueHistoryRow[];
  payouts: { id: string; amount: number; status: string; period: string; createdAt: string }[];
  totalRevenue: number;
  pendingPayout: number;
  nextPayoutDate: string;
}

const payoutStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

const localizedPayoutStatuses = new Set(['pending', 'processing', 'completed', 'failed']);

export default function RestaurantFinanceTab({ restaurantId }: { restaurantId: string }) {
  const t = useTranslations('restaurantFinanceTab');
  const { data, isLoading } = useQuery<FinanceData>({
    queryKey: ['restaurant-finance', restaurantId],
    queryFn: () => apiGet<FinanceData>(`/admin/restaurants/${restaurantId}/finance`),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!data) return null;

  const statusLabel = (status: string) => {
    return localizedPayoutStatuses.has(status) ? t(`statuses.${status}`) : status;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title={t('totalRevenue')}
          icon={<DollarSign className="h-5 w-5 text-green-500" />}
          value={formatCurrency(data.totalRevenue)}
        />
        <MetricCard
          title={t('pendingPayout')}
          icon={<TrendingUp className="h-5 w-5 text-orange-500" />}
          value={formatCurrency(data.pendingPayout)}
        />
        <MetricCard title={t('nextPayoutDate')} value={formatDate(data.nextPayoutDate)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('revenueHistoryTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {data.revenueHistory?.length > 0 ? (
            <RestaurantFinanceRevenueHistory rows={data.revenueHistory} />
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
              {t('emptyRevenueHistory')}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('payoutHistoryTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.payouts?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('payoutColumns.id')}</TableHead>
                  <TableHead>{t('payoutColumns.amount')}</TableHead>
                  <TableHead>{t('payoutColumns.period')}</TableHead>
                  <TableHead>{t('payoutColumns.status')}</TableHead>
                  <TableHead>{t('payoutColumns.date')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.payouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell className="font-mono text-xs">{payout.id.slice(0, 12)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(payout.amount)}</TableCell>
                    <TableCell>{payout.period}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={payoutStatusColors[payout.status] || ''}>
                        {statusLabel(payout.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(payout.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={DollarSign}
              title={t('emptyPayoutTitle')}
              description={t('emptyPayoutDescription')}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ title, icon, value }: { title: string; icon?: ReactNode; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-2xl font-bold">{value}</span>
        </div>
      </CardContent>
    </Card>
  );
}
