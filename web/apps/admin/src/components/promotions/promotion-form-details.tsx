'use client';

import { useTranslations } from 'next-intl';
import type { UseFormReturn } from 'react-hook-form';
import type { PromotionFormValues } from '@/lib/schemas/promotion-schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

const discountTypeTranslationKeys: Record<
  PromotionFormValues['discountType'],
  'percentage' | 'fixed' | 'free_delivery'
> = {
  percent: 'percentage',
  fixed: 'fixed',
  shipping: 'free_delivery',
};

export function PromotionFormDetails({ form }: PromotionFormSectionProps) {
  const t = useTranslations('adminPromotionManagement');
  const { register, setValue, watch, formState: { errors } } = form;
  const discountType = watch('discountType');

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('form.basicInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="code">{t('form.code')}</Label>
            <Input id="code" placeholder={t('form.codePlaceholder')} {...register('code')} />
            {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">{t('form.name')}</Label>
            <Input id="name" placeholder={t('form.namePlaceholder')} {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">{t('fields.description')}</Label>
            <Textarea
              id="description"
              placeholder={t('descriptionPlaceholder')}
              rows={2}
              {...register('description')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('form.discountSettings')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="discountType">{t('form.type')}</Label>
            <Select
              value={discountType}
              onValueChange={value => setValue(
                'discountType',
                value as PromotionFormValues['discountType'],
                { shouldValidate: true },
              )}
            >
              <SelectTrigger id="discountType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(discountTypeTranslationKeys).map(([value, key]) => (
                  <SelectItem key={value} value={value}>{t(`types.${key}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.discountType && <p className="text-xs text-destructive">{errors.discountType.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="discountValue">
              {discountType === 'percent' ? t('form.discountPercentage') : t('form.discountAmount')}
            </Label>
            <Input id="discountValue" type="number" {...register('discountValue')} />
            {errors.discountValue && <p className="text-xs text-destructive">{errors.discountValue.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxDiscountVnd">{t('fields.maxDiscount')}</Label>
            <Input id="maxDiscountVnd" type="number" {...register('maxDiscountVnd')} />
            {errors.maxDiscountVnd && <p className="text-xs text-destructive">{errors.maxDiscountVnd.message}</p>}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
