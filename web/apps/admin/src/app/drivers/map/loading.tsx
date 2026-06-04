import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader } from '@/components/ui/card';

export default function DriverMapLoading() {
  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <Card className="w-80 flex-shrink-0">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-24" />
        </CardHeader>
        <div className="space-y-2 px-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-1 h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Skeleton className="flex-1 rounded-lg" />
    </div>
  );
}
