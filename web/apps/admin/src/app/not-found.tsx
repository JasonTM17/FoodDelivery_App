'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex h-96 flex-col items-center justify-center gap-4">
      <FileQuestion className="h-12 w-12 text-muted-foreground" />
      <div className="text-center">
        <h2 className="text-lg font-semibold">Không tìm thấy trang</h2>
        <p className="text-sm text-muted-foreground">Trang bạn yêu cầu không tồn tại.</p>
      </div>
      <Button asChild>
        <Link href="/overview">Về trang chủ</Link>
      </Button>
    </div>
  );
}
