'use client';

import { use } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { apiGet, apiPatch } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { PageHeader } from '@foodflow/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Mail, Phone, User, ShoppingBag } from 'lucide-react';
import { Link } from '@/navigation';
import OrderStatusBadge from '@/components/badges/order-status-badge';

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
  recentOrders: {
    id: string;
    orderCode: string;
    restaurant: { name: string };
    total: number;
    status: string;
    createdAt: string;
  }[];
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations('userDetail');
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<UserDetail>({
    queryKey: ['user', id],
    queryFn: () => apiGet<UserDetail>(`/admin/users/${id}`),
  });

  const toggleStatus = async () => {
    if (!user) return;
    const newStatus = user.status === 'active' ? 'banned' : 'active';
    await apiPatch(`/admin/users/${id}/status`, { status: newStatus });
    queryClient.invalidateQueries({ queryKey: ['user', id] });
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

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Admin' },
          { label: t('breadcrumbParent'), href: '/users' },
          { label: user.name },
        ]}
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
                <User className="h-4 w-4 text-primary" />
                {t('contactInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{user.phone || '—'}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('role')}</span>
                <Badge variant="outline">{user.role}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('memberSince')}</span>
                <span>{formatDate(user.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingBag className="h-4 w-4 text-primary" />
                {t('recentOrders')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {user.recentOrders && user.recentOrders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('orderCode')}</TableHead>
                      <TableHead>{t('restaurant')}</TableHead>
                      <TableHead>{t('status')}</TableHead>
                      <TableHead className="text-right">{t('total')}</TableHead>
                      <TableHead>{t('date')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {user.recentOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderCode}</TableCell>
                        <TableCell className="text-muted-foreground">{order.restaurant?.name}</TableCell>
                        <TableCell><OrderStatusBadge status={order.status} /></TableCell>
                        <TableCell className="text-right">{order.total.toLocaleString('vi-VN')}₫</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">{t('noOrders')}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">{t('stats')}</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('statusLabel')}</span>
                <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                  {user.status === 'active' ? t('statusActive') : t('statusBanned')}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('totalOrders')}</span>
                <span className="font-medium">{user.totalOrders}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('totalSpent')}</span>
                <span className="font-medium">{user.totalSpent?.toLocaleString('vi-VN')}₫</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
