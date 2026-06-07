export default function SettingsLoading() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl skeleton" />
        <div>
          <div className="h-6 w-36 skeleton mb-1" />
          <div className="h-4 w-40 skeleton" />
        </div>
      </div>
      <div className="space-y-6 max-w-2xl">
        <div className="card space-y-4">
          <div className="h-5 w-32 skeleton mb-4" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="h-4 w-24 skeleton mb-2" />
              <div className="h-10 w-full skeleton rounded-lg" />
            </div>
          ))}
        </div>
        <div className="card space-y-3">
          <div className="h-5 w-28 skeleton mb-4" />
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex items-center gap-4 py-2">
              <div className="h-4 w-20 skeleton" />
              <div className="h-4 w-16 skeleton" />
              <div className="h-9 w-32 skeleton rounded-lg" />
              <div className="h-4 skeleton" />
              <div className="h-9 w-32 skeleton rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
