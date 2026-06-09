export default function InsightsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-6 w-48 skeleton" />
      <div className="card space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl skeleton shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 skeleton" />
              <div className="h-3 w-full skeleton" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card h-64" />
        <div className="card h-64" />
      </div>
    </div>
  );
}
