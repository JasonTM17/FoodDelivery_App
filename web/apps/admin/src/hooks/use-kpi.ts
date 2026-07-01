'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import type { KpiData } from '@/components/kpi/kpi-card';

interface KpiResponse {
  kpis: KpiData[];
}

interface UseKpiOptions {
  period?: string;
  comparePeriod?: string;
}

export function useKpi(options?: UseKpiOptions) {
  const period = options?.period || 'today';
  const compare = options?.comparePeriod || 'yesterday';

  return useSuspenseQuery<KpiResponse>({
    queryKey: ['admin-kpis', period, compare],
    queryFn: () => apiGet<KpiResponse>('/admin/kpis', { params: { period, compare } }),
    refetchInterval: 30000,
  });
}
