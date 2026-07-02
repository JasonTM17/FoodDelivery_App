import type { ReactNode } from 'react';

export function PromotionDetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="mb-0.5 text-xs uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="text-sm font-medium text-gray-900">{value}</dd>
    </div>
  );
}
