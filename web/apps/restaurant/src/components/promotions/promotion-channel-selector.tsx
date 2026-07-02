'use client';

import { useTranslations } from 'next-intl';
import { useId } from 'react';
import type { PromotionChannel } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PromotionChannelSelectorProps {
  value: PromotionChannel[];
  onChange: (channels: PromotionChannel[]) => void;
}

const ALL_CHANNELS: PromotionChannel[] = ['in_app', 'push', 'email', 'sms'];

export function PromotionChannelSelector({ value, onChange }: PromotionChannelSelectorProps) {
  const t = useTranslations('promotions.channelSelector');
  const fieldsetId = useId();

  const toggle = (ch: PromotionChannel) => {
    const next = value.includes(ch) ? value.filter(c => c !== ch) : [...value, ch];
    onChange(next);
  };

  return (
    <fieldset className="space-y-3" data-testid="promotion-channel-selector">
      <legend className="text-sm font-semibold text-gray-900">{t('title')}</legend>
      <div className="space-y-2">
        {ALL_CHANNELS.map((ch) => {
          const selected = value.includes(ch);
          const inputId = `${fieldsetId}-${ch}`;
          const descriptionId = `${inputId}-description`;
          const channelLabel = t(`channels.${ch}.label`);
          return (
            <label
              key={ch}
              htmlFor={inputId}
              className={cn(
                'flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                selected ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-brand-300'
              )}
            >
              <input
                id={inputId}
                type="checkbox"
                checked={selected}
                onChange={() => toggle(ch)}
                aria-label={t('toggleAria', { channel: channelLabel })}
                aria-describedby={descriptionId}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600"
              />
              <div className="min-w-0">
                <span className="block text-sm font-medium text-gray-900">{channelLabel}</span>
                <span id={descriptionId} className="block text-xs text-gray-500">
                  {t(`channels.${ch}.description`)}
                </span>
              </div>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
