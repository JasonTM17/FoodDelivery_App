'use client';

import { Button } from '@/components/ui/button';
import { UtensilsCrossed, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="vi">
      <body className="bg-background">
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
            <UtensilsCrossed className="h-10 w-10 text-primary" />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Lỗi hệ thống</h1>
            <p className="text-sm text-muted-foreground max-w-md">
              Đã xảy ra lỗi nghiêm trọng. Vui lòng thử tải lại trang hoặc liên hệ quản trị viên.
            </p>
            {error.message && (
              <p className="text-xs text-muted-foreground/60 font-mono mt-1">
                {error.message}
              </p>
            )}
          </div>
          <Button onClick={reset} size="lg">
            <RefreshCw className="mr-2 h-4 w-4" />
            Tải lại trang
          </Button>
        </div>
      </body>
    </html>
  );
}
