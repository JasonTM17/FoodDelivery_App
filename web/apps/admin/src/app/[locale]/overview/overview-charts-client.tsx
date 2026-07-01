'use client';

import { useChartData } from '@/hooks/use-chart-data';
import { usePeriodComparison } from '@/hooks/use-period-comparison';
import RevenueAreaChart from '@/components/charts/revenue-area-chart';
import OrderStatusStackedBar from '@/components/charts/order-status-stacked-bar';
import DriverOnlineLineChart from '@/components/charts/driver-online-line-chart';
import TopRestaurantsBar from '@/components/charts/top-restaurants-bar';
import ChartExportMenu from '@/components/charts/chart-export-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function OverviewChartsClient() {
  const { data } = useChartData({ period: '30d' });
  const { compareEnabled, setCompareEnabled } = usePeriodComparison();

  if (!data) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-80 animate-pulse rounded-lg bg-muted" />
        <div className="h-80 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Phân tích</h2>
        <div className="flex items-center gap-2">
          <Button
            variant={compareEnabled ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCompareEnabled(!compareEnabled)}
          >
            {compareEnabled ? 'Đang so sánh' : 'So sánh kỳ trước'}
          </Button>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Doanh thu 30 ngày</CardTitle>
              <CardDescription>Biểu đồ doanh thu hàng ngày</CardDescription>
            </div>
            <ChartExportMenu chartName="revenue" csvData={data.revenue as unknown as Record<string, unknown>[]} />
          </CardHeader>
          <CardContent>
            <RevenueAreaChart data={data.revenue} comparePeriod={compareEnabled} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Đơn hàng theo trạng thái</CardTitle>
              <CardDescription>Phân bố trạng thái đơn hàng</CardDescription>
            </div>
            <ChartExportMenu chartName="order-status" csvData={data.orderStatus as unknown as Record<string, unknown>[]} />
          </CardHeader>
          <CardContent>
            <OrderStatusStackedBar data={data.orderStatus} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Tài xế online theo giờ</CardTitle>
              <CardDescription>Số tài xế hoạt động mỗi giờ</CardDescription>
            </div>
            <ChartExportMenu chartName="driver-online" csvData={data.driverOnline as unknown as Record<string, unknown>[]} />
          </CardHeader>
          <CardContent>
            <DriverOnlineLineChart data={data.driverOnline} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top 10 nhà hàng</CardTitle>
              <CardDescription>Theo doanh thu</CardDescription>
            </div>
            <ChartExportMenu chartName="top-restaurants" csvData={data.topRestaurants as unknown as Record<string, unknown>[]} />
          </CardHeader>
          <CardContent>
            <TopRestaurantsBar data={data.topRestaurants} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
