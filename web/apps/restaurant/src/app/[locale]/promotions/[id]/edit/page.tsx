'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/navigation';
import { Tag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PromotionForm } from '@/components/promotions/promotion-form';
import { fetchPromotion, updatePromotion } from '@/lib/actions/promotion-actions';
import type { Promotion } from '@/lib/types';

export default function PromotionEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const t = useTranslations('promotions.editPage');
  const loadErrorMessage = t('loadError');
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    params.then(({ id }) => {
      fetchPromotion(id)
        .then((data) => {
          if (!cancelled) setPromotion(data);
        })
        .catch((err: unknown) => {
          if (!cancelled) setError((err as { message?: string }).message || loadErrorMessage);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    });
    return () => { cancelled = true; };
  }, [params, loadErrorMessage]);

  const handleSubmit = async (data: Partial<Promotion>) => {
    if (!promotion) return;
    setIsSubmitting(true);
    setError('');
    try {
      const updated = await updatePromotion(promotion.id, data);
      router.push(`/promotions/${updated.id}`);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t('submitError'));
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 skeleton" />
        <div className="card h-96 skeleton" />
      </div>
    );
  }

  if (error && !promotion) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700" role="alert">{error}</div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
          <Tag className="h-5 w-5 text-brand-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-sm text-gray-500">{promotion?.name}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-6" role="alert">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {promotion && (
        <PromotionForm
          initialData={promotion}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
