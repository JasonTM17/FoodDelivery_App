'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Tabs, TabsContent, TabsList, TabsTrigger } from '@foodflow/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-provider';
import { formatVnd, formatDateTime } from '@/lib/format';
import { useLanguage } from '@/lib/language-context';
import type { DriverEarnings, DriverEarningsSummary } from '@/lib/types';
import { ErrorBlock, LoadingBlock } from '@/components/feedback';

const PERIODS = [
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: '90d', label: '90 days' },
];

export default function EarningsPage() {
  const router = useRouter();
  const { isAuthenticated, isAuthChecked } = useAuth();
  const { locale } = useLanguage();
  const [today, setToday] = useState<DriverEarnings | null>(null);
  const [summary, setSummary] = useState<DriverEarningsSummary | null>(null);
  const [period, setPeriod] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  const load = useCallback(async (targetPeriod: string) => {
    setLoading(true);
    setError(null);
    try {
      const [todayResult, summaryResult] = await Promise.all([
        api.get<DriverEarnings>('/driver/earnings?period=today'),
        api.get<DriverEarningsSummary>(`/driver/earnings/summary?period=${targetPeriod}`),
      ]);
      setToday(todayResult);
      setSummary(summaryResult);
    } catch (err) {
      const status = (err as { status?: number })?.status;
      if (status === 404) {
        setUnavailable(true);
      } else {
        setError('Could not load earnings.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthChecked) return;
    if (!isAuthenticated) {
      router.replace('/login?next=/earnings');
      return;
    }
    void load(period);
  }, [isAuthChecked, isAuthenticated, load, router, period]);

  if (!isAuthChecked || loading) return <LoadingBlock label="Loading earnings" />;
  if (unavailable) {
    return (
      <ErrorBlock
        title="Earnings unavailable"
        message="The earnings service is not available for this account yet."
      />
    );
  }
  if (error) return <ErrorBlock message={error} onRetry={() => load(period)} />;

  const maxDay = Math.max(1, ...(summary?.byDay.map((d) => d.amount) ?? [1]));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">{locale === "vi" ? "Thu nhập" : "Earnings"}</h1>

      <Card className="p-4">
        <p className="text-sm text-muted-foreground">{locale === "vi" ? "Hôm nay" : "Today"}</p>
        <p className="mt-1 text-3xl font-bold text-gray-900">
          {formatVnd(today?.totalEarnings ?? 0)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {today?.totalOrders ?? 0} trip{(today?.totalOrders ?? 0) === 1 ? '' : 's'}
          {today && today.totalOrders > 0 && ` · ${formatVnd(today.averagePerOrder)} avg`}
        </p>
      </Card>

      <Tabs value={period} onValueChange={setPeriod}>
        <TabsList aria-label="Earnings period">
          {PERIODS.map((p) => (
            <TabsTrigger key={p.id} value={p.id}>
              {p.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {PERIODS.map((p) => (
          <TabsContent key={p.id} value={p.id} className="pt-3">
            <Card className="p-4">
              <div className="flex items-baseline justify-between">
                <p className="text-sm text-muted-foreground">{p.label}</p>
                <p className="font-semibold text-gray-900">
                  {formatVnd(summary?.totalVnd ?? 0)} · {summary?.tripCount ?? 0} trips
                </p>
              </div>
              <div
                className="mt-4 flex h-28 items-end gap-1"
                role="img"
                aria-label="Daily earnings chart"
              >
                {(summary?.byDay ?? []).map((day) => (
                  <div
                    key={day.date}
                    className="flex-1 rounded-t bg-primary/80"
                    style={{ height: `${Math.max(4, (day.amount / maxDay) * 100)}%` }}
                    title={`${day.date}: ${formatVnd(day.amount)} · ${day.tripCount} trips`}
                  />
                ))}
              </div>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {(today?.entries ?? []).length > 0 && (
        <Card className="p-4">
          <h2 className="mb-2 font-semibold text-gray-900">Today&apos;s trips</h2>
          <ul className="divide-y text-sm">
            {(today?.entries ?? []).map((entry) => (
              <li key={entry.orderId} className="flex justify-between gap-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{entry.restaurantName}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(entry.completedAt)} · {entry.orderCode}
                  </span>
                </span>
                <span className="shrink-0 font-semibold text-green-700">
                  +{formatVnd(entry.amount)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
