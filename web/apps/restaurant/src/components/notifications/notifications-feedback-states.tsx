import { Bell } from 'lucide-react';

export function NotificationsLoadingState({ label }: { label: string }) {
  return (
    <div className="space-y-2" aria-label={label}>
      <div className="mb-6 h-10 w-40 animate-pulse rounded-lg bg-gray-100" />
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="h-16 animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
      ))}
    </div>
  );
}

export function NotificationsErrorState({
  title,
  error,
  retryLabel,
  onRetry,
}: {
  title: string;
  error: string;
  retryLabel: string;
  onRetry: () => void;
}) {
  return (
    <div className="card text-center">
      <Bell className="mx-auto mb-3 h-10 w-10 text-gray-300" aria-hidden="true" />
      <p className="text-sm font-medium text-gray-900">{title}</p>
      <p className="mt-1 text-sm text-gray-500">{error}</p>
      <button type="button" onClick={onRetry} className="btn-secondary mt-4">
        {retryLabel}
      </button>
    </div>
  );
}
