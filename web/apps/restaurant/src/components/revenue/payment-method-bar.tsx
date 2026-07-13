'use client';

import { formatCurrency } from '@/lib/utils';
import { useLocale, useTranslations } from 'next-intl';

interface PaymentMethodBarProps {
  data: { method: string; vnd: number; pct: number }[];
}

const METHOD_KEYS = {
  cash: 'methods.cash',
  card: 'methods.card',
  wallet: 'methods.wallet',
  sepay: 'methods.sepay',
  vnpay: 'methods.vnpay',
} as const;

const METHOD_COLORS: Record<string, string> = {
  cash: '#10B981',
  card: '#3B82F6',
  wallet: '#F97316',
  sepay: '#8B5CF6',
  vnpay: '#EF4444',
};

export function PaymentMethodBar({ data }: PaymentMethodBarProps) {
  const locale = useLocale();
  const t = useTranslations('revenue.paymentMethods');
  const maxValue = Math.max(...data.map((item) => item.vnd), 1);

  return (
    <div className="space-y-3" data-testid="payment-method-bar">
      <h4 className="text-sm font-semibold text-gray-900">{t('title')}</h4>

      {data.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-gray-500">
          {t('empty')}
        </p>
      ) : (
        <div className="space-y-2">
          {data.map((item) => {
            const labelKey = METHOD_KEYS[item.method as keyof typeof METHOD_KEYS];
            const label = labelKey ? t(labelKey) : item.method;

            return (
              <div key={item.method} className="space-y-1">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-gray-600">{label}</span>
                  <span className="text-right font-medium text-gray-900">
                    {t('value', {
                      amount: formatCurrency(item.vnd, locale),
                      pct: item.pct,
                    })}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full transition-[width] duration-200 motion-reduce:transition-none"
                    role="progressbar"
                    aria-label={t('progressAria', { method: label })}
                    aria-valuemin={0}
                    aria-valuemax={maxValue}
                    aria-valuenow={item.vnd}
                    style={{
                      width: `${Math.max((item.vnd / maxValue) * 100, 0)}%`,
                      backgroundColor: METHOD_COLORS[item.method] || '#6B7280',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
