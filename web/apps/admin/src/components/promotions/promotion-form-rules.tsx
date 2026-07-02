'use client';

import { useTranslations } from 'next-intl';
import type { UseFormReturn } from 'react-hook-form';
import type { PromotionFormValues } from '@/lib/schemas/promotion-schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PromotionFormSectionProps {
  form: UseFormReturn<PromotionFormValues>;
}

const audiences = ['all', 'new', 'vip', 'segment'] as const;

export function PromotionFormRules({ form }: PromotionFormSectionProps) {
  const t = useTranslations('adminPromotionManagement');
  const { register, setValue, watch, formState: { errors } } = form;
  const audience = watch('audience');

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('form.conditions')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="minOrderVnd">{t('fields.minOrder')}</Label>
            <Input id="minOrderVnd" type="number" {...register('minOrderVnd')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="perUserLimit">{t('form.perUserLimit')}</Label>
            <Input id="perUserLimit" type="number" {...register('perUserLimit')} />
            {errors.perUserLimit && <p className="text-xs text-destructive">{errors.perUserLimit.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxUsage">{t('form.maxUsage')}</Label>
            <Input id="maxUsage" type="number" {...register('maxUsage')} />
            {errors.maxUsage && <p className="text-xs text-destructive">{errors.maxUsage.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="audience">{t('form.audience')}</Label>
            <Select
              value={audience}
              onValueChange={value => setValue(
                'audience',
                value as PromotionFormValues['audience'],
                { shouldValidate: true },
              )}
            >
              <SelectTrigger id="audience">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {audiences.map(value => (
                  <SelectItem key={value} value={value}>{t(`audiences.${value}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.audience && <p className="text-xs text-destructive">{errors.audience.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('form.timing')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="validFrom">{t('fields.startDate')}</Label>
            <Input id="validFrom" type="date" {...register('validFrom', { valueAsDate: true })} />
            {errors.validFrom && <p className="text-xs text-destructive">{errors.validFrom.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="validUntil">{t('fields.endDate')}</Label>
            <Input id="validUntil" type="date" {...register('validUntil', { valueAsDate: true })} />
            {errors.validUntil && <p className="text-xs text-destructive">{errors.validUntil.message}</p>}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
