'use client';

import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, ArrowUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface TicketPriorityBadgeProps {
  priority: string;
  size?: 'sm' | 'md';
}

const priorityConfig: Record<string, { variant: 'success' | 'warning' | 'destructive' | 'default'; icon: React.ComponentType<{ className?: string }> }> = {
  critical: { variant: 'destructive', icon: AlertTriangle },
  urgent: { variant: 'destructive', icon: AlertTriangle },
  high: { variant: 'destructive', icon: ArrowUp },
  medium: { variant: 'warning', icon: Clock },
  normal: { variant: 'default', icon: Clock },
  low: { variant: 'success', icon: Clock },
};

export default function TicketPriorityBadge({ priority, size = 'md' }: TicketPriorityBadgeProps) {
  const t = useTranslations('support.priorities');
  const normalized = priority.toLowerCase();
  const config = priorityConfig[normalized] || priorityConfig.normal;
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={size === 'sm' ? 'gap-0.5 text-[10px] px-1.5 py-0' : 'gap-1 text-xs'}
    >
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      {normalized in priorityConfig ? t(normalized) : priority}
    </Badge>
  );
}
