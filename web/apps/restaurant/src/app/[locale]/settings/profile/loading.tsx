import { UserCircle } from 'lucide-react';

export default function ProfileLoading() {
  return (
    <div className="pb-24">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
          <UserCircle className="h-5 w-5 text-brand-600" />
        </div>
        <div>
          <div className="h-6 w-44 skeleton mb-1" />
          <div className="h-4 w-36 skeleton" />
        </div>
      </div>
      <div className="card mb-6 space-y-4">
        <div className="h-5 w-32 skeleton" />
        <div className="w-full aspect-video skeleton rounded-xl" />
        <div className="flex items-center gap-4">
          <div className="h-24 w-24 rounded-full skeleton shrink-0" />
          <div className="h-4 w-56 skeleton" />
        </div>
      </div>
      <div className="card mb-6 space-y-4">
        <div className="h-5 w-36 skeleton" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i}><div className="h-4 w-24 skeleton mb-2" /><div className="h-10 w-full skeleton rounded-lg" /></div>
        ))}
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-7 w-20 skeleton rounded-full" />)}
        </div>
      </div>
      <div className="card mb-6 space-y-4">
        <div className="h-5 w-40 skeleton" />
        <div className="grid grid-cols-2 gap-4">
          <div><div className="h-4 w-28 skeleton mb-2" /><div className="h-10 skeleton rounded-lg" /></div>
          <div><div className="h-4 w-28 skeleton mb-2" /><div className="h-10 skeleton rounded-lg" /></div>
        </div>
        <div className="h-14 skeleton rounded-lg" />
      </div>
    </div>
  );
}
