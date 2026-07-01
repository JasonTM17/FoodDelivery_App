import { api } from '@/lib/api';
import { exportToCSV, exportToExcel } from '@/lib/export-helpers';
import type { RevenueSummary, IndustryBenchmark, RevenueBreakdownRow } from '@/lib/types';

export async function fetchRevenueSummary(period: string): Promise<RevenueSummary> {
  return api.get<RevenueSummary>(`/restaurant/revenue/summary?days=${period}`);
}

export async function fetchIndustryBenchmark(): Promise<IndustryBenchmark> {
  return api.get<IndustryBenchmark>('/restaurant/revenue/benchmark');
}

export async function fetchRevenueBreakdown(params: {
  startDate: string;
  endDate: string;
  groupBy?: 'day' | 'week' | 'month';
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}): Promise<{ rows: RevenueBreakdownRow[]; total: number }> {
  const searchParams = new URLSearchParams();
  searchParams.set('startDate', params.startDate);
  searchParams.set('endDate', params.endDate);
  if (params.groupBy) searchParams.set('groupBy', params.groupBy);
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortDir) searchParams.set('sortDir', params.sortDir);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  return api.get(`/restaurant/revenue/breakdown?${searchParams.toString()}`);
}

export function exportRevenueCSV(data: Record<string, unknown>[]): void {
  if (data.length === 0) return;
  const rows = data.map((row) => {
    const clean: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(row)) {
      clean[k] = typeof v === 'string' || typeof v === 'number' ? v : String(v);
    }
    return clean;
  });
  exportToCSV(rows, `doanh-thu-${new Date().toISOString().split('T')[0]}`);
}

export function exportRevenueExcel(data: Record<string, unknown>[]): void {
  if (data.length === 0) return;
  const rows = data.map((row) => {
    const clean: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(row)) {
      clean[k] = typeof v === 'string' || typeof v === 'number' ? v : String(v);
    }
    return clean;
  });
  exportToExcel(rows, `doanh-thu-${new Date().toISOString().split('T')[0]}`);
}
