import { describe, expect, it, vi } from 'vitest';
import type { KpiData } from '@/components/kpi/kpi-card';
import {
  localizeOverviewKpis,
  type OverviewKpiTranslationKey,
} from '@/app/[locale]/overview/overview-kpi-localization';

const translations: Record<OverviewKpiTranslationKey, string> = {
  'kpis.revenue': 'Doanh thu',
  'kpis.orders': 'Đơn hàng',
  'kpis.users': 'Người dùng hoạt động',
  'kpis.restaurants': 'Nhà hàng',
  'kpis.drivers': 'Tài xế online',
};

function metric(key: string, label: string): KpiData {
  return {
    key,
    label,
    value: 1,
    formattedValue: '1',
    delta: 0,
    sparkline: [1],
    drillDownHref: '/overview',
  };
}

describe('overview KPI localization', () => {
  it('uses stable metric keys instead of English API labels for supported KPIs', () => {
    const translate = vi.fn((key: OverviewKpiTranslationKey) => translations[key]);

    const localized = localizeOverviewKpis(
      [
        metric('revenue', 'Revenue'),
        metric('orders', 'Orders'),
        metric('users', 'Active users'),
        metric('restaurants', 'Restaurants'),
        metric('drivers', 'Online drivers'),
      ],
      translate,
    );

    expect(localized.map((kpi) => kpi.label)).toEqual([
      'Doanh thu',
      'Đơn hàng',
      'Người dùng hoạt động',
      'Nhà hàng',
      'Tài xế online',
    ]);
    expect(translate).toHaveBeenCalledTimes(5);
  });

  it('keeps an unknown API metric label instead of inventing a business label', () => {
    const translate = vi.fn((key: OverviewKpiTranslationKey) => translations[key]);

    expect(localizeOverviewKpis([metric('future_metric', 'Future metric')], translate)).toEqual([
      metric('future_metric', 'Future metric'),
    ]);
    expect(translate).not.toHaveBeenCalled();
  });
});
