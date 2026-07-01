'use client';

import type { RevenueSummary } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

interface RevenueComparisonProps {
  summary: RevenueSummary;
}

export function RevenueComparison({ summary }: RevenueComparisonProps) {
  return (
    <div className="space-y-3" data-testid="revenue-comparison">
      <h4 className="text-sm font-semibold text-gray-900">So sánh</h4>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
        <ComparisonCard
          label="Hôm qua"
          value={formatDeltaValue(summary.total.vnd, summary.delta.vsYesterday)}
          delta={summary.delta.vsYesterday}
        />
        <ComparisonCard
          label="Tuần trước"
          value={formatDeltaValue(summary.total.vnd, summary.delta.vsLastWeek)}
          delta={summary.delta.vsLastWeek}
        />
        <ComparisonCard
          label="Tháng trước"
          value={formatDeltaValue(summary.total.vnd, summary.delta.vsLastMonth)}
          delta={summary.delta.vsLastMonth}
        />
      </div>
    </div>
  );
}

function formatDeltaValue(current: number, delta: number | null): string {
  if (delta === null || delta <= -100) return 'Chưa đủ dữ liệu';
  const previous = current / (1 + delta / 100);
  return formatCurrency(Math.abs(current - previous));
}

function ComparisonCard({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta: number | null;
}) {
  const Icon = delta === null || delta === 0 ? Minus : delta > 0 ? TrendingUp : TrendingDown;

  return (
    <div className="rounded-lg border border-gray-100 p-3 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p
        className={cn(
          'mt-1 flex items-center justify-center gap-1 text-sm font-bold',
          delta === null
            ? 'text-gray-400'
            : delta > 0
              ? 'text-green-600'
              : delta < 0
                ? 'text-red-500'
                : 'text-gray-500',
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        {delta === null ? 'N/A' : `${delta > 0 ? '+' : ''}${delta}%`}
      </p>
      <p className="mt-0.5 text-xs text-gray-400">{value}</p>
    </div>
  );
}
