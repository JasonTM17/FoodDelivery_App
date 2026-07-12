'use client';

import { useTranslations } from 'next-intl';
import { useKpi } from '@/hooks/use-kpi';
import KpiGrid from '@/components/kpi/kpi-grid';
import { parseOverviewKpis } from './overview-contract';
import { localizeOverviewKpis } from './overview-kpi-localization';

export default function OverviewKpiClient() {
  const t = useTranslations('analytics');
  const { data } = useKpi({ period: 'today' });

  return <KpiGrid kpis={localizeOverviewKpis(parseOverviewKpis(data), t)} />;
}
