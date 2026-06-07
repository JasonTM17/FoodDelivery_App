export default function RevenueLoading() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl skeleton" />
        <div>
          <div className="h-6 w-36 skeleton mb-1" />
          <div className="h-4 w-24 skeleton" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
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
      <div className="card mb-6">
        <div className="h-5 w-40 skeleton mb-4" />
        <div className="h-72 skeleton" />
      </div>
      <div className="card">
        <div className="h-5 w-36 skeleton mb-4" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="grid grid-cols-12 gap-4 py-3">
            <div className="col-span-1">
              <div className="h-6 w-6 rounded-full skeleton" />
            </div>
            <div className="col-span-5">
              <div className="h-4 w-32 skeleton" />
            </div>
            <div className="col-span-3 flex justify-end">
              <div className="h-4 w-12 skeleton" />
            </div>
            <div className="col-span-3 flex justify-end">
              <div className="h-4 w-20 skeleton" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
