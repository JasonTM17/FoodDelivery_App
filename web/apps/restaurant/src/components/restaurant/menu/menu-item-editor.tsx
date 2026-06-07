'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UtensilsCrossed, Upload, X } from 'lucide-react';
import { api } from '@/lib/api';
import type { MenuItem } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const ALLERGEN_LIST = ['Gluten', 'Dairy', 'Eggs', 'Nuts', 'Peanuts', 'Soy', 'Fish', 'Shellfish'];

interface MenuItemEditorProps {
  id: string;
}

export function MenuItemEditor({ id }: MenuItemEditorProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [item, setItem] = useState<Partial<MenuItem>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState('');
  const [available, setAvailable] = useState(true);
  const [allergens, setAllergens] = useState<string[]>([]);

  useEffect(() => {
    api
      .get<MenuItem & { allergens?: string[] }>(`/menu/${id}`)
      .then((data) => {
        setItem(data);
        setName(data.name);
        setDescription(data.description);
        setPrice(data.price.toString());
        setCategory(data.category);
        setImage(data.image || '');
        setAvailable(data.available);
        setAllergens(data.allergens ?? []);
      })
      .catch((err: unknown) =>
        setError((err as { message?: string }).message || 'Không thể tải món')
      )
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const token =
        typeof window !== 'undefined' ? localStorage.getItem('restaurant_token') : null;
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/storage/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error('Upload thất bại');
      const { url } = (await res.json()) as { url: string };
      setImage(url);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Upload ảnh thất bại');
    } finally {
      setIsUploading(false);
    }
  };

  const toggleAllergen = (allergen: string) =>
    setAllergens((prev) =>
      prev.includes(allergen) ? prev.filter((x) => x !== allergen) : [...prev, allergen]
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Vui lòng nhập tên món'); return; }
    if (!price || parseFloat(price) <= 0) { setError('Vui lòng nhập giá hợp lệ'); return; }
    setIsSubmitting(true);
    setError('');
    try {
      await api.patch(`/menu/${id}`, {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category,
        image,
        available,
        allergens,
        options: item.options ?? [],
      });
      router.push('/menu');
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Không thể lưu. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return null;

  return (
    <div>
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
          <p className="text-sm text-gray-500">Cập nhật thông tin món ăn</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Tên món *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="VD: Phở bò tái chín"
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Mô tả</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="input-field resize-none"
              />
            </div>
            <div>
              <label className="label">Giá *</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="input-field"
                min="0"
              />
            </div>
            <div>
              <label className="label">Danh mục</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field"
                placeholder="VD: Món chính"
              />
            </div>
          </div>

          {/* Image upload */}
          <div>
            <label className="label">Hình ảnh</label>
            <div className="flex gap-3 items-start flex-wrap">
              {image && (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border shrink-0">
                  <img src={image} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow"
                    aria-label="Xoá ảnh"
                  >
                    <X className="h-3.5 w-3.5 text-gray-600" />
                  </button>
                </div>
              )}
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Đang tải...' : 'Tải ảnh lên'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImageUpload(f);
                  e.target.value = '';
                }}
              />
            </div>
          </div>

          {/* Allergens */}
          <div>
            <label className="label">Chất gây dị ứng</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {ALLERGEN_LIST.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAllergen(a)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    allergens.includes(a)
                      ? 'bg-orange-100 border-orange-300 text-orange-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Availability */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="available-toggle"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="available-toggle" className="text-sm text-gray-700">
              Món đang có sẵn
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => router.push('/menu')} className="btn-ghost">
              Huỷ
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
