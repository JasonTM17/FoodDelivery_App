'use client';

import { formatCompactCurrency, formatCurrency } from '@/lib/utils';
import { useLocale, useTranslations } from 'next-intl';

interface CategoryMixDonutProps {
  data: { categoryId: string; name: string; vnd: number; pct: number }[];
}

const COLORS = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];

export function CategoryMixDonut({ data }: CategoryMixDonutProps) {
  const locale = useLocale();
  const t = useTranslations('revenue.categoryMix');
  const total = data.reduce((sum, item) => sum + item.vnd, 0);
  const radius = 80;
  const circumference = 2 * Math.PI * radius;

  if (data.length === 0 || total <= 0) {
    return (
      <div className="space-y-3" data-testid="category-mix-donut">
        <h4 className="text-sm font-semibold text-gray-900">{t('title')}</h4>
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-gray-500">
          {t('empty')}
        </p>
      </div>
    );
  }

  let accumulated = 0;
  const segments = data.map((d, i) => {
    const pct = d.vnd / total;
    const offset = accumulated * circumference;
    const length = pct * circumference;
    accumulated += pct;
    return { ...d, offset, length, color: COLORS[i % COLORS.length] };
  });

  return (
    <div className="space-y-3" data-testid="category-mix-donut">
      <h4 className="text-sm font-semibold text-gray-900">{t('title')}</h4>

      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <svg
          viewBox="0 0 200 200"
          className="h-44 w-44 shrink-0"
          role="img"
          aria-label={t('chartAria', { total: formatCurrency(total, locale) })}
        >
          <circle cx="100" cy="100" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="28" />
          {segments.map((seg) => (
            <circle
              key={seg.categoryId}
              cx="100" cy="100" r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth="28"
              strokeDasharray={`${seg.length} ${circumference - seg.length}`}
              strokeDashoffset={-seg.offset}
              transform="rotate(-90 100 100)"
              className="transition-all duration-300 hover:opacity-80 cursor-pointer"
            />
          ))}
          <text x="100" y="95" textAnchor="middle" className="text-xl font-bold" fill="#111827">
            {formatCompactCurrency(total, locale)}
          </text>
          <text x="100" y="112" textAnchor="middle" className="text-xs" fill="#4B5563">
            {t('total')}
          </text>
        </svg>

        <div className="w-full flex-1 space-y-1.5">
          {segments.map((seg) => (
            <div key={seg.categoryId} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: seg.color }} aria-hidden="true" />
                <span className="text-gray-700">{seg.name}</span>
              </div>
              <span className="text-gray-500">
                {t('legendValue', {
                  amount: formatCurrency(seg.vnd, locale),
                  pct: seg.pct,
                })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
