'use client';

import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

interface DrillDownRow {
  id: string;
  name: string;
  category?: string;
  orders: number;
  revenue: number;
  avgOrderValue: number;
  percentOfTotal: number;
}

interface RevenueDrillDownTableProps {
  data: DrillDownRow[];
  title: string;
  className?: string;
}

type SortField = 'name' | 'orders' | 'revenue' | 'avgOrderValue' | 'percentOfTotal';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 10;

const SORT_LABELS: Record<SortField, string> = {
  name: 'Tên',
  orders: 'Đơn hàng',
  revenue: 'Doanh thu',
  avgOrderValue: 'Giá trị TB',
  percentOfTotal: '% Tổng',
};

export function RevenueDrillDownTable({ data, title, className }: RevenueDrillDownTableProps) {
  const [sortField, setSortField] = useState<SortField>('revenue');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((d) => d.name.toLowerCase().includes(q) || d.category?.toLowerCase().includes(q));
  }, [data, search]);

  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortField === 'name') return dir * a.name.localeCompare(b.name);
      return dir * (a[sortField] - b[sortField]);
    });
  }, [filtered, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageData = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(0);
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />;
  }

  if (data.length === 0) {
    return (
      <div className={cn('card', className)}>
        <h2 className="text-base font-semibold text-gray-900 mb-4">{title}</h2>
        <p className="text-sm text-gray-400 py-8 text-center">Chưa có dữ liệu</p>
      </div>
    );
  }

  return (
    <div className={cn('card', className)}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="input-field pl-9 py-1.5 text-sm w-48"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-400 uppercase tracking-wider w-8">#</th>
              {(['name', 'orders', 'revenue', 'avgOrderValue', 'percentOfTotal'] as SortField[]).map((field) => (
                <th key={field} className="text-right py-2.5 px-3">
                  <button
                    onClick={() => handleSort(field)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 uppercase tracking-wider hover:text-gray-700"
                  >
                    {SORT_LABELS[field]}
                    <SortIcon field={field} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pageData.map((row, i) => (
              <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-2.5 px-3 text-sm text-gray-400">{page * PAGE_SIZE + i + 1}</td>
                <td className="py-2.5 px-3 text-right">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{row.name}</p>
                    {row.category && <p className="text-xs text-gray-400">{row.category}</p>}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-sm text-right text-gray-700">{row.orders.toLocaleString('vi-VN')}</td>
                <td className="py-2.5 px-3 text-sm text-right font-medium text-gray-900">{formatCurrency(row.revenue)}</td>
                <td className="py-2.5 px-3 text-sm text-right text-gray-700">{formatCurrency(row.avgOrderValue)}</td>
                <td className="py-2.5 px-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.min(row.percentOfTotal, 100)}%` }} />
                    </div>
                    <span className="text-sm text-gray-500 w-12 text-right">{row.percentOfTotal.toFixed(1)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, sorted.length)} / {sorted.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={cn('w-8 h-8 rounded-md text-sm font-medium', page === i ? 'bg-brand-500 text-white' : 'text-gray-500 hover:bg-gray-100')}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
