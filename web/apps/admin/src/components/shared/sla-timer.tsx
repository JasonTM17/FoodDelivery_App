'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface SlaTimerProps {
  deadline: Date | string;
  label?: string;
  className?: string;
  onOverdue?: () => void;
}

export default function SlaTimer({ deadline, label, className, onOverdue }: SlaTimerProps) {
  const t = useTranslations('support.sla');
  const [minutesLeft, setMinutesLeft] = useState<number>(0);
  const [overdue, setOverdue] = useState(false);

  useEffect(() => {
    const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;

    const tick = () => {
      const diff = deadlineDate.getTime() - Date.now();
      const mins = Math.floor(diff / 60000);
      setMinutesLeft(mins);
      if (mins <= 0 && !overdue) {
        setOverdue(true);
        onOverdue?.();
      }
    };

    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, [deadline, overdue, onOverdue]);

  const formatTime = (totalMin: number): string => {
    const absMin = Math.abs(totalMin);
    const h = Math.floor(absMin / 60);
    const m = absMin % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-xs font-medium',
        overdue ? 'text-red-600' : minutesLeft < 60 ? 'text-amber-600' : 'text-muted-foreground',
        className
      )}
      data-testid="sla-timer"
    >
      <Clock className="h-3.5 w-3.5" />
      <span>
        {overdue
          ? t('overdueBy', { time: formatTime(minutesLeft) })
          : t('remainingTime', { time: formatTime(minutesLeft) })}
        {label && ` • ${label}`}
      </span>
    </div>
  );
}
