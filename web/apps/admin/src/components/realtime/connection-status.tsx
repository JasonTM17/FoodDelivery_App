'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { RealtimeConnectionStatus } from '@/hooks/use-realtime-orders';

interface ConnectionStatusProps {
  status: RealtimeConnectionStatus;
  className?: string;
}

const statusConfig: Record<RealtimeConnectionStatus, { color: string; pulse?: boolean }> = {
  connecting: { color: 'bg-yellow-500', pulse: true },
  connected: { color: 'bg-green-500' },
  reconnecting: { color: 'bg-yellow-500', pulse: true },
  disconnected: { color: 'bg-red-500' },
  error: { color: 'bg-red-500' },
};

export default function ConnectionStatus({ status, className }: ConnectionStatusProps) {
  const t = useTranslations('connectionStatus');
  const config = statusConfig[status] ?? statusConfig.disconnected;

  return (
    <div className={cn('flex items-center gap-2', className)} data-testid="connection-status">
      <span
        className={cn('h-2.5 w-2.5 rounded-full', config.color, config.pulse && 'animate-pulse')}
        aria-hidden="true"
      />
      <span className="text-xs text-muted-foreground">{t(status)}</span>
    </div>
  );
}
