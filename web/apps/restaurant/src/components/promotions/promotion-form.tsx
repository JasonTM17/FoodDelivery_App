'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { PromotionTypePicker } from './promotion-type-picker';
import { PromotionTargetSelector } from './promotion-target-selector';
import { PromotionScheduleEditor } from './promotion-schedule-editor';
import { PromotionChannelSelector } from './promotion-channel-selector';
import { PromotionComboBuilder } from './promotion-combo-builder';
import { PromotionApplyScopeSection, PromotionLimitsSection } from './promotion-form-sections';
import { AudiencePreview } from '../shared/audience-preview';
import type { Promotion, PromotionType, PromotionChannel, PromotionSchedule, PromotionAudience, ComboConfig } from '@/lib/types';
import { validatePromotion } from '@/lib/promotion-engine';

interface PromotionFormProps {
  initialData?: Partial<Promotion>;
  onSubmit: (data: Partial<Promotion>) => Promise<void>;
  isSubmitting?: boolean;
}

export function PromotionForm({ initialData, onSubmit, isSubmitting: externalIsSubmitting }: PromotionFormProps) {
  const router = useRouter();
  const t = useTranslations('promotions.form');
  const tValidation = useTranslations('promotions.validation');

  const [code, setCode] = useState(initialData?.code || '');
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [type, setType] = useState<PromotionType>(initialData?.type || 'percent');
  const [discountValue, setDiscountValue] = useState(initialData?.discountValue?.toString() || '');
  const [minOrderVnd, setMinOrderVnd] = useState(initialData?.minOrderVnd?.toString() || '');
  const [maxDiscountVnd, setMaxDiscountVnd] = useState(initialData?.maxDiscountVnd?.toString() || '');
  const [appliesTo, setAppliesTo] = useState<'all' | 'category' | 'items'>(initialData?.appliesTo || 'all');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [itemIds, setItemIds] = useState<string[]>(initialData?.itemIds || []);
  const [channels, setChannels] = useState<PromotionChannel[]>(initialData?.channels || ['in_app']);
  const [stackable, setStackable] = useState(initialData?.stackable ?? false);
  const [maxUsage, setMaxUsage] = useState(initialData?.maxUsage?.toString() || '');
  const [perUserLimit, setPerUserLimit] = useState(initialData?.perUserLimit?.toString() || '1');
  const [audience, setAudience] = useState<PromotionAudience>(initialData?.target?.audience || 'all');
  const [minOrderCount, setMinOrderCount] = useState(initialData?.target?.minOrderCount?.toString() || '');
  const [schedule, setSchedule] = useState<PromotionSchedule>(
    initialData?.schedule || {
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }
  );
  const [comboConfig, setComboConfig] = useState<ComboConfig | undefined>(initialData?.comboConfig);
  const [errors, setErrors] = useState<string[]>([]);
  const [internalIsSubmitting, setInternalIsSubmitting] = useState(false);
  const isSubmitting = externalIsSubmitting || internalIsSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrors([]);
    setInternalIsSubmitting(true);
    try {

    const data: Partial<Promotion> = {
      code: code.trim(),
      name: name.trim(),
      description: description.trim(),
      type,
      discountValue: parseFloat(discountValue) || 0,
      minOrderVnd: minOrderVnd ? parseFloat(minOrderVnd) : undefined,
      maxDiscountVnd: maxDiscountVnd ? parseFloat(maxDiscountVnd) : undefined,
      appliesTo,
      categoryId: appliesTo === 'category' ? categoryId : undefined,
      itemIds: appliesTo === 'items' ? itemIds : undefined,
      channels,
      stackable,
      maxUsage: maxUsage ? parseInt(maxUsage, 10) : undefined,
      perUserLimit: parseInt(perUserLimit, 10) || 1,
      target: {
        audience,
        segmentId: undefined,
        minOrderCount: minOrderCount ? parseInt(minOrderCount, 10) : undefined,
      },
      schedule,
      comboConfig: (type === 'bogof' || type === 'combo') ? comboConfig : undefined,
    };

    const validation = validatePromotion(data);
    if (!validation.valid) {
      setErrors(validation.errors.map((error) => tValidation(error)));
      return;
    }

    await onSubmit(data);
    } finally {
      setInternalIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <button type="button" onClick={() => router.back()} className="btn-ghost -ml-2 text-sm">
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        {t('back')}
      </button>

      {errors.length > 0 && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm font-medium text-red-700 mb-1">{t('errorsTitle')}</p>
          <ul className="text-sm text-red-600 space-y-0.5 list-disc list-inside">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      <section className="card space-y-4">
        <h2 className="text-base font-semibold text-gray-900">{t('basicTitle')}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">{t('code')}</label>
            <input type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="input-field font-mono" placeholder={t('codePlaceholder')} />
          </div>
          <div>
            <label className="label">{t('name')}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder={t('namePlaceholder')} />
          </div>
        </div>
        <div>
          <label className="label">{t('description')}</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-field resize-none" rows={2} />
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="text-base font-semibold text-gray-900">{t('typeTitle')}</h2>
        <PromotionTypePicker value={type} onChange={setType} />

        {(type === 'percent' || type === 'fixed') && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <label className="label">{type === 'percent' ? t('percentValue') : t('fixedValue')}</label>
              <input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className="input-field" min={0} max={type === 'percent' ? 100 : undefined} />
            </div>
            {type === 'percent' && (
              <div>
                <label className="label">{t('maxDiscount')}</label>
                <input type="number" value={maxDiscountVnd} onChange={(e) => setMaxDiscountVnd(e.target.value)} className="input-field" min={0} />
              </div>
            )}
            <div>
              <label className="label">{t('minOrder')}</label>
              <input type="number" value={minOrderVnd} onChange={(e) => setMinOrderVnd(e.target.value)} className="input-field" min={0} />
            </div>
          </div>
        )}

        {(type === 'bogof' || type === 'combo') && (
          <div className="mt-4">
            <PromotionComboBuilder
              type={type}
              value={comboConfig}
              onChange={setComboConfig}
            />
          </div>
        )}
      </section>

      <PromotionApplyScopeSection
        appliesTo={appliesTo}
        setAppliesTo={setAppliesTo}
        categoryId={categoryId}
        setCategoryId={setCategoryId}
        itemIds={itemIds}
        setItemIds={setItemIds}
      />

      <section className="card space-y-4">
        <PromotionTargetSelector
          value={audience}
          onChange={setAudience}
          minOrderCount={minOrderCount ? parseInt(minOrderCount, 10) : undefined}
          onMinOrderCountChange={(v) => setMinOrderCount(v.toString())}
        />
        <AudiencePreview
          target={{
            audience,
            minOrderCount: minOrderCount ? parseInt(minOrderCount, 10) : undefined,
          }}
        />
      </section>

      <section className="card">
        <PromotionScheduleEditor value={schedule} onChange={setSchedule} />
      </section>

      <section className="card">
        <PromotionChannelSelector value={channels} onChange={setChannels} />
      </section>

      <PromotionLimitsSection maxUsage={maxUsage} setMaxUsage={setMaxUsage} perUserLimit={perUserLimit} setPerUserLimit={setPerUserLimit} stackable={stackable} setStackable={setStackable} />

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary"
        >
          {isSubmitting ? t('saving') : initialData?.id ? t('update') : t('create')}
        </button>
      </div>
    </form>
  );
}
