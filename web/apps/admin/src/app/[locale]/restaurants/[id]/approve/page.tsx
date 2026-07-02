'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { apiGet, apiPost } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { PageHeader } from '@/components/layout/admin-page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle2, XCircle, MapPin, Phone, Mail, Store } from 'lucide-react';
import { Link } from '@/navigation';

interface PendingRestaurant {
  id: string;
  name: string;
  cuisine: string;
  address: string;
  owner: { name: string; email: string; phone: string };
  description: string;
  submittedAt: string;
  status: string;
  businessLicense: string | null;
}

export default function RestaurantApprovePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const t = useTranslations('restaurantApprove');
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [approvalError, setApprovalError] = useState('');

  const { data: restaurant, isLoading } = useQuery<PendingRestaurant>({
    queryKey: ['restaurant-approve', id],
    queryFn: () => apiGet<PendingRestaurant>(`/admin/restaurants/${id}`),
  });

  const handleApprove = async () => {
    setLoading(true);
    setApprovalError('');
    try {
      await apiPost(`/admin/restaurants/${id}/approve`, {});
      queryClient.invalidateQueries({ queryKey: ['restaurant-approve', id] });
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    } catch (err) {
      setApprovalError((err as { message?: string }).message || 'Không thể duyệt nhà hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setLoading(true);
    setApprovalError('');
    try {
      await apiPost(`/admin/restaurants/${id}/reject`, { reason: rejectReason });
      queryClient.invalidateQueries({ queryKey: ['restaurant-approve', id] });
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    } catch (err) {
      setApprovalError((err as { message?: string }).message || 'Không thể từ chối nhà hàng');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-72 animate-pulse rounded bg-muted" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-destructive">Không tìm thấy nhà hàng</p>
        <Button asChild><Link href="/restaurants">Quay lại</Link></Button>
      </div>
    );
  }

  const isPending = restaurant.status === 'pending';

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Admin' },
          { label: t('breadcrumbParent'), href: '/restaurants' },
          { label: restaurant.name },
          { label: t('breadcrumbCurrent') },
        ]}
        title={t('title')}
        description={t('description')}
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/restaurants"><ArrowLeft className="mr-2 h-4 w-4" />{t('back')}</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Store className="h-4 w-4 text-primary" />
              {t('restaurantInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('name')}</span>
              <span className="font-medium">{restaurant.name}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('cuisine')}</span>
              <span>{restaurant.cuisine}</span>
            </div>
            <Separator />
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span>{restaurant.address}</span>
            </div>
            {restaurant.description && (
              <>
                <Separator />
                <p className="text-muted-foreground">{restaurant.description}</p>
              </>
            )}
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('submittedAt')}</span>
              <span>{formatDate(restaurant.submittedAt)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('ownerInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-muted-foreground" />
              <span>{restaurant.owner?.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{restaurant.owner?.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{restaurant.owner?.phone}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('currentStatus')}</span>
              <Badge variant={isPending ? 'secondary' : restaurant.status === 'active' ? 'default' : 'destructive'}>
                {restaurant.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {isPending && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('approvalActions')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {approvalError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {approvalError}
              </div>
            )}
            <div className="flex gap-3">
              <Button onClick={handleApprove} disabled={loading} className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {t('approve')}
              </Button>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="rejectReason">{t('rejectReason')}</Label>
              <Textarea
                id="rejectReason"
                placeholder={t('rejectReasonPlaceholder')}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={loading || !rejectReason.trim()}
                className="gap-2"
              >
                <XCircle className="h-4 w-4" />
                {t('reject')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
