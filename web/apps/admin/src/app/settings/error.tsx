'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-96 items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 pt-6">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <div className="text-center">
            <h2 className="text-lg font-semibold">Lỗi tải cài đặt hệ thống</h2>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
          <Button onClick={reset}>Thử lại</Button>
        </CardContent>
      </Card>
    </div>
  );
}
