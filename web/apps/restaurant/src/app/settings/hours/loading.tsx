import { Clock } from 'lucide-react';

export default function HoursLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="h-6 w-40 skeleton mb-1" />
            <div className="h-4 w-28 skeleton" />
          </div>
        </div>
        <div className="h-9 w-28 skeleton rounded-lg" />
      </div>
      <div className="card mb-6">
        <div className="h-5 w-32 skeleton mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex items-center gap-4 py-2">
              <div className="h-4 w-20 skeleton" />
              <div className="h-5 w-20 skeleton rounded" />
              <div className="h-9 w-32 skeleton rounded-lg" />
              <div className="h-4 w-4 skeleton rounded" />
              <div className="h-9 w-32 skeleton rounded-lg" />
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="h-5 w-36 skeleton mb-4" />
        <div className="flex gap-3 mb-4">
          <div className="h-9 w-44 skeleton rounded-lg" />
          <div className="h-9 flex-1 skeleton rounded-lg" />
          <div className="h-9 w-20 skeleton rounded-lg" />
        </div>
      </div>
    </div>
  );
}
