'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import type { HolidayClosure } from '@/lib/types';

interface HolidayClosuresCardProps {
  closures: HolidayClosure[];
  onChange: (closures: HolidayClosure[]) => void;
}

export function HolidayClosuresCard({ closures, onChange }: HolidayClosuresCardProps) {
  const t = useTranslations('settings.hoursEditor.holidays');
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const sortedClosures = useMemo(
    () => [...closures].sort((first, second) => first.date.localeCompare(second.date)),
    [closures],
  );
  const isDuplicateDate = Boolean(date) && sortedClosures.some((closure) => closure.date === date);

  const handleAdd = () => {
    if (!date || isDuplicateDate) return;
    const trimmedReason = reason.trim();
    const nextClosures = [
      ...sortedClosures,
      {
        date,
        reason: trimmedReason ? trimmedReason : null,
      },
    ].sort((first, second) => first.date.localeCompare(second.date));
    onChange(nextClosures);
    setDate('');
    setReason('');
  };

  const handleRemove = (dateToRemove: string) => {
    onChange(sortedClosures.filter((closure) => closure.date !== dateToRemove));
  };

  return (
    <div className="card mb-6">
      <h2 className="mb-1 text-base font-semibold text-gray-900">{t('title')}</h2>
      <p className="mb-4 text-sm text-gray-500">{t('description')}</p>
      <div className="mb-3 flex gap-3">
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="input-field w-44"
          aria-label={t('dateLabel')}
        />
        <input
          type="text"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={t('reasonPlaceholder')}
          className="input-field flex-1"
          aria-label={t('reasonLabel')}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!date || isDuplicateDate}
          className="btn-secondary shrink-0 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          {t('add')}
        </button>
      </div>
      {isDuplicateDate && <p className="mb-3 text-sm text-amber-600">{t('duplicate')}</p>}
      {sortedClosures.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
          {t('empty')}
        </div>
      ) : (
        <ul className="space-y-2" aria-label={t('listLabel')}>
          {sortedClosures.map((closure) => (
            <li
              key={closure.date}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2"
            >
              <div>
                <time dateTime={closure.date} className="text-sm font-medium text-gray-900">
                  {closure.date}
                </time>
                <p className="text-sm text-gray-500">{closure.reason || t('noReason')}</p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(closure.date)}
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                aria-label={t('removeWithDate', { date: closure.date })}
              >
                <Trash2 className="h-4 w-4" />
                {t('remove')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
