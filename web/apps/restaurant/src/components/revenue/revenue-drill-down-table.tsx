'use client';

import type { RevenueBreakdownRow } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface RevenueDrillDownTableProps {
  data: RevenueBreakdownRow[];
}

export function RevenueDrillDownTable({ data }: RevenueDrillDownTableProps) {
  return (
    <div className="space-y-3" data-testid="revenue-drill-down-table">
      <h4 className="text-sm font-semibold text-gray-900">Chi tiết doanh thu</h4>
      {data.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-gray-500">
          Chưa có giao dịch trong khoảng thời gian này.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                {['Ngày', 'Đơn', 'Tổng', 'Khuyến mãi', 'Thực thu', 'TB đơn', 'Mới/Quay lại'].map((label) => (
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
                  <td className="px-3 py-2 text-right text-gray-900">{formatCurrency(row.gross)}</td>
                  <td className="px-3 py-2 text-right text-red-500">-{formatCurrency(row.discount)}</td>
                  <td className="px-3 py-2 text-right font-medium text-gray-900">{formatCurrency(row.net)}</td>
                  <td className="px-3 py-2 text-right text-gray-500">{formatCurrency(row.avgOrder)}</td>
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
