'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { Link } from '@/navigation';

export default function RestaurantApproveError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-4">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <div className="text-center">
        <h2 className="text-lg font-semibold">Lỗi tải trang phê duyệt nhà hàng</h2>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
      <div className="flex gap-2">
        <Button onClick={reset}>Thử lại</Button>
        <Button variant="outline" asChild>
          <Link href="/restaurants">Quay lại</Link>
        </Button>
      </div>
    </div>
  );
}
