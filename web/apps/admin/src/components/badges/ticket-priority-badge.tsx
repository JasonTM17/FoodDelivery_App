'use client';

import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

const priorityStyles: Record<string, string> = {
  low: 'bg-muted text-muted-foreground border-border',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  urgent: 'bg-red-100 text-red-700 border-red-200',
};

interface TicketPriorityBadgeProps {
  priority: string;
}

export default function TicketPriorityBadge({ priority }: TicketPriorityBadgeProps) {
  const t = useTranslations('support.priorities');
  const normalized = priority.toLowerCase();
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        priorityStyles[normalized] || 'bg-muted text-muted-foreground border-border'
      )}
    >
      {normalized in priorityStyles ? t(normalized) : priority}
    </span>
  );
}
