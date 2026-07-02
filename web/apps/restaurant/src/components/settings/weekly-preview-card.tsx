'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { OpeningHours } from '@/lib/types';
import { DAY_ORDER } from './hours-editor-helpers';

export function WeeklyPreviewCard({ hours }: { hours: OpeningHours }) {
  const t = useTranslations('settings.hoursEditor.preview');

  return (
    <div className="card">
      <h2 className="mb-3 text-base font-semibold text-gray-900">{t('title')}</h2>
      <div className="grid grid-cols-7 gap-1">
        {DAY_ORDER.map((day) => {
          const dayHours = hours[day];
          return (
            <div
              key={day}
              className={cn('rounded-lg p-2 text-center', dayHours.isClosed ? 'bg-gray-100' : 'border border-brand-100 bg-brand-50')}
            >
              <p className={cn('mb-1 text-xs font-medium', dayHours.isClosed ? 'text-gray-400' : 'text-brand-700')}>
                {t(`shortDays.${day}`)}
              </p>
              {dayHours.isClosed ? (
                <p className="text-xs text-gray-400">{t('closed')}</p>
              ) : (
                <p className="text-xs text-brand-600">
                  {dayHours.open}
                  <br />
                  {dayHours.close}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
