'use client';

import { useState } from 'react';
import { useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, UtensilsCrossed } from 'lucide-react';
import { MenuItemForm } from '@/components/menu/menu-item-form';
import { api } from '@/lib/api';
import type { MenuItemFormData } from '@/components/menu/menu-item-form';
import type { MenuItem } from '@/lib/types';

export default function NewMenuItemPage() {
  const router = useRouter();
  const t = useTranslations('menu.newPage');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (data: MenuItemFormData) => {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      await api.post<MenuItem>('/restaurant/menu/items', data);
      router.push('/menu');
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setSubmitError(apiError.message || t('submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.push('/menu')}
        className="btn-ghost mb-4 -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        {t('back')}
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
          <UtensilsCrossed className="h-5 w-5 text-brand-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-sm text-gray-500">{t('description')}</p>
        </div>
      </div>

      {/* Error */}
      {submitError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-6">
          <p className="text-sm text-red-700">{submitError}</p>
        </div>
      )}

      {/* Form */}
      <div className="card max-w-2xl">
        <MenuItemForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
}
