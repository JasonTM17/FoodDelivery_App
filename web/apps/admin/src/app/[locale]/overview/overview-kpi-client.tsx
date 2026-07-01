'use client';

import { useKpi } from '@/hooks/use-kpi';
import KpiGrid from '@/components/kpi/kpi-grid';

export default function OverviewKpiClient() {
  const { data } = useKpi({ period: 'today' });

  return <KpiGrid kpis={data?.kpis || []} />;
}
