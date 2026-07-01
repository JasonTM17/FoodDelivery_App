'use client';

import { ArrowRight, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComboConfig {
  buy: number;
  get: number;
  getItemIds: string[];
  comboPrice?: number;
}

interface PromotionComboBuilderProps {
  type: 'bogof' | 'combo';
  value?: ComboConfig;
  onChange: (config: ComboConfig) => void;
}

export function PromotionComboBuilder({ type, value, onChange }: PromotionComboBuilderProps) {
  const config = value || { buy: 2, get: 1, getItemIds: [] };

  return (
    <div className="space-y-3" data-testid="promotion-combo-builder">
      <h4 className="text-sm font-semibold text-gray-900">
        {type === 'bogof' ? 'Cấu hình Mua X tặng Y' : 'Cấu hình Combo'}
      </h4>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Mua</span>
          <input
            type="number"
            value={config.buy}
            onChange={(e) => onChange({ ...config, buy: parseInt(e.target.value, 10) || 1 })}
            className="input-field w-16 text-center"
            min={1}
          />
          <span className="text-sm text-gray-600">món</span>
        </div>

        <ArrowRight className="h-5 w-5 text-brand-500" />

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Tặng</span>
          <input
            type="number"
            value={config.get}
            onChange={(e) => onChange({ ...config, get: parseInt(e.target.value, 10) || 1 })}
            className="input-field w-16 text-center"
            min={1}
          />
          <span className="text-sm text-gray-600">món</span>
        </div>
      </div>

      {type === 'combo' && (
        <div>
          <label className="label">Giá combo</label>
          <input
            type="number"
            value={config.comboPrice ?? ''}
            onChange={(e) => onChange({ ...config, comboPrice: parseInt(e.target.value, 10) || 0 })}
            className="input-field w-32"
            min={0}
            placeholder="VND"
          />
        </div>
      )}
    </div>
  );
}
