'use client';

import { Button } from '@/components/ui/button';
import { FoodFlowLogo } from '@foodflow/ui/foodflow-logo';
import { RefreshCw } from 'lucide-react';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-background">
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
          <FoodFlowLogo showWordmark={false} markClassName="h-20 w-20" />
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight">System error</h1>
            <p className="max-w-md text-sm text-muted-foreground">
              A critical error occurred. Reload the page or contact an administrator if the
              issue continues.
            </p>
          </div>
          <Button onClick={reset} size="lg">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload page
          </Button>
        </div>
      </body>
    </html>
  );
}
