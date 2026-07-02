'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { apiPatch, apiPost } from '@/lib/api';
import {
  createPromotionSchema,
  type PromotionFormValues,
} from '@/lib/schemas/promotion-schema';
import { toAdminPromotionPayload } from './admin-promotions-types';
import { PromotionFormDetails } from './promotion-form-details';
import { PromotionFormRules } from './promotion-form-rules';
import PromotionPreview from './promotion-preview';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PromotionFormProps {
  defaultValues?: Partial<PromotionFormValues>;
  editId?: string;
  onSuccess?: () => void;
}

export default function PromotionForm({ defaultValues, editId, onSuccess }: PromotionFormProps) {
  const t = useTranslations('adminPromotionManagement');
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const schema = createPromotionSchema(key => t(`validation.${key}`));
  const form = useForm<PromotionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: '',
      name: '',
      discountType: 'percent',
      discountValue: 0,
      minOrderVnd: 0,
      audience: 'all',
      perUserLimit: 1,
      active: true,
      ...defaultValues,
    },
  });
  const active = form.watch('active');
  const values = form.watch();

  const onSubmit = async (data: PromotionFormValues) => {
    setSaving(true);
    setSaveError('');

    try {
      const payload = toAdminPromotionPayload(data);
      if (editId) {
        await apiPatch(`/admin/promotions/${editId}`, payload);
      } else {
        await apiPost('/admin/promotions', payload);
      }
      await queryClient.invalidateQueries({ queryKey: ['promotions'] });
      onSuccess?.();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : t('saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <PromotionFormDetails form={form} />
          <PromotionFormRules form={form} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('form.status')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="active">{t('form.activateNow')}</Label>
                <Switch
                  id="active"
                  checked={active}
                  onCheckedChange={value => form.setValue('active', value)}
                />
              </div>
            </CardContent>
          </Card>

          <PromotionPreview values={values} />

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? t('saving') : editId ? t('update') : t('createAction')}
          </Button>
          {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
        </div>
      </div>
    </form>
  );
}
