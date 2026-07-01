'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@foodflow/ui/empty-state';
import { Wallet, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface WalletData {
  balance: number;
  frozenBalance: number;
  topupHistory: { id: string; amount: number; method: string; status: string; createdAt: string }[];
  transactions: { id: string; type: string; amount: number; description: string; createdAt: string }[];
}

export default function UserWalletPanel({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery<WalletData>({
    queryKey: ['user-wallet', userId],
    queryFn: () => apiGet<WalletData>(`/admin/users/${userId}/wallet`),
  });

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-lg bg-muted" />;
  }

  if (!data) {
    return (
      <EmptyState icon={Wallet} title="Không có dữ liệu ví" description="Người dùng chưa có giao dịch ví nào" />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Số dư hiện tại</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{formatCurrency(data.balance)}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Đang phong tỏa</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-muted-foreground">{formatCurrency(data.frozenBalance)}</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lịch sử nạp tiền</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.topupHistory?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Phương thức</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topupHistory.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{formatCurrency(t.amount)}</TableCell>
                    <TableCell>{t.method}</TableCell>
                    <TableCell><Badge variant={t.status === 'completed' ? 'success' : 'secondary'}>{t.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(t.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="px-6 py-4 text-sm text-muted-foreground">Chưa có lịch sử nạp tiền</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Giao dịch gần đây</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.transactions?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loại</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead className="text-right">Số tiền</TableHead>
                  <TableHead>Ngày</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm">
                        {tx.type === 'credit' ? (
                          <ArrowDownLeft className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <ArrowUpRight className="h-3.5 w-3.5 text-red-500" />
                        )}
                        {tx.type === 'credit' ? 'Nhận' : 'Chi'}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{tx.description}</TableCell>
                    <TableCell className={`text-right font-medium ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="px-6 py-4 text-sm text-muted-foreground">Chưa có giao dịch</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
