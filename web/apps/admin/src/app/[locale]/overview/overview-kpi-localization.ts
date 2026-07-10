import type { KpiData } from '@/components/kpi/kpi-card';

export type OverviewKpiTranslationKey =
  | 'kpis.revenue'
  | 'kpis.orders'
  | 'kpis.users'
  | 'kpis.restaurants'
  | 'kpis.drivers';

export const overviewKpiLabelKeys: Record<string, OverviewKpiTranslationKey> = {
  revenue: 'kpis.revenue',
  orders: 'kpis.orders',
  users: 'kpis.users',
  restaurants: 'kpis.restaurants',
  drivers: 'kpis.drivers',
};

export function localizeOverviewKpis(
  kpis: readonly KpiData[],
  translate: (key: OverviewKpiTranslationKey) => string,
): KpiData[] {
  return kpis.map((kpi) => {
    const translationKey = overviewKpiLabelKeys[kpi.key];

    return translationKey
      ? { ...kpi, label: translate(translationKey) }
      : kpi;
  });
}
