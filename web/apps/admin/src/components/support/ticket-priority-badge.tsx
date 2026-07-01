'use client';

import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, ArrowUp } from 'lucide-react';

interface TicketPriorityBadgeProps {
  priority: string;
  size?: 'sm' | 'md';
}

const priorityConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'default'; icon: React.ComponentType<{ className?: string }> }> = {
  critical: { label: 'Khẩn cấp', variant: 'destructive', icon: AlertTriangle },
  high: { label: 'Cao', variant: 'destructive', icon: ArrowUp },
  normal: { label: 'Bình thường', variant: 'default', icon: Clock },
  low: { label: 'Thấp', variant: 'success', icon: Clock },
};

export default function TicketPriorityBadge({ priority, size = 'md' }: TicketPriorityBadgeProps) {
  const config = priorityConfig[priority] || priorityConfig.normal;
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={size === 'sm' ? 'gap-0.5 text-[10px] px-1.5 py-0' : 'gap-1 text-xs'}
    >
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      {config.label}
    </Badge>
  );
}
