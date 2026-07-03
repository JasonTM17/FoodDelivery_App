import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ChartExportMenu, { serializeChartCsv } from '@/components/charts/chart-export-menu';
import DriverOnlineLineChart from '@/components/charts/driver-online-line-chart';
import OrderStatusStackedBar from '@/components/charts/order-status-stacked-bar';
import RevenueAreaChart from '@/components/charts/revenue-area-chart';
import TopRestaurantsBar from '@/components/charts/top-restaurants-bar';
import OrderDensityHeatmap from '@/components/heatmap/order-density-heatmap';

describe('overview analytics accessibility', () => {
  it('provides tabular revenue data including the comparison period', () => {
    render(
      <RevenueAreaChart
        comparePeriod
        data={[{ date: '2026-07-01', revenue: 120000, prevRevenue: 90000 }]}
      />,
    );

    expect(screen.getByText('tables.revenueCaption')).toBeInTheDocument();
    expect(screen.getByText('tables.previousRevenue')).toBeInTheDocument();
    expect(screen.getByText('2026-07-01')).toBeInTheDocument();
  });

  it('provides tabular status, driver, and restaurant chart data', () => {
    const { rerender } = render(
      <OrderStatusStackedBar
        data={[
          {
            date: '2026-07-01',
            pending: 1,
            confirmed: 2,
            delivering: 3,
            completed: 4,
            cancelled: 0,
          },
        ]}
      />,
    );
    expect(screen.getByText('tables.orderStatusCaption')).toBeInTheDocument();

    rerender(<DriverOnlineLineChart data={[{ hour: 12, count: 8, avgPayout: 45000 }]} />);
    expect(screen.getByText('tables.driverCaption')).toBeInTheDocument();

    rerender(
      <TopRestaurantsBar
        data={[{ id: 'restaurant-1', name: 'Lotus', revenue: 500000, orderCount: 12, rating: 4.8 }]}
      />,
    );
    expect(screen.getByText('tables.restaurantsCaption')).toBeInTheDocument();
    expect(screen.getByText('Lotus')).toBeInTheDocument();
  });

  it('supports keyboard inspection and a table alternative for the heatmap', () => {
    render(<OrderDensityHeatmap cells={[{ day: 0, hour: 0, count: 3 }]} />);

    const firstCell = screen.getByTestId('heatmap-cell-0-0');
    fireEvent.focus(firstCell);

    expect(screen.getByText('heatmap.tooltip')).toBeInTheDocument();
    expect(screen.getByText('tables.heatmapCaption')).toBeInTheDocument();
  });
});

describe('chart CSV export', () => {
  it('writes a UTF-8 BOM and safely quotes commas, quotes, and line breaks', () => {
    const csv = serializeChartCsv([
      {
        restaurant: 'Lotus, Central',
        note: 'He said "fresh"\nToday',
        formula: '=HYPERLINK("https://example.test")',
        revenue: 120000,
      },
    ]);

    expect(csv).toBe(
      '\uFEFF"restaurant","note","formula","revenue"\r\n"Lotus, Central","He said ""fresh""\nToday","\'=HYPERLINK(""https://example.test"")","120000"',
    );
  });

  it('keeps the export menu renderable without chart data', () => {
    render(<ChartExportMenu chartName="revenue" csvData={[]} />);
    expect(screen.getByRole('button', { name: 'export.button' })).toBeInTheDocument();
  });
});
