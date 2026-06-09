export default function PromotionsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-40 skeleton" />
          <div className="h-4 w-60 skeleton" />
        </div>
        <div className="h-9 w-24 skeleton rounded-lg" />
      </div>
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card h-24 flex items-center p-4">
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 skeleton" />
              <div className="h-3 w-48 skeleton" />
            </div>
            <div className="h-8 w-16 skeleton rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
