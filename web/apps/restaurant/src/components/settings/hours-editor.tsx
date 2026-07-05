'use client';

import { useCallback, useEffect, useState } from 'react';
import { Clock, RefreshCw, Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import type { DayHours, HolidayClosure, OpeningHours, Restaurant } from '@/lib/types';
import { HolidayClosuresCard } from './holiday-closures-card';
import {
  DAY_ORDER,
  fromOpeningHourPayload,
  toOpeningHourRows,
  type OpeningHoursDay,
} from './hours-editor-helpers';
import { WeeklyHoursCard } from './weekly-hours-card';
import { WeeklyPreviewCard } from './weekly-preview-card';

export function HoursEditor() {
  const t = useTranslations('settings.hoursEditor');
  const [hours, setHours] = useState<OpeningHours | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [canRetryLoad, setCanRetryLoad] = useState(false);
  const [holidayClosures, setHolidayClosures] = useState<HolidayClosure[]>([]);

  const loadHours = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const profile = await api.get<Restaurant>('/restaurant/profile');
      const loadedHours = fromOpeningHourPayload(profile.openingHours);
      if (!loadedHours) {
        setHours(null);
        setHolidayClosures([]);
        setError(t('invalidOpeningHours'));
        setCanRetryLoad(true);
        return;
      }
      setHours(loadedHours);
      setHolidayClosures(normalizeHolidayClosures(profile.holidayClosures));
      setCanRetryLoad(false);
    } catch (err: unknown) {
      setHours(null);
      setHolidayClosures([]);
      setError((err as { message?: string }).message || t('loadError'));
      setCanRetryLoad(true);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadHours();
  }, [loadHours]);

  const updateHour = (day: OpeningHoursDay, field: keyof DayHours, value: string | boolean) => {
    setHours((prev) => (prev ? { ...prev, [day]: { ...prev[day], [field]: value } } : prev));
  };

  const copyToAll = (day: OpeningHoursDay) => {
    if (!hours) return;
    const source = hours[day];
    const updated = { ...hours };
    DAY_ORDER.forEach((targetDay) => {
      updated[targetDay] = { ...source };
    });
    setHours(updated);
  };

  const handleSave = async () => {
    if (!hours) {
      setError(t('invalidOpeningHours'));
      setCanRetryLoad(true);
      return;
    }
    setIsSaving(true);
    setError('');
    setCanRetryLoad(false);
    try {
      await api.patch('/restaurant/profile', {
        openingHours: toOpeningHourRows(hours),
        holidayClosures: toHolidayClosurePayload(holidayClosures),
      });
      setSuccess(t('saveSuccess'));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t('saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <HoursEditorSkeleton />;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-sm text-gray-500">{t('description')}</p>
          </div>
        </div>
        <button type="button" onClick={handleSave} disabled={isSaving || !hours} className="btn-primary">
          <Save className="mr-1.5 h-4 w-4" />
          {isSaving ? t('saving') : t('save')}
        </button>
      </div>

      {error && (
        <HoursAlert
          tone="error"
          message={error}
          retryLabel={canRetryLoad ? t('retry') : undefined}
          onRetry={canRetryLoad ? loadHours : undefined}
        />
      )}
      {success && <HoursAlert tone="success" message={success} />}

      {hours && (
        <>
          <WeeklyHoursCard hours={hours} onUpdateHour={updateHour} onCopyToAll={copyToAll} />
          <HolidayClosuresCard closures={holidayClosures} onChange={setHolidayClosures} />
          <WeeklyPreviewCard hours={hours} />
        </>
      )}
    </div>
  );
}

function HoursAlert({
  tone,
  message,
  retryLabel,
  onRetry,
}: {
  tone: 'error' | 'success';
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
}) {
  const isError = tone === 'error';
  return (
    <div
      className={`mb-4 flex items-center justify-between gap-3 rounded-lg border p-3 text-sm ${
        isError ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'
      }`}
      role={isError ? 'alert' : 'status'}
    >
      <span>{message}</span>
      {isError && onRetry && retryLabel && (
        <button type="button" onClick={onRetry} className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-medium">
          <RefreshCw className="h-3.5 w-3.5" />
          {retryLabel}
        </button>
      )}
    </div>
  );
}

function HoursEditorSkeleton() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="skeleton mb-1 h-6 w-40" />
            <div className="skeleton h-4 w-28" />
          </div>
        </div>
        <div className="skeleton h-9 w-28 rounded-lg" />
      </div>
      <div className="card mb-6">
        <div className="skeleton mb-4 h-5 w-32" />
        <div className="space-y-3">
          {DAY_ORDER.map((day) => (
            <div key={day} className="flex items-center gap-4 py-2">
              <div className="skeleton h-4 w-20" />
              <div className="skeleton h-5 w-20 rounded" />
              <div className="skeleton h-9 w-32 rounded-lg" />
              <div className="skeleton h-4 w-4 rounded" />
              <div className="skeleton h-9 w-32 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function normalizeHolidayClosures(value: Restaurant['holidayClosures']): HolidayClosure[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((closure): closure is HolidayClosure => typeof closure?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(closure.date))
    .map((closure) => ({
      id: closure.id,
      date: closure.date,
      reason: typeof closure.reason === 'string' && closure.reason.trim() ? closure.reason.trim() : null,
    }))
    .sort((first, second) => first.date.localeCompare(second.date));
}

function toHolidayClosurePayload(closures: HolidayClosure[]) {
  return closures.map((closure) => {
    const reason = closure.reason?.trim();
    return reason ? { date: closure.date, reason } : { date: closure.date };
  });
}
