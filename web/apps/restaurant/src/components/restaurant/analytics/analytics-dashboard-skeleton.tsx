'use client';

export function AnalyticsDashboardSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-6" role="status" aria-label={label}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="kpi-card space-y-3">
            <div className="flex justify-between">
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-8 w-8 rounded-lg" />
            </div>
            <div className="skeleton h-8 w-32" />
            <div className="skeleton h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card"><div className="skeleton h-56" /></div>
        <div className="card"><div className="skeleton h-56" /></div>
      </div>
    </div>
  );
}
