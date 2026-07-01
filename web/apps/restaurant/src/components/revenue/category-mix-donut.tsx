'use client';

import { formatCurrency } from '@/lib/utils';

interface CategoryMixDonutProps {
  data: { categoryId: string; name: string; vnd: number; pct: number }[];
}

const COLORS = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];

export function CategoryMixDonut({ data }: CategoryMixDonutProps) {
  const total = data.reduce((s, d) => s + d.vnd, 0) || 1;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;

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
      <h4 className="text-sm font-semibold text-gray-900">Phân bổ theo danh mục</h4>

      <div className="flex items-center gap-6">
        <svg viewBox="0 0 200 200" className="h-44 w-44 shrink-0">
          <circle cx="100" cy="100" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="28" />
          {segments.map((seg, i) => (
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
            {formatCurrency(total).replace('₫', '')}
          </text>
          <text x="100" y="112" textAnchor="middle" className="text-xs" fill="#9CA3AF">
            tổng
          </text>
        </svg>

        <div className="space-y-1.5 flex-1">
          {segments.map((seg) => (
            <div key={seg.categoryId} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: seg.color }} />
                <span className="text-gray-700">{seg.name}</span>
              </div>
              <span className="text-gray-500">{seg.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
