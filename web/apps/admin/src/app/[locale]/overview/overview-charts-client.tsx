'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { useChartData } from '@/hooks/use-chart-data';
import { usePeriodComparison } from '@/hooks/use-period-comparison';
import ChartExportMenu from '@/components/charts/chart-export-menu';
import DriverOnlineLineChart from '@/components/charts/driver-online-line-chart';
import OrderStatusStackedBar from '@/components/charts/order-status-stacked-bar';
import RevenueAreaChart from '@/components/charts/revenue-area-chart';
import TopRestaurantsBar from '@/components/charts/top-restaurants-bar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function OverviewChartsClient() {
  const t = useTranslations('overviewCharts');
  const { data } = useChartData({ period: '30d' });
  const { compareEnabled, setCompareEnabled } = usePeriodComparison();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t('sectionTitle')}</h2>
        <Button
          variant={compareEnabled ? 'default' : 'outline'}
          size="sm"
          aria-pressed={compareEnabled}
          onClick={() => setCompareEnabled(!compareEnabled)}
        >
          {compareEnabled ? t('comparing') : t('compare')}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title={t('cards.revenueTitle')}
          description={t('cards.revenueDescription')}
          exportMenu={
            <ChartExportMenu
              chartName="revenue"
              csvData={data.revenue as unknown as Record<string, unknown>[]}
            />
          }
        >
          <RevenueAreaChart data={data.revenue} comparePeriod={compareEnabled} />
        </ChartCard>

        <ChartCard
          title={t('cards.orderStatusTitle')}
          description={t('cards.orderStatusDescription')}
          exportMenu={
            <ChartExportMenu
              chartName="order-status"
              csvData={data.orderStatus as unknown as Record<string, unknown>[]}
            />
          }
        >
          <OrderStatusStackedBar data={data.orderStatus} />
        </ChartCard>

        <ChartCard
          title={t('cards.driverOnlineTitle')}
          description={t('cards.driverOnlineDescription')}
          exportMenu={
            <ChartExportMenu
              chartName="driver-online"
              csvData={data.driverOnline as unknown as Record<string, unknown>[]}
            />
          }
        >
          <DriverOnlineLineChart data={data.driverOnline} />
        </ChartCard>

        <ChartCard
          title={t('cards.topRestaurantsTitle')}
          description={t('cards.topRestaurantsDescription')}
          exportMenu={
            <ChartExportMenu
              chartName="top-restaurants"
              csvData={data.topRestaurants as unknown as Record<string, unknown>[]}
            />
          }
        >
          <TopRestaurantsBar data={data.topRestaurants} />
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  description,
  exportMenu,
  children,
}: {
  title: string;
  description: string;
  exportMenu: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {exportMenu}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
