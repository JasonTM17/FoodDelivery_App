'use client';

import KpiCard, { type KpiData } from './kpi-card';

interface KpiGridProps {
  kpis: KpiData[];
  loading?: boolean;
}

function KpiCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 rounded bg-muted" />
        <div className="h-5 w-16 rounded bg-muted" />
      </div>
      <div className="mt-4 h-8 w-32 rounded bg-muted" />
      <div className="mt-2 h-8 w-full rounded bg-muted" />
    </div>
  );
}

export default function KpiGrid({ kpis, loading }: KpiGridProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-testid="kpi-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-testid="kpi-grid">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.key} kpi={kpi} data-testid="kpi-card" />
      ))}
    </div>
  );
}
