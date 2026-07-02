import { Skeleton } from '@foodflow/ui/skeleton';

export default function ExportJobsLoading() {
  return (
    <div className="space-y-6 p-6" aria-busy="true">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
