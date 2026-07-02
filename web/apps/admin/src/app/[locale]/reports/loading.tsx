import { Skeleton } from '@foodflow/ui/skeleton';

export default function ReportsLoading() {
  return (
    <div className="space-y-6 p-6" aria-busy="true">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
