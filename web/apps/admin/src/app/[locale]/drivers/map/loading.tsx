export default function DriverMapLoading() {
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4 lg:flex-row">
      <div className="w-full rounded-lg border bg-card p-4 lg:w-80">
        <div className="mb-4 h-5 w-40 rounded bg-muted" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-2/3 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="min-h-[480px] flex-1 rounded-lg border bg-muted/40" />
    </div>
  );
}
