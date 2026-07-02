'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function HolidayClosuresCard() {
  const t = useTranslations('settings.hoursEditor.holidays');

  return (
    <div className="card mb-6">
      <h2 className="mb-1 text-base font-semibold text-gray-900">{t('title')}</h2>
      <p className="mb-4 text-sm text-gray-500">{t('description')}</p>
      <div className="mb-3 flex gap-3">
        <input type="date" disabled className="input-field w-44 opacity-60" aria-label={t('dateLabel')} />
        <input
          type="text"
          disabled
          placeholder={t('reasonPlaceholder')}
          className="input-field flex-1 opacity-60"
          aria-label={t('reasonLabel')}
        />
        <button type="button" disabled className="btn-secondary shrink-0 opacity-60">
          <Plus className="mr-1.5 h-4 w-4" />
          {t('add')}
        </button>
      </div>
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
        {t('degraded')}
      </div>
    </div>
  );
}
