import { cn } from '@/lib/utils';

interface TrendProps {
  value: string;
  positive: boolean;
  label: string;
}

interface RevenueKpiCardProps {
  label: string;
  value: string;
  subtext?: string;
  trend?: TrendProps;
  icon: React.ReactNode;
  iconBg: string;
}

export function RevenueKpiCard({
  label,
  value,
  subtext,
  trend,
  icon,
  iconBg,
}: RevenueKpiCardProps) {
  return (
    <div className="kpi-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{label}</span>
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', iconBg)}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {trend && (
        <div
          className={cn(
            'flex items-center gap-1 mt-1 text-xs',
            trend.positive ? 'text-green-700' : 'text-red-700'
          )}
        >
          <span>{trend.positive ? '↑' : '↓'}</span>
          <span>
            {trend.value}% {trend.label}
          </span>
        </div>
      )}
      {subtext && !trend && (
        <p className="mt-1 text-xs text-gray-600">{subtext}</p>
      )}
    </div>
  );
}
