'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { apiGet, apiPost } from '@/lib/api';
import { PageHeader } from '@/components/layout/admin-page-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/navigation';
import { RestaurantApprovalActionsCard } from './restaurant-approval-actions-card';
import { RestaurantApprovalInfoCards, type PendingRestaurant } from './restaurant-approval-info-cards';

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
    } catch {
      setApprovalError(t('approveError'));
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const trimmedReason = rejectReason.trim();
    if (!trimmedReason) return;

    setLoading(true);
    setApprovalError('');
    try {
      await apiPost(`/admin/restaurants/${id}/reject`, { reason: trimmedReason });
      queryClient.invalidateQueries({ queryKey: ['restaurant-approve', id] });
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    } catch {
      setApprovalError(t('rejectError'));
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
        <p className="text-destructive">{t('notFound')}</p>
        <Button asChild>
          <Link href="/restaurants">{t('back')}</Link>
        </Button>
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
            <Link href="/restaurants">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('back')}
            </Link>
          </Button>
        }
      />

      <RestaurantApprovalInfoCards restaurant={restaurant} />

      {isPending && (
        <RestaurantApprovalActionsCard
          approvalError={approvalError}
          loading={loading}
          rejectReason={rejectReason}
          onApprove={handleApprove}
          onReject={handleReject}
          onRejectReasonChange={setRejectReason}
        />
      )}
    </div>
  );
}
