export default function PromotionNewLoading() {
  return (
    <div>
      <div className="h-8 w-32 skeleton rounded mb-4" />
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl skeleton" />
        <div>
          <div className="h-6 w-48 skeleton mb-1" />
          <div className="h-4 w-36 skeleton" />
        </div>
      </div>
      {/* Step indicators */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full skeleton" />
            {i < 4 && <div className="h-1 w-12 skeleton" />}
          </div>
        ))}
      </div>
      <div className="card max-w-2xl space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1">
            <div className="h-4 w-28 skeleton" />
            <div className="h-10 w-full skeleton rounded-lg" />
          </div>
        ))}
        <div className="flex justify-between pt-4 border-t">
          <div className="h-10 w-24 skeleton rounded-lg" />
          <div className="h-10 w-24 skeleton rounded-lg" />
        </div>
      </div>
    </div>
  );
}
