'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '@/lib/api';

interface Promotion {
  id: string;
  code: string;
  name: string;
  description?: string;
  active: boolean;
  endDate: string;
}

export default function PromotionEditPage() {
  const params = useParams();
  const router = useRouter();
  const [form, setForm] = useState<Promotion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<{ promotion: Promotion }>(`/restaurant/promotions/${params.id}`)
      .then((data) => setForm(data.promotion))
      .catch((err: unknown) => setError((err as { message?: string }).message || 'Không tìm thấy'))
      .finally(() => setIsLoading(false));
  }, [params.id]);

  const handleSave = async () => {
    if (!form) return;
    setIsSaving(true);
    setError('');
    try {
      await api.patch(`/restaurant/promotions/${params.id}`, {
        active: form.active,
        description: form.description,
        endDate: form.endDate,
      });
      router.push(`/promotions/${params.id}`);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Không thể lưu');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="space-y-4"><div className="h-6 w-32 skeleton" /><div className="card h-64" /></div>;

  if (!form) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <span className="text-red-600 text-2xl font-bold">!</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy khuyến mãi</h2>
        <p className="text-sm text-gray-500 mb-6">{error}</p>
        <button onClick={() => router.push('/promotions')} className="btn-primary">Quay lại</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up max-w-xl">
      <button onClick={() => router.push(`/promotions/${params.id}`)} className="btn-ghost mb-4 -ml-2">
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Quay lại
      </button>

      <div>
        <h1 className="text-xl font-bold text-gray-900">Chỉnh sửa khuyến mãi</h1>
        <p className="text-sm text-gray-500 font-mono">{form.code}</p>
      </div>

      <div className="card mt-4 space-y-5">
        <Field label="Tên chương trình">
          <input type="text" value={form.name} disabled
            className="w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-500" />
        </Field>

        <Field label="Mô tả">
          <textarea value={form.description ?? ''} rows={3}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="input-field resize-none" />
        </Field>

        <Field label="Ngày kết thúc">
          <input type="date" value={form.endDate?.split('T')[0] ?? ''}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            className="input-field" />
        </Field>

        <label className="flex items-center justify-between gap-3 cursor-pointer">
          <span className="text-sm font-medium text-gray-700">Đang hoạt động</span>
          <input type="checkbox" checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
            className="h-4 w-4" />
        </label>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">{error}</div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={() => router.push(`/promotions/${params.id}`)} className="btn-ghost">Huỷ</button>
          <button onClick={handleSave} disabled={isSaving} className="btn-primary">
            <Save className="h-4 w-4 mr-1.5" />
            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}
