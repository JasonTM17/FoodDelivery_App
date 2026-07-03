export function UserDetailLoadingState() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 animate-pulse rounded bg-muted" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-48 animate-pulse rounded-lg bg-muted lg:col-span-2" />
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}
