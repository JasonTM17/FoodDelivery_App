'use client';

import type { RevenueSummary } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface RevenueSummaryCardsProps {
  summary: RevenueSummary;
  industryAvg?: { avgOrderValue: number; repeatCustomerRate: number };
}

export function RevenueSummaryCards({ summary, industryAvg }: RevenueSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="revenue-summary-cards">
      <KpiCard
        label="Hôm nay"
        value={formatCurrency(summary.total.vnd)}
        delta={summary.delta.vsYesterday}
        sub={`${summary.total.orderCount} đơn`}
      />
      <KpiCard
        label="Giá trị TB đơn"
        value={formatCurrency(summary.avg.orderValue)}
        sub={industryAvg ? `TB ngành: ${formatCurrency(industryAvg.avgOrderValue)}` : undefined}
        delta={industryAvg ? Math.round(((summary.avg.orderValue - industryAvg.avgOrderValue) / industryAvg.avgOrderValue) * 100) : undefined}
      />
      <KpiCard
        label="Giá trị TB/ngày"
        value={formatCurrency(summary.avg.perDay)}
      />
      <KpiCard
        label="Tổng KM"
        value={formatCurrency(summary.bySource.find(s => s.source === 'promotion')?.vnd || 0)}
        sub={`${summary.bySource.find(s => s.source === 'promotion')?.pct || 0}% doanh thu`}
      />
    </div>
  );
}

function KpiCard({ label, value, sub, delta }: { label: string; value: string; sub?: string; delta?: number | null }) {
  return (
    <div className="card text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      {delta !== undefined && delta !== null && delta !== 0 && (
        <p className={cn(
          'flex items-center justify-center gap-0.5 text-xs mt-1',
          delta > 0 ? 'text-green-600' : 'text-red-500'
        )}>
          {delta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {delta > 0 ? '+' : ''}{delta}%
        </p>
      )}
    </div>
  );
}
