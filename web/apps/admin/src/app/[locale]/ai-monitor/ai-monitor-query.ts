import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import type { AiMonitorOverview } from './ai-monitor-types';

export function useAiMonitorOverview() {
  return useQuery<AiMonitorOverview>({
    queryKey: ['ai-monitor-overview'],
    queryFn: () => apiGet<AiMonitorOverview>('/admin/ai-monitor'),
    refetchInterval: 30_000,
  });
}
