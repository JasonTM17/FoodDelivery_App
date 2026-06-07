import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsComplianceLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-52" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
