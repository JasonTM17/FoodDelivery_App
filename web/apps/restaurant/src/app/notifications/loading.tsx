import { Bell } from 'lucide-react';

export default function NotificationsLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
            <Bell className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <div className="h-6 w-32 skeleton mb-1" />
            <div className="h-4 w-40 skeleton" />
          </div>
        </div>
        <div className="h-9 w-48 skeleton rounded-lg" />
      </div>
      <div className="flex gap-1 mb-4 border-b border-gray-200 pb-0">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 w-20 skeleton rounded-t-lg" />
        ))}
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg skeleton shrink-0" />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="h-4 w-48 skeleton" />
                  <div className="h-3.5 w-16 skeleton" />
                </div>
                <div className="h-4 w-full skeleton" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
