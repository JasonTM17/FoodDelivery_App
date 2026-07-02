'use client';

import { useTranslations } from 'next-intl';
import type { PromotionSchedule } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PromotionScheduleEditorProps {
  value: PromotionSchedule;
  onChange: (schedule: PromotionSchedule) => void;
}

const DAYS_OF_WEEK = [
  { value: 1, key: 'mon' }, { value: 2, key: 'tue' },
  { value: 3, key: 'wed' }, { value: 4, key: 'thu' },
  { value: 5, key: 'fri' }, { value: 6, key: 'sat' },
  { value: 0, key: 'sun' },
];

export function PromotionScheduleEditor({ value, onChange }: PromotionScheduleEditorProps) {
  const t = useTranslations('promotions.schedule');

  const updateField = (field: keyof PromotionSchedule, val: unknown) => {
    onChange({ ...value, [field]: val });
  };

  const toggleRecurringDay = (day: number) => {
    const current = value.recurring?.daysOfWeek || [];
    const next = current.includes(day) ? current.filter(d => d !== day) : [...current, day];
    onChange({
      ...value,
      recurring: { ...value.recurring!, type: 'weekly', daysOfWeek: next },
    });
  };

  return (
    <div className="space-y-4" data-testid="promotion-schedule-editor">
      <h4 className="text-sm font-semibold text-gray-900">{t('title')}</h4>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">{t('validFrom')}</label>
          <input
            type="datetime-local"
            value={toInputValue(value.validFrom)}
            onChange={(e) => updateField('validFrom', new Date(e.target.value))}
            className="input-field"
          />
        </div>
        <div>
          <label className="label">{t('validUntil')}</label>
          <input
            type="datetime-local"
            value={toInputValue(value.validUntil)}
            onChange={(e) => updateField('validUntil', new Date(e.target.value))}
            className="input-field"
          />
        </div>
      </div>

      {/* Recurring */}
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!value.recurring}
            onChange={(e) => {
              if (e.target.checked) {
                onChange({ ...value, recurring: { type: 'weekly', daysOfWeek: [] } });
              } else {
                const { recurring, ...rest } = value;
                onChange(rest as PromotionSchedule);
              }
            }}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">{t('recurring')}</span>
        </label>

        {value.recurring && (
          <div className="mt-2 ml-6 space-y-3">
            <div className="flex gap-2">
              <label className={cn(
                'rounded-lg border px-3 py-1.5 text-xs cursor-pointer',
                value.recurring.type === 'weekly' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200'
              )}>
                <input
                  type="radio"
                  name="recurringType"
                  checked={value.recurring.type === 'weekly'}
                  onChange={() => onChange({ ...value, recurring: { ...value.recurring!, type: 'weekly', daysOfWeek: [] } })}
                  className="sr-only"
                />
                {t('weekly')}
              </label>
              <label className={cn(
                'rounded-lg border px-3 py-1.5 text-xs cursor-pointer',
                value.recurring.type === 'monthly' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200'
              )}>
                <input
                  type="radio"
                  name="recurringType"
                  checked={value.recurring.type === 'monthly'}
                  onChange={() => onChange({ ...value, recurring: { type: 'monthly', dayOfMonth: 1 } })}
                  className="sr-only"
                />
                {t('monthly')}
              </label>
            </div>

            {value.recurring.type === 'weekly' && (
              <div className="flex gap-1">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleRecurringDay(day.value)}
                    className={cn(
                      'h-8 w-8 rounded-full text-xs font-medium transition-colors',
                      value.recurring?.daysOfWeek?.includes(day.value)
                        ? 'bg-brand-500 text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    )}
                  >
                    {t(`days.${day.key}`)}
                  </button>
                ))}
              </div>
            )}

            {value.recurring.type === 'monthly' && (
              <div>
                <label className="label">{t('dayOfMonth')}</label>
                <input
                  type="number"
                  value={value.recurring.dayOfMonth || ''}
                  onChange={(e) => onChange({ ...value, recurring: { ...value.recurring!, type: 'monthly', dayOfMonth: parseInt(e.target.value, 10) || 1 } })}
                  className="input-field w-20"
                  min={1}
                  max={28}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function toInputValue(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 16);
}
