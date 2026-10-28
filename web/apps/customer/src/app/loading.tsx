'use client';

import { Skeleton } from '@foodflow/ui';

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
