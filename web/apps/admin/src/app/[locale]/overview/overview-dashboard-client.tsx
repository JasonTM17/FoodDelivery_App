'use client';

import { useChartData } from '@/hooks/use-chart-data';
import OrderDensityHeatmap from '@/components/heatmap/order-density-heatmap';
import LiveOrderFeed from '@/components/realtime/live-order-feed';
import { parseOverviewHeatmap } from './overview-contract';

export default function OverviewDashboardClient() {
  const { data, isLoading } = useChartData();

  const heatmapCells = parseOverviewHeatmap(data);
  const heatmapLoading = isLoading;

  return (
    <div className="grid gap-6 lg:grid-cols-3" data-testid="dashboard-ready">
      <div className="lg:col-span-2" data-testid="heatmap-section">
        <OrderDensityHeatmap cells={heatmapCells} loading={heatmapLoading} />
      </div>
      <div>
        <LiveOrderFeed />
      </div>
    </div>
  );
}
