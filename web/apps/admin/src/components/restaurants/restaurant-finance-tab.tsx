'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@foodflow/ui/empty-state';
import { TrendingUp, DollarSign } from 'lucide-react';

interface FinanceData {
  revenueHistory: { date: string; revenue: number }[];
  payouts: { id: string; amount: number; status: string; period: string; createdAt: string }[];
  totalRevenue: number;
  pendingPayout: number;
  nextPayoutDate: string;
}

const payoutStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

export default function RestaurantFinanceTab({ restaurantId }: { restaurantId: string }) {
  const { data, isLoading } = useQuery<FinanceData>({
    queryKey: ['restaurant-finance', restaurantId],
    queryFn: () => apiGet<FinanceData>(`/admin/restaurants/${restaurantId}/finance`),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tổng doanh thu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Chờ thanh toán</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">{formatCurrency(data.pendingPayout)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Kỳ thanh toán tiếp theo</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-xl font-bold">{formatDate(data.nextPayoutDate)}</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Doanh thu 30 ngày</CardTitle>
        </CardHeader>
        <CardContent>
          {data.revenueHistory?.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.revenueHistory}>
                <defs>
                  <linearGradient id="financeRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22C55E" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v: number) => [formatCurrency(v), 'Doanh thu']} />
                <Area type="monotone" dataKey="revenue" stroke="#22C55E" fill="url(#financeRev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">Chưa có dữ liệu doanh thu</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lịch sử thanh toán</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.payouts?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Kỳ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.payouts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.id.slice(0, 12)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(p.amount)}</TableCell>
                    <TableCell>{p.period}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={payoutStatusColors[p.status] || ''}>{p.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState icon={DollarSign} title="Chưa có thanh toán" description="Chưa có đợt thanh toán nào" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
