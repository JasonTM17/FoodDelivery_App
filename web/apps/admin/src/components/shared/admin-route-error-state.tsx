'use client';

import { Button } from '@/components/ui/button';
import { Link } from '@/navigation';
import { AlertTriangle } from 'lucide-react';

interface AdminRouteErrorStateProps {
  title: string;
  description: string;
  retryLabel: string;
  reset: () => void;
  backHref?: string;
  backLabel?: string;
}

export function AdminRouteErrorState({
  title,
  description,
  retryLabel,
  reset,
  backHref,
  backLabel,
}: AdminRouteErrorStateProps) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-4 text-center" role="alert">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={reset}>{retryLabel}</Button>
        {backHref && backLabel && (
          <Button variant="outline" asChild>
            <Link href={backHref}>{backLabel}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
