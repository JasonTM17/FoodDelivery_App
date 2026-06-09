'use client';

import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

interface ComparisonMetric {
  label: string;
  current: number;
  previous: number;
  format?: 'currency' | 'number' | 'percent';
}

interface RevenueComparisonProps {
  title: string;
  periodLabel: string;
  previousPeriodLabel: string;
  metrics: ComparisonMetric[];
  className?: string;
}

function formatValue(value: number, format?: 'currency' | 'number' | 'percent'): string {
  if (format === 'currency') return formatCurrency(value);
  if (format === 'percent') return `${value.toFixed(1)}%`;
  return value.toLocaleString('vi-VN');
}

function DeltaBadge({ current, previous, format }: { current: number; previous: number; format?: 'currency' | 'number' | 'percent' }) {
  if (previous === 0) {
    return <span className="text-xs text-gray-400">--</span>;
  }
  const delta = ((current - previous) / previous) * 100;
  const isUp = delta > 0;
  const isFlat = Math.abs(delta) < 0.1;

  return (
    <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium', isFlat ? 'text-gray-400' : isUp ? 'text-green-600' : 'text-red-600')}>
      {isFlat ? <Minus className="h-3 w-3" /> : isUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {Math.abs(delta).toFixed(1)}%
    </span>
  );
}

export function RevenueComparison({ title, periodLabel, previousPeriodLabel, metrics, className }: RevenueComparisonProps) {
  return (
    <div className={cn('card', className)}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-brand-500" />
            {periodLabel}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-gray-300" />
            {previousPeriodLabel}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-lg border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-1">{m.label}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-gray-900">{formatValue(m.current, m.format)}</span>
              <DeltaBadge current={m.current} previous={m.previous} format={m.format} />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {previousPeriodLabel}: {formatValue(m.previous, m.format)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
