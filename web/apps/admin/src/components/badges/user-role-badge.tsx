'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { User, Bike, UtensilsCrossed, ShieldCheck, HelpCircle } from 'lucide-react';

export interface UserRoleBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  role: string;
  size?: 'sm' | 'md';
}

const roleStyles: Record<
  string,
  {
    container: string;
    icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
    dot: string;
    labelKey: string;
  }
> = {
  customer: {
    container:
      'bg-sky-50 text-sky-700 border-sky-200/90 hover:bg-sky-100/70 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
    icon: User,
    dot: 'bg-sky-500',
    labelKey: 'customer',
  },
  driver: {
    container:
      'bg-amber-50 text-amber-800 border-amber-200/90 hover:bg-amber-100/70 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    icon: Bike,
    dot: 'bg-amber-500',
    labelKey: 'driver',
  },
  restaurant: {
    container:
      'bg-emerald-50 text-emerald-700 border-emerald-200/90 hover:bg-emerald-100/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    icon: UtensilsCrossed,
    dot: 'bg-emerald-500',
    labelKey: 'restaurant_owner',
  },
  restaurant_owner: {
    container:
      'bg-emerald-50 text-emerald-700 border-emerald-200/90 hover:bg-emerald-100/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    icon: UtensilsCrossed,
    dot: 'bg-emerald-500',
    labelKey: 'restaurant_owner',
  },
  admin: {
    container:
      'bg-purple-50 text-purple-700 border-purple-200/90 hover:bg-purple-100/70 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
    icon: ShieldCheck,
    dot: 'bg-purple-500',
    labelKey: 'admin',
  },
};

export default function UserRoleBadge({
  role,
  size = 'md',
  className,
  ...props
}: UserRoleBadgeProps) {
  const t = useTranslations('users.roles');
  const normalized = (role || '').toLowerCase();
  const config = roleStyles[normalized];

  const IconComponent = config ? config.icon : HelpCircle;
  const label = config ? t(config.labelKey as any) : role;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border font-semibold tracking-tight shadow-xs transition-colors',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        config?.container ||
          'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300',
        className
      )}
      {...props}
    >
      <IconComponent
        className={cn(size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5', 'shrink-0')}
        aria-hidden="true"
      />
      <span>{label}</span>
    </span>
  );
}
