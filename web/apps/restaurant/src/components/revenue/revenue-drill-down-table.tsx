'use client';

import type { RevenueBreakdownRow } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { useId } from 'react';
import { useLocale, useTranslations } from 'next-intl';

interface RevenueDrillDownTableProps {
  data: RevenueBreakdownRow[];
}

export function RevenueDrillDownTable({ data }: RevenueDrillDownTableProps) {
  const locale = useLocale();
  const t = useTranslations('revenue.drillDown');
  const headingId = useId();
  const columns = [
    t('columns.date'),
    t('columns.orders'),
    t('columns.gross'),
    t('columns.discount'),
    t('columns.net'),
    t('columns.avgOrder'),
    t('columns.newReturning'),
  ];

  return (
    <div className="space-y-3" data-testid="revenue-drill-down-table">
      <h4 id={headingId} className="text-sm font-semibold text-gray-900">{t('title')}</h4>
      {data.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-gray-500">
          {t('empty')}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm" aria-labelledby={headingId}>
            <thead>
              <tr className="border-b bg-gray-50">
                {columns.map((label) => (
                  <th key={label} className="px-3 py-2 text-right text-xs font-medium text-gray-500 first:text-left">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.date} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-900">{row.date}</td>
                  <td className="px-3 py-2 text-right text-gray-700">{row.orders}</td>
                  <td className="px-3 py-2 text-right text-gray-900">{formatCurrency(row.gross, locale)}</td>
                  <td className="px-3 py-2 text-right text-red-500">-{formatCurrency(row.discount, locale)}</td>
                  <td className="px-3 py-2 text-right font-medium text-gray-900">{formatCurrency(row.net, locale)}</td>
                  <td className="px-3 py-2 text-right text-gray-500">{formatCurrency(row.avgOrder, locale)}</td>
                  <td className="px-3 py-2 text-right text-gray-500">
                    <span className="text-green-600">{row.newCustomers}</span>
                    <span className="text-gray-400">/</span>
                    <span className="text-blue-600">{row.returning}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
