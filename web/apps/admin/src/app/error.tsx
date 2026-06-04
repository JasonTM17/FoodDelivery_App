'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-96 flex-col items-center justify-center gap-4">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <div className="text-center">
        <h2 className="text-lg font-semibold">Đã xảy ra lỗi</h2>
        <p className="text-sm text-muted-foreground">{error.message || 'Vui lòng thử lại sau.'}</p>
      </div>
      <Button onClick={reset}>Thử lại</Button>
    </div>
  );
}
