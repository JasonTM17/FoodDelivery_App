'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import type { AdminKpisResponse } from '@foodflow/api-client';
import { apiGet } from '@/lib/api';

interface UseKpiOptions {
  period?: string;
  comparePeriod?: string;
}

export function useKpi(options?: UseKpiOptions) {
  const period = options?.period || 'today';
  const compare = options?.comparePeriod || 'yesterday';

  return useSuspenseQuery<AdminKpisResponse>({
    queryKey: ['admin-kpis', period, compare],
    queryFn: () => apiGet<AdminKpisResponse>('/admin/kpis', { params: { period, compare } }),
    refetchInterval: 30000,
  });
}
