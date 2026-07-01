'use client';

import type { PromotionChannel } from '@/lib/types';
import { getChannelLabel, getChannelCost } from '@/lib/promotion-engine';
import { cn } from '@/lib/utils';

interface PromotionChannelSelectorProps {
  value: PromotionChannel[];
  onChange: (channels: PromotionChannel[]) => void;
}

const ALL_CHANNELS: PromotionChannel[] = ['in_app', 'push', 'email', 'sms'];

export function PromotionChannelSelector({ value, onChange }: PromotionChannelSelectorProps) {
  const toggle = (ch: PromotionChannel) => {
    const next = value.includes(ch) ? value.filter(c => c !== ch) : [...value, ch];
    onChange(next);
  };

  return (
    <div className="space-y-3" data-testid="promotion-channel-selector">
      <h4 className="text-sm font-semibold text-gray-900">Kênh phân phối</h4>
      <div className="space-y-2">
        {ALL_CHANNELS.map((ch) => {
          const selected = value.includes(ch);
          const cost = getChannelCost(ch);
          return (
            <label
              key={ch}
              className={cn(
                'flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors',
                selected ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-brand-300'
              )}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggle(ch)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600"
                />
                <span className="text-sm text-gray-900">{getChannelLabel(ch)}</span>
              </div>
              <span className="text-xs text-gray-500">
                {cost === 0 ? 'Miễn phí' : `${cost.toLocaleString()}đ/tin`}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
