import { ArrowLeft } from 'lucide-react';

export default function OrderDetailLoading() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <ArrowLeft className="h-4 w-4 text-gray-300" />
        <div className="h-4 w-32 skeleton" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card space-y-4">
            <div className="h-5 w-24 skeleton" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-48 skeleton" />
                <div className="h-4 w-16 skeleton" />
              </div>
            ))}
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between">
              <div className="h-4 w-20 skeleton" />
              <div className="h-6 w-24 skeleton" />
            </div>
          </div>
          <div className="card space-y-4">
            <div className="h-5 w-24 skeleton" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full skeleton shrink-0" />
                <div className="space-y-1">
                  <div className="h-4 w-32 skeleton" />
                  <div className="h-3 w-20 skeleton" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="card space-y-3">
            <div className="h-5 w-32 skeleton" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full skeleton shrink-0" />
                <div className="space-y-1">
                  <div className="h-4 w-28 skeleton" />
                  <div className="h-3 w-16 skeleton" />
                </div>
              </div>
            ))}
          </div>
          <div className="card space-y-2">
            <div className="h-5 w-32 skeleton" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-20 skeleton" />
                <div className="h-4 w-24 skeleton" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
