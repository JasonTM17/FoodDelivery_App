import { Star } from 'lucide-react';

export default function ReviewsLoading() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
          <Star className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <div className="h-6 w-48 skeleton mb-1" />
          <div className="h-4 w-32 skeleton" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="kpi-card space-y-3">
            <div className="h-4 w-28 skeleton" />
            <div className="h-8 w-20 skeleton" />
          </div>
        ))}
      </div>
      <div className="card mb-4">
        <div className="h-9 w-full skeleton rounded-lg" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full skeleton shrink-0" />
              <div>
                <div className="h-4 w-32 skeleton mb-1" />
                <div className="h-3.5 w-24 skeleton" />
              </div>
            </div>
            <div className="h-4 w-full skeleton" />
            <div className="h-4 w-3/4 skeleton" />
            <div className="h-16 w-full skeleton rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
