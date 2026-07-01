'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TicketSlaBadgeProps {
  sla: {
    percentRemaining: number;
    overdue: boolean;
    firstResponseDue?: string;
    resolutionDue?: string;
  };
  className?: string;
}

export default function TicketSlaBadge({ sla, className }: TicketSlaBadgeProps) {
  if (sla.overdue) {
    return (
      <Badge variant="destructive" className={cn('gap-1', className)} data-testid="sla-badge">
        Quá hạn
      </Badge>
    );
  }

  const variant = sla.percentRemaining > 0.5 ? 'success' : sla.percentRemaining > 0.25 ? 'warning' : 'destructive';
  const label = sla.percentRemaining > 0.5
    ? `${Math.round(sla.percentRemaining * 100)}% còn lại`
    : sla.percentRemaining > 0.25
    ? 'Sắp hết hạn'
    : 'Gần quá hạn';

  return (
    <Badge variant={variant} className={cn('gap-1', className)} data-testid="sla-badge">
      {label}
    </Badge>
  );
}
