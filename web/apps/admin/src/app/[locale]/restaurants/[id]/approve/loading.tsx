import { Skeleton } from '@/components/ui/skeleton';

export default function RestaurantApproveLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-72" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
      <Skeleton className="h-24 rounded-lg" />
    </div>
  );
}
