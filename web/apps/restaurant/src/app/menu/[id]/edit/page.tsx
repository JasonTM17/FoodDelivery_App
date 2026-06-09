'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, UtensilsCrossed } from 'lucide-react';
import { MenuItemForm } from '@/components/menu/menu-item-form';
import type { MenuItemFormData } from '@/components/menu/menu-item-form';
import { api } from '@/lib/api';
import type { MenuItem } from '@/lib/types';

export default function EditMenuItemPage() {
  const { id } = useParams();
  const router = useRouter();
  const [menuItem, setMenuItem] = useState<MenuItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await api.get<MenuItem>(`/menu/${id}`);
        setMenuItem(data);
      } catch (err: unknown) {
        setError((err as { message?: string }).message || 'Không tìm thấy món');
      } finally { setIsLoading(false); }
    };
    fetch();
  }, [id]);

  const handleSubmit = async (data: MenuItemFormData) => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await api.put<MenuItem>(`/menu/${id}`, data);
      router.push('/menu');
    } catch (err: unknown) {
      setSubmitError((err as { message?: string }).message || 'Không thể cập nhật món');
    } finally { setIsSubmitting(false); }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-32 skeleton" />
        <div className="card h-96" />
      </div>
    );
  }

  if (error || !menuItem) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <span className="text-red-600 text-2xl font-bold">!</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy món</h2>
        <p className="text-sm text-gray-500 mb-6">{error}</p>
        <button onClick={() => router.push('/menu')} className="btn-primary">Quay lại</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <button onClick={() => router.push('/menu')} className="btn-ghost mb-4 -ml-2">
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Quay lại thực đơn
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
          <UtensilsCrossed className="h-5 w-5 text-brand-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Chỉnh sửa món</h1>
          <p className="text-sm text-gray-500">{menuItem.name}</p>
        </div>
      </div>

      {submitError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-6">
          <p className="text-sm text-red-700">{submitError}</p>
        </div>
      )}

      <div className="card max-w-2xl">
        <MenuItemForm
          initialData={menuItem}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
