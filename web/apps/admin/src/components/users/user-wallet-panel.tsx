'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react';
import { EmptyState } from '@foodflow/ui/empty-state';
import { apiGet } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface WalletData {
  balance: number;
  frozenBalance: number;
  topupHistory: { id: string; amount: number; method: string; status: string; createdAt: string }[];
  transactions: { id: string; type: string; amount: number; description: string; createdAt: string }[];
}

const localizedTopupStatuses = new Set(['pending', 'completed', 'failed', 'cancelled']);

export default function UserWalletPanel({ userId }: { userId: string }) {
  const t = useTranslations('userWalletPanel');
  const { data, isLoading } = useQuery<WalletData>({
    queryKey: ['user-wallet', userId],
    queryFn: () => apiGet<WalletData>(`/admin/users/${userId}/wallet`),
  });

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-lg bg-muted" />;
  }

  if (!data) {
    return (
      <EmptyState
        icon={Wallet}
        title={t('emptyTitle')}
        description={t('emptyDescription')}
      />
    );
  }

  const statusLabel = (status: string) => {
    return localizedTopupStatuses.has(status) ? t(`statuses.${status}`) : status;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <BalanceCard title={t('currentBalance')} value={formatCurrency(data.balance)} />
        <BalanceCard
          title={t('frozenBalance')}
          value={formatCurrency(data.frozenBalance)}
          muted
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('topupHistoryTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.topupHistory?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('topupColumns.amount')}</TableHead>
                  <TableHead>{t('topupColumns.method')}</TableHead>
                  <TableHead>{t('topupColumns.status')}</TableHead>
                  <TableHead>{t('topupColumns.date')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topupHistory.map((topup) => (
                  <TableRow key={topup.id}>
                    <TableCell className="font-medium">{formatCurrency(topup.amount)}</TableCell>
                    <TableCell>{topup.method}</TableCell>
                    <TableCell>
                      <Badge variant={topup.status === 'completed' ? 'success' : 'secondary'}>
                        {statusLabel(topup.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(topup.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="px-6 py-4 text-sm text-muted-foreground">{t('emptyTopupHistory')}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('recentTransactionsTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.transactions?.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('transactionColumns.type')}</TableHead>
                  <TableHead>{t('transactionColumns.description')}</TableHead>
                  <TableHead className="text-right">{t('transactionColumns.amount')}</TableHead>
                  <TableHead>{t('transactionColumns.date')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <TransactionTypeLabel type={transaction.type} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{transaction.description}</TableCell>
                    <TableCell className={`text-right font-medium ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'credit' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(transaction.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="px-6 py-4 text-sm text-muted-foreground">
              {t('emptyTransactions')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BalanceCard({ title, value, muted }: { title: string; value: string; muted?: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <span className={`text-2xl font-bold ${muted ? 'text-muted-foreground' : ''}`}>
          {value}
        </span>
      </CardContent>
    </Card>
  );
}

function TransactionTypeLabel({ type }: { type: string }) {
  const t = useTranslations('userWalletPanel');
  const isCredit = type === 'credit';

  return (
    <span className="flex items-center gap-1 text-sm">
      {isCredit ? (
        <ArrowDownLeft className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <ArrowUpRight className="h-3.5 w-3.5 text-red-500" />
      )}
      {isCredit ? t('transactionTypes.credit') : t('transactionTypes.debit')}
    </span>
  );
}
