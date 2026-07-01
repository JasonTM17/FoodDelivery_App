'use client';

import { formatCurrency, cn } from '@/lib/utils';

interface PaymentMethodBarProps {
  data: { method: string; vnd: number; pct: number }[];
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Tiền mặt',
  card: 'Thẻ',
  wallet: 'Ví',
  sepay: 'Sepay',
  vnpay: 'VNPay',
};

const METHOD_COLORS: Record<string, string> = {
  cash: '#10B981',
  card: '#3B82F6',
  wallet: '#F97316',
  sepay: '#8B5CF6',
  vnpay: '#EF4444',
};

export function PaymentMethodBar({ data }: PaymentMethodBarProps) {
  const maxVal = Math.max(...data.map(d => d.vnd), 1);

  return (
    <div className="space-y-3" data-testid="payment-method-bar">
      <h4 className="text-sm font-semibold text-gray-900">Phương thức thanh toán</h4>

      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.method} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{METHOD_LABELS[d.method] || d.method}</span>
              <span className="text-gray-900 font-medium">{formatCurrency(d.vnd)}</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(d.vnd / maxVal) * 100}%`,
                  backgroundColor: METHOD_COLORS[d.method] || '#6B7280',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
