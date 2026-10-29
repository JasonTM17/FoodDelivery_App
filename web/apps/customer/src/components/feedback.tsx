'use client';

import { Skeleton } from '@foodflow/ui';
import { AlertCircle, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function LoadingBlock({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-3 py-6">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
    </div>
  );
}

export function ErrorBlock({
  title = 'Something went wrong',
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 py-10 text-center">
      <AlertCircle className="h-8 w-8 text-red-500" aria-hidden />
      <p className="font-medium text-gray-900">{title}</p>
      {message && <p className="max-w-sm text-sm text-muted-foreground">{message}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-sm font-medium text-primary hover:underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyBlock({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
        <Icon className="h-7 w-7 text-primary" aria-hidden />
      </div>
      <p className="font-medium text-gray-900">{title}</p>
      {children}
    </div>
  );
}
