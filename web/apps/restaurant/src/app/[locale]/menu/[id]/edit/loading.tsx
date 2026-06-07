export default function MenuEditLoading() {
  return (
    <div>
      <div className="h-8 w-32 skeleton rounded mb-4" />
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl skeleton" />
        <div>
          <div className="h-6 w-40 skeleton mb-1" />
          <div className="h-4 w-28 skeleton" />
        </div>
      </div>
      <div className="card max-w-2xl space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-1">
            <div className="h-4 w-24 skeleton" />
            <div className="h-10 w-full skeleton rounded-lg" />
          </div>
        ))}
        <div className="h-40 w-40 skeleton rounded-lg" />
        <div className="flex justify-end pt-4 border-t">
          <div className="h-10 w-28 skeleton rounded-lg" />
        </div>
      </div>
    </div>
  );
}
