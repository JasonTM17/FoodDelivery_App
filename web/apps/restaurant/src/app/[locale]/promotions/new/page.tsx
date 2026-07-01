'use client';

import { useState } from 'react';
import { useRouter } from '@/navigation';
import { Tag } from 'lucide-react';
import { PromotionForm } from '@/components/promotions/promotion-form';
import { createPromotion } from '@/lib/actions/promotion-actions';
import type { Promotion } from '@/lib/types';

export default function PromotionNewPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (data: Partial<Promotion>) => {
    setIsSubmitting(true);
    setError('');
    try {
      const created = await createPromotion(data);
      router.push(`/promotions/${created.id}`);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Không thể tạo khuyến mãi');
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
          <Tag className="h-5 w-5 text-brand-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tạo khuyến mãi mới</h1>
          <p className="text-sm text-gray-500">Thiết lập chương trình khuyến mãi</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <PromotionForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
