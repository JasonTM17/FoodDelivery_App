import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BenchmarkOverlay } from '@/components/revenue/benchmark-overlay';
import { CategoryMixDonut } from '@/components/revenue/category-mix-donut';
import { HourOfDayBar } from '@/components/revenue/hour-of-day-bar';
import { PaymentMethodBar } from '@/components/revenue/payment-method-bar';
import { RevenueComparison } from '@/components/revenue/revenue-comparison';
import { RevenueExportButton } from '@/components/revenue/revenue-export-button';
import { RevenueSourcePie } from '@/components/revenue/revenue-source-pie';
import { RevenueSummaryCards } from '@/components/revenue/revenue-summary-cards';
import { DateRangePicker } from '@/components/shared/date-range-picker';
import { exportToCSV, exportToExcel } from '@/lib/export-helpers';
import type { RevenueSummary } from '@/lib/types';

vi.mock('@/lib/export-helpers', () => ({
  exportToCSV: vi.fn(),
  exportToExcel: vi.fn(),
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: (namespace: string) => (
    key: string,
    values?: Record<string, string | number>,
  ) => {
    const messages: Record<string, string> = {
      'revenue.categoryMix.title': 'Revenue by category',
      'revenue.categoryMix.empty': 'No category revenue yet.',
      'revenue.hourly.title': 'Revenue by hour',
      'revenue.hourly.empty': 'No hourly revenue yet.',
      'revenue.hourly.chartAria': 'Hourly revenue bar chart',
      'revenue.hourly.tooltip': '{hour}:00: {amount} ({count} orders)',
      'revenue.hourly.peak': 'Peak hours',
      'revenue.hourly.offPeak': 'Off-peak hours',
      'revenue.hourly.tableCaption': 'Hourly revenue data',
      'revenue.hourly.hourLabel': '{hour}:00',
      'revenue.hourly.columns.hour': 'Hour',
      'revenue.hourly.columns.revenue': 'Revenue',
      'revenue.hourly.columns.orders': 'Orders',
      'revenue.paymentMethods.title': 'Payment methods',
      'revenue.paymentMethods.empty': 'No payment data yet.',
      'revenue.sources.title': 'Order sources',
      'revenue.sources.empty': 'No order-source data yet.',
      'revenue.export.button': 'Export report',
      'revenue.export.emptyDisabled': 'There is no data to export',
      'revenue.export.defaultFilename': 'revenue',
      'revenue.export.menuAria': 'Report export formats',
      'revenue.export.csv': 'Export CSV',
      'revenue.export.excel': 'Export Excel',
      'revenue.benchmark.title': 'Industry benchmark',
      'revenue.benchmark.updatedAt': 'Updated: {date}',
      'revenue.benchmark.cohortSource': 'Anonymous cohort: {count}',
      'revenue.benchmark.platformSource': 'Anonymous platform aggregate: {count}',
      'revenue.benchmark.averageOrderValue': 'Average order value',
      'revenue.benchmark.averageOrderValueProgress': 'Average order value progress',
      'revenue.benchmark.repeatRate': 'Repeat customer rate',
      'revenue.benchmark.repeatRateProgress': 'Repeat customer rate progress',
      'revenue.benchmark.industryAverage': 'Reference average: {value}',
      'revenue.benchmark.refreshCadence': 'Refreshed quarterly',
      'revenue.comparison.title': 'Comparison',
      'revenue.comparison.lastWeek': 'Previous period',
      'revenue.comparison.lastMonth': 'Same period 30 days earlier',
      'revenue.comparison.insufficientData': 'Insufficient data',
      'revenue.comparison.unavailable': 'Unavailable',
      'revenue.totalRevenue': 'Total revenue',
      'revenue.orderCount': '{count} orders',
      'revenue.avgOrderValue': 'Avg order value',
      'revenue.avgPerDay': 'Avg value/day',
      'revenue.promotionTotal': 'Total promo',
      'revenue.revenueShare': '{pct}% of revenue',
      'shared.dateRange.startDate': 'Start date',
      'shared.dateRange.endDate': 'End date',
      'shared.dateRange.presetsAria': 'Quick date ranges',
      'shared.dateRange.presets.last7': '7 days',
      'shared.dateRange.presets.last30': '30 days',
      'shared.dateRange.presets.last90': '90 days',
      'shared.dateRange.presets.last365': '365 days',
    };
    return interpolate(messages[`${namespace}.${key}`] ?? key, values);
  },
}));

const emptySummary: RevenueSummary = {
  total: { vnd: 0, orderCount: 0 },
  avg: { orderValue: 0, perDay: 0 },
  delta: { vsYesterday: null, vsLastWeek: null, vsLastMonth: null },
  byDay: [],
  byCategory: [],
  byHour: [],
  bySource: [],
  byPayment: [],
};

describe('Revenue analytics components', () => {
  beforeEach(() => vi.clearAllMocks());

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders honest empty states and disables exports without rows', () => {
    render(
      <>
        <CategoryMixDonut data={[]} />
        <HourOfDayBar data={[]} />
        <PaymentMethodBar data={[]} />
        <RevenueSourcePie data={[]} />
        <RevenueExportButton data={[]} />
      </>,
    );

    expect(screen.getByText('No category revenue yet.')).toBeVisible();
    expect(screen.getByText('No hourly revenue yet.')).toBeVisible();
    expect(screen.getByText('No payment data yet.')).toBeVisible();
    expect(screen.getByText('No order-source data yet.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Export report' })).toBeDisabled();
    expect(screen.queryByText(/1\s*₫/)).not.toBeInTheDocument();
  });

  it('keeps benchmark progress finite when the reference is zero', () => {
    render(
      <BenchmarkOverlay
        restaurant={{ avgOrderValue: 125_000, repeatRate: 0 }}
        industry={{ avgOrderValue: 0, repeatRate: 0 }}
        cohortSize={4}
        source="platform"
      />,
    );

    const progress = screen.getAllByRole('progressbar');
    expect(progress[0]).toHaveStyle({ width: '100%' });
    expect(progress[1]).toHaveStyle({ width: '0%' });
    expect(screen.getByText('Anonymous platform aggregate: 4')).toBeVisible();
    expect(document.body.innerHTML).not.toContain('Infinity');
  });

  it('provides an accessible data table for the hourly chart', () => {
    render(<HourOfDayBar data={[{ hour: 12, vnd: 250_000, orderCount: 3 }]} />);

    const table = screen.getByRole('table', { name: 'Hourly revenue data' });
    expect(table).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '12:00' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '3' })).toBeInTheDocument();
  });

  it('uses period-total wording and avoids an infinite industry delta', () => {
    render(
      <>
        <RevenueSummaryCards summary={emptySummary} industryAvg={{ avgOrderValue: 0, repeatCustomerRate: 0 }} />
        <RevenueComparison summary={emptySummary} />
      </>,
    );

    expect(screen.getByText('Total revenue')).toBeVisible();
    expect(screen.queryByText('Yesterday')).not.toBeInTheDocument();
    expect(screen.getAllByText('Unavailable')).toHaveLength(2);
    expect(document.body.innerHTML).not.toContain('Infinity');
  });

  it('exports each supported local report format', () => {
    const rows = [{ date: '2026-07-02', net: 125_000 }];
    render(<RevenueExportButton data={rows} filename="revenue-report" />);
    const trigger = screen.getByRole('button', { name: 'Export report' });

    fireEvent.click(trigger);
    const menu = screen.getByRole('menu', { name: 'Report export formats' });
    expect(screen.getByRole('menuitem', { name: 'Export CSV' })).toHaveFocus();
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(screen.getByRole('menuitem', { name: 'Export Excel' })).toHaveFocus();
    fireEvent.keyDown(menu, { key: 'Escape' });
    expect(trigger).toHaveFocus();

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Export CSV' }));
    expect(exportToCSV).toHaveBeenCalledWith(rows, 'revenue-report');

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Export Excel' }));
    expect(exportToExcel).toHaveBeenCalledWith(rows, 'revenue-report');
  });

  it('applies seven-day presets as seven inclusive local calendar days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 2, 1, 30));
    const onChange = vi.fn();
    render(<DateRangePicker value={{ start: '', end: '' }} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: '7 days' }));
    expect(onChange).toHaveBeenCalledWith({ start: '2026-06-26', end: '2026-07-02' });
  });
});

function interpolate(template: string, values?: Record<string, string | number>): string {
  return Object.entries(values ?? {}).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, String(value)),
    template,
  );
}
