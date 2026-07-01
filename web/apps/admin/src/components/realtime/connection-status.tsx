'use client';

import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { color: string; label: string }> = {
  connected: { color: 'bg-green-500', label: 'Đã kết nối' },
  reconnecting: { color: 'bg-yellow-500', label: 'Đang kết nối lại...' },
  disconnected: { color: 'bg-red-500', label: 'Mất kết nối' },
  error: { color: 'bg-red-500', label: 'Lỗi' },
};

export default function ConnectionStatus({ status, className }: ConnectionStatusProps) {
  const config = statusConfig[status] || statusConfig.disconnected;

  return (
    <div className={cn('flex items-center gap-2', className)} data-testid="connection-status">
      <div className={cn('h-2.5 w-2.5 rounded-full', config.color)} />
      <span className="text-xs text-muted-foreground">{config.label}</span>
    </div>
  );
}
