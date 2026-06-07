import { ShoppingBag } from 'lucide-react';

export default function OrdersLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
            <ShoppingBag className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <div className="h-6 w-48 skeleton mb-1" />
            <div className="h-4 w-24 skeleton" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((col) => (
          <div key={col} className="rounded-xl border border-gray-200 bg-gray-50/50">
            <div className="p-4 border-b border-gray-200">
              <div className="h-5 w-24 skeleton" />
            </div>
            <div className="p-4 space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="card space-y-3">
                  <div className="h-5 w-32 skeleton" />
                  <div className="h-4 w-full skeleton" />
                  <div className="h-4 w-3/4 skeleton" />
                  <div className="h-4 w-1/2 skeleton" />
                  <div className="h-5 w-20 skeleton" />
                  <div className="flex gap-2 pt-2">
                    <div className="h-8 flex-1 skeleton rounded-lg" />
                    <div className="h-8 flex-1 skeleton rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
