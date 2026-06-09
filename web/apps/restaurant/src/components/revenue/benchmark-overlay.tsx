'use client';

import { TrendingUp, TrendingDown, Minus, Target } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

interface BenchmarkMetric {
  label: string;
  yourValue: number;
  industryAvg: number;
  format?: 'currency' | 'percent' | 'number';
  higherIsBetter: boolean;
}

interface BenchmarkOverlayProps {
  title: string;
  metrics: BenchmarkMetric[];
  className?: string;
}

function formatValue(value: number, format?: 'currency' | 'percent' | 'number'): string {
  if (format === 'currency') return formatCurrency(value);
  if (format === 'percent') return `${value.toFixed(1)}%`;
  return value.toLocaleString('vi-VN');
}

function DeltaBadge({ yourValue, industryAvg, higherIsBetter }: { yourValue: number; industryAvg: number; higherIsBetter: boolean }) {
  if (industryAvg === 0) return <Minus className="h-4 w-4 text-gray-300" />;
  const delta = ((yourValue - industryAvg) / industryAvg) * 100;
  const isFlat = Math.abs(delta) < 1;
  const isGood = higherIsBetter ? yourValue >= industryAvg : yourValue <= industryAvg;

  if (isFlat) return <Minus className="h-4 w-4 text-gray-400" />;

  return (
    <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium', isGood ? 'text-green-600' : 'text-red-600')}>
      {yourValue >= industryAvg ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
      {Math.abs(delta).toFixed(0)}%
    </span>
  );
}

export function BenchmarkOverlay({ title, metrics, className }: BenchmarkOverlayProps) {
  return (
    <div className={cn('card', className)}>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
          <Target className="h-4 w-4 text-purple-600" />
        </div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      </div>

      <div className="space-y-4">
        {metrics.map((m) => {
          const yourPct = Math.max(0, Math.min(100, (m.yourValue / (m.industryAvg || 1)) * 100));
          return (
            <div key={m.label} className="rounded-lg border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">{m.label}</p>
                <DeltaBadge yourValue={m.yourValue} industryAvg={m.industryAvg} higherIsBetter={m.higherIsBetter} />
              </div>

              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-lg font-bold text-gray-900">{formatValue(m.yourValue, m.format)}</span>
                <span className="text-sm text-gray-400">/ {formatValue(m.industryAvg, m.format)} TB ngành</span>
              </div>

              <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="absolute inset-y-0 left-0 w-px bg-gray-300 z-10" style={{ left: '50%' }} />
                <div
                  className={cn('h-full rounded-full', m.yourValue >= m.industryAvg ? (m.higherIsBetter ? 'bg-green-400' : 'bg-red-400') : (m.higherIsBetter ? 'bg-red-400' : 'bg-green-400'))}
                  style={{ width: `${Math.min(yourPct, 100)}%` }}
                />
              </div>

              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-400">0</span>
                <span className="text-xs text-gray-400">TB ngành</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
