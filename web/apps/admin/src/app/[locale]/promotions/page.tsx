'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AdminPromotionDialog } from '@/components/promotions/admin-promotion-dialog';
import { AdminPromotionsTable } from '@/components/promotions/admin-promotions-table';
import {
  createEmptyPromotionForm,
  promotionToFormData,
  toPromotionPayload,
  type AdminPromotion,
  type AdminPromotionFormData,
} from '@/components/promotions/admin-promotions-types';
import { Button } from '@/components/ui/button';
import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api';
import { PageHeader } from '@foodflow/ui/page-header';

interface PromotionsResponse {
  promotions: AdminPromotion[];
}

export default function PromotionsPage() {
  const t = useTranslations('promotions');
  const managementT = useTranslations('adminPromotionManagement');
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<AdminPromotion | null>(null);
  const [formData, setFormData] = useState(createEmptyPromotionForm);
  const [saving, setSaving] = useState(false);
  const [mutationError, setMutationError] = useState('');

  const { data, isError, isLoading, refetch } = useQuery<PromotionsResponse>({
    queryKey: ['promotions'],
    queryFn: () => apiGet<PromotionsResponse>('/admin/promotions'),
  });

  const refreshPromotions = () => queryClient.invalidateQueries({ queryKey: ['promotions'] });

  const openCreateDialog = () => {
    setEditingPromotion(null);
    setFormData(createEmptyPromotionForm());
    setMutationError('');
    setDialogOpen(true);
  };

  const openEditDialog = (promotion: AdminPromotion) => {
    setEditingPromotion(promotion);
    setFormData(promotionToFormData(promotion));
    setMutationError('');
    setDialogOpen(true);
  };

  const updateFormField = <K extends keyof AdminPromotionFormData>(
    field: K,
    value: AdminPromotionFormData[K],
  ) => setFormData(current => ({ ...current, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    setMutationError('');
    try {
      const payload = toPromotionPayload(formData);
      if (editingPromotion) {
        await apiPut(`/admin/promotions/${editingPromotion.id}`, payload);
      } else {
        await apiPost('/admin/promotions', payload);
      }
      await refreshPromotions();
      setDialogOpen(false);
    } catch (error) {
      setMutationError((error as { message?: string }).message || managementT('saveError'));
    } finally {
      setSaving(false);
    }
  };

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
      await apiPut(`/admin/promotions/${promotion.id}`, { active: !promotion.active });
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
          <Button onClick={openCreateDialog}>
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
        onCreate={openCreateDialog}
        onDelete={handleDelete}
        onEdit={openEditDialog}
        onRetry={() => void refetch()}
        onToggle={toggleActive}
      />

      <AdminPromotionDialog
        editingPromotion={editingPromotion}
        formData={formData}
        open={dialogOpen}
        saving={saving}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
        onUpdateField={updateFormField}
      />
    </div>
  );
}
