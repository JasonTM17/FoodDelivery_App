'use client';

import { useState, useCallback } from 'react';

export type PeriodOption = 'today' | '7d' | '30d' | '90d';

export function usePeriodComparison(defaultPeriod: PeriodOption = '30d') {
  const [period, setPeriod] = useState<PeriodOption>(defaultPeriod);
  const [compareEnabled, setCompareEnabled] = useState(true);

  const getDates = useCallback((p: PeriodOption, offsetDays: number = 0): { from: string; to: string } => {
    const now = new Date();
    now.setDate(now.getDate() - offsetDays);
    const to = now.toISOString().split('T')[0];

    const from = new Date(now);
    switch (p) {
      case 'today':
        from.setDate(from.getDate());
        break;
      case '7d':
        from.setDate(from.getDate() - 7);
        break;
      case '30d':
        from.setDate(from.getDate() - 30);
        break;
      case '90d':
        from.setDate(from.getDate() - 90);
        break;
    }
    return { from: from.toISOString().split('T')[0], to };
  }, []);

  const current = getDates(period);
  const previous = compareEnabled ? getDates(period, getPeriodDays(period)) : current;

  return {
    period,
    setPeriod,
    compareEnabled,
    setCompareEnabled,
    current,
    previous,
  };
}

function getPeriodDays(period: PeriodOption): number {
  switch (period) {
    case 'today': return 1;
    case '7d': return 7;
    case '30d': return 30;
    case '90d': return 90;
  }
}
