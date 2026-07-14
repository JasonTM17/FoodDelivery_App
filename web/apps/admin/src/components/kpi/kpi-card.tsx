'use client';

import { cn } from '@/lib/utils';
import Sparkline from './sparkline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Link } from '@/navigation';

export interface KpiData {
  key: string;
  label: string;
  value: number;
  formattedValue: string;
  delta: number;
  sparkline: number[];
  drillDownHref: string;
  icon?: LucideIcon;
}

interface KpiCardProps {
  kpi: KpiData;
  className?: string;
}

export default function KpiCard({ kpi, className }: KpiCardProps) {
  const isPositive = kpi.delta >= 0;
  const deltaPercent = Math.abs(kpi.delta * 100);

  return (
    <Link href={kpi.drillDownHref} prefetch={false} data-testid={`kpi-card-${kpi.key}`}>
      <Card className={cn('transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer', className)}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
          <Badge
            variant={isPositive ? 'success' : 'destructive'}
            className="flex items-center gap-0.5 text-xs"
          >
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {isPositive ? '+' : '-'}{deltaPercent.toFixed(1)}%
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">{kpi.formattedValue}</div>
          <Sparkline data={kpi.sparkline} positive={isPositive} />
        </CardContent>
      </Card>
    </Link>
  );
}
