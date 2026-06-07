'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { apiGet, apiPatch } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { PageHeader } from '@foodflow/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Mail, Phone, User, ShoppingBag, RotateCcw, ShieldCheck } from 'lucide-react';
import { Link } from '@/navigation';
import OrderStatusBadge from '@/components/badges/order-status-badge';
import UserKycModal from './user-kyc-modal';

interface UserDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'banned';
  role: string;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
  kycStatus: 'none' | 'pending' | 'verified' | 'rejected';
  recentOrders: { id: string; orderCode: string; restaurant: { name: string }; total: number; status: string; createdAt: string }[];
}

interface RefundRecord {
  id: string;
  orderId: string;
  orderCode: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const KYC_BADGE: Record<string, string> = {
  none: 'secondary', pending: 'secondary', verified: 'default', rejected: 'destructive',
};

export default function UserDetailClient({ userId }: { userId: string }) {
  const t = useTranslations('userDetail');
  const queryClient = useQueryClient();
  const [kycOpen, setKycOpen] = useState(false);

  const { data: user, isLoading } = useQuery<UserDetail>({
    queryKey: ['user', userId],
    queryFn: () => apiGet<UserDetail>(`/admin/users/${userId}`),
  });

  const { data: refundData } = useQuery<{ refunds: RefundRecord[] }>({
    queryKey: ['user-refunds', userId],
    queryFn: () => apiGet(`/admin/users/${userId}/refunds`),
    enabled: !!user,
  });

  const toggleStatus = async () => {
    if (!user) return;
    await apiPatch(`/admin/users/${userId}/status`, {
      status: user.status === 'active' ? 'banned' : 'active',
    });
    queryClient.invalidateQueries({ queryKey: ['user', userId] });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-48 animate-pulse rounded-lg bg-muted" />
          <div className="h-48 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-destructive">Không tìm thấy người dùng</p>
        <Button asChild><Link href="/users">Quay lại</Link></Button>
      </div>
    );
  }

  const refunds = refundData?.refunds ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Admin' }, { label: t('breadcrumbParent'), href: '/users' }, { label: user.name }]}
        title={user.name}
        description={t('description')}
        actions={
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{t('activeToggle')}</span>
            <Switch checked={user.status === 'active'} onCheckedChange={toggleStatus} />
            <Button variant="ghost" size="sm" asChild>
              <Link href="/users"><ArrowLeft className="mr-2 h-4 w-4" />{t('back')}</Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-primary" />{t('contactInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><span>{user.email}</span></div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span>{user.phone || '—'}</span></div>
              <Separator />
              <div className="flex justify-between"><span className="text-muted-foreground">{t('role')}</span><Badge variant="outline">{user.role}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t('memberSince')}</span><span>{formatDate(user.createdAt)}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingBag className="h-4 w-4 text-primary" />{t('recentOrders')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {user.recentOrders?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('orderCode')}</TableHead><TableHead>{t('restaurant')}</TableHead>
                      <TableHead>{t('status')}</TableHead><TableHead className="text-right">{t('total')}</TableHead>
                      <TableHead>{t('date')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {user.recentOrders.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-medium">{o.orderCode}</TableCell>
                        <TableCell className="text-muted-foreground">{o.restaurant?.name}</TableCell>
                        <TableCell><OrderStatusBadge status={o.status} /></TableCell>
                        <TableCell className="text-right">{formatCurrency(o.total)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">{t('noOrders')}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <RotateCcw className="h-4 w-4 text-primary" />{t('refundHistory')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {refunds.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('orderCode')}</TableHead><TableHead>{t('refundAmount')}</TableHead>
                      <TableHead>{t('refundReason')}</TableHead><TableHead>{t('refundStatus')}</TableHead>
                      <TableHead>{t('date')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {refunds.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.orderCode}</TableCell>
                        <TableCell>{formatCurrency(r.amount)}</TableCell>
                        <TableCell className="text-muted-foreground text-xs max-w-32 truncate">{r.reason}</TableCell>
                        <TableCell>
                          <Badge variant={r.status === 'approved' ? 'default' : r.status === 'rejected' ? 'destructive' : 'secondary'}>
                            {r.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">{t('noRefunds')}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">{t('stats')}</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{t('statusLabel')}</span>
                <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                  {user.status === 'active' ? t('statusActive') : t('statusBanned')}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between"><span className="text-muted-foreground">{t('totalOrders')}</span><span className="font-medium">{user.totalOrders}</span></div>
              <Separator />
              <div className="flex justify-between"><span className="text-muted-foreground">{t('totalSpent')}</span><span className="font-medium">{formatCurrency(user.totalSpent ?? 0)}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-primary" />{t('kycCard')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('kycStatus')}</span>
                <Badge variant={(KYC_BADGE[user.kycStatus] ?? 'secondary') as 'default' | 'secondary' | 'destructive'}>
                  {user.kycStatus}
                </Badge>
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={() => setKycOpen(true)}>
                {t('kycViewDocs')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <UserKycModal userId={userId} open={kycOpen} onOpenChange={setKycOpen} />
    </div>
  );
}
