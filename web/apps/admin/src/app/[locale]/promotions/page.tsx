'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AdminPromotionsTable } from '@/components/promotions/admin-promotions-table';
import type { AdminPromotion } from '@/components/promotions/admin-promotions-types';
import { Button } from '@/components/ui/button';
import { apiDelete, apiGet, apiPatch } from '@/lib/api';
import { useRouter } from '@/navigation';
import { PageHeader } from '@foodflow/ui/page-header';

interface PromotionsResponse {
  promotions: AdminPromotion[];
}

export default function PromotionsPage() {
  const t = useTranslations('promotions');
  const managementT = useTranslations('adminPromotionManagement');
  const queryClient = useQueryClient();
  const router = useRouter();
  const [mutationError, setMutationError] = useState('');

  const { data, isError, isLoading, refetch } = useQuery<PromotionsResponse>({
    queryKey: ['promotions'],
    queryFn: () => apiGet<PromotionsResponse>('/admin/promotions'),
  });

  const refreshPromotions = () => queryClient.invalidateQueries({ queryKey: ['promotions'] });

  const handleDelete = async (promotionId: string) => {
    if (!window.confirm(managementT('deleteConfirm'))) return;
    setMutationError('');
    try {
      await apiDelete(`/admin/promotions/${promotionId}`);
      await refreshPromotions();
    } catch (error) {
      setMutationError((error as { message?: string }).message || managementT('deleteError'));
    }
  };

  const toggleActive = async (promotion: AdminPromotion) => {
    setMutationError('');
    try {
      await apiPatch(`/admin/promotions/${promotion.id}/toggle`);
      await refreshPromotions();
    } catch (error) {
      setMutationError((error as { message?: string }).message || managementT('toggleError'));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Admin' }, { label: t('title') }]}
        title={t('title')}
        description={t('description')}
        actions={(
          <Button onClick={() => router.push('/promotions/new')}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            {t('create')}
          </Button>
        )}
      />

      <AdminPromotionsTable
        promotions={data?.promotions ?? []}
        isError={isError}
        isLoading={isLoading}
        mutationError={mutationError}
        onCreate={() => router.push('/promotions/new')}
        onDelete={handleDelete}
        onEdit={promotion => router.push(`/promotions/${promotion.id}/edit`)}
        onRetry={() => void refetch()}
        onToggle={toggleActive}
      />
    </div>
  );
}
