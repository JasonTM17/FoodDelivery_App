'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('support.sla');

  if (sla.overdue) {
    return (
      <Badge variant="destructive" className={cn('gap-1', className)} data-testid="sla-badge">
        {t('overdue')}
      </Badge>
    );
  }

  const variant = sla.percentRemaining > 0.5 ? 'success' : sla.percentRemaining > 0.25 ? 'warning' : 'destructive';
  const label = sla.percentRemaining > 0.5
    ? t('remainingPercent', { percent: Math.round(sla.percentRemaining * 100) })
    : sla.percentRemaining > 0.25
    ? t('expiringSoon')
    : t('almostOverdue');

  return (
    <Badge variant={variant} className={cn('gap-1', className)} data-testid="sla-badge">
      {label}
    </Badge>
  );
}
