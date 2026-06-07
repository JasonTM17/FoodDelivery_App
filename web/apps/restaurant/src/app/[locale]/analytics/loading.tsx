export default function AnalyticsLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl skeleton" />
          <div>
            <div className="h-6 w-36 skeleton mb-1" />
            <div className="h-4 w-24 skeleton" />
          </div>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3].map((i) => <div key={i} className="h-9 w-24 skeleton rounded-lg" />)}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="kpi-card space-y-3">
            <div className="flex justify-between">
              <div className="h-4 w-24 skeleton" />
              <div className="h-8 w-8 rounded-lg skeleton" />
            </div>
            <div className="h-8 w-32 skeleton" />
            <div className="h-3 w-20 skeleton" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card"><div className="h-64 skeleton" /></div>
        <div className="card"><div className="h-64 skeleton" /></div>
      </div>
    </div>
  );
}
