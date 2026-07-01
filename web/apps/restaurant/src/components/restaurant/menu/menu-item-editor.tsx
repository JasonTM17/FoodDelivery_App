'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from '@/navigation';
import { ArrowLeft, UtensilsCrossed } from 'lucide-react';
import { MenuItemOptionsBuilder } from '@/components/menu/menu-item-options-builder';
import { MenuItemPhotoUpload } from '@/components/menu/menu-item-photo-upload';
import { MenuItemAvailabilityToggle } from '@/components/menu/menu-item-availability-toggle';
import { api } from '@/lib/api';
import type { MenuItem, MenuItemOption } from '@/lib/types';

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
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState('');
  const [allergens, setAllergens] = useState<string[]>([]);
  const [options, setOptions] = useState<MenuItemOption[]>([]);
  const [availabilityMode, setAvailabilityMode] = useState<'always' | 'scheduled' | 'hidden'>('always');
  const [schedule, setSchedule] = useState<{ open: string; close: string }>({ open: '', close: '' });

  useEffect(() => {
    api
      .get<MenuItem & { allergens?: string[] }>(`/restaurant/menu/items/${id}`)
      .then((data) => {
        setItem(data);
        setName(data.name);
        setDescription(data.description);
        setPrice(data.price.toString());
        setCategory(data.category);
        setImage(data.image || '');
        setAllergens(data.allergens ?? []);
        setOptions(data.options ?? []);
        if (data.available === false) {
          setAvailabilityMode('hidden');
        } else {
          setAvailabilityMode('always');
        }
      })
      .catch((err: unknown) =>
        setError((err as { message?: string }).message || 'Không thể tải món')
      )
      .finally(() => setIsLoading(false));
  }, [id]);

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
      await api.patch(`/restaurant/menu/items/${id}`, {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category,
        image,
        available: availabilityMode !== 'hidden',
        availabilityMode: availabilityMode,
        availabilitySchedule: availabilityMode === 'scheduled' ? schedule : undefined,
        allergens,
        options,
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

          {/* Photo upload - new component */}
          <MenuItemPhotoUpload value={image} onChange={setImage} />

          {/* Options builder - new component */}
          <MenuItemOptionsBuilder options={options} onChange={setOptions} />

          {/* Availability toggle - new component replaces simple checkbox */}
          <MenuItemAvailabilityToggle
            mode={availabilityMode}
            onModeChange={setAvailabilityMode}
            schedule={schedule}
            onScheduleChange={setSchedule}
          />

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
