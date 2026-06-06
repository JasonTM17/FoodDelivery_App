'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { MenuItem, MenuItemOption, MenuItemChoice } from '@/lib/types';
import { cn } from '@/lib/utils';

export interface MenuItemFormData {
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
  options: MenuItemOption[];
}

interface MenuItemFormProps {
  initialData?: Partial<MenuItem>;
  onSubmit: (data: MenuItemFormData) => Promise<void>;
  isSubmitting?: boolean;
}

const DEFAULT_CATEGORIES = [
  'Khai vị',
  'Món chính',
  'Món soup',
  'Salad',
  'Đồ uống',
  'Tráng miệng',
  'Combo',
];

export function MenuItemForm({ initialData, onSubmit, isSubmitting }: MenuItemFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [price, setPrice] = useState(initialData?.price?.toString() || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [image, setImage] = useState(initialData?.image || '');
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [options, setOptions] = useState<MenuItemOption[]>(initialData?.options || []);
  const [error, setError] = useState('');

  const addOption = () => {
    setOptions([
      ...options,
      { id: crypto.randomUUID(), name: '', type: 'single', required: false, choices: [] },
    ]);
  };

  const updateOption = (index: number, field: keyof MenuItemOption, value: unknown) => {
    const updated = [...options];
    updated[index] = { ...updated[index], [field]: value };
    setOptions(updated);
  };

  const removeOption = (index: number) => setOptions(options.filter((_, i) => i !== index));

  const addChoice = (optionIndex: number) => {
    const updated = [...options];
    updated[optionIndex].choices.push({ id: crypto.randomUUID(), name: '', price: 0 });
    setOptions(updated);
  };

  const updateChoice = (
    optionIndex: number,
    choiceIndex: number,
    field: keyof MenuItemChoice,
    value: unknown
  ) => {
    const updated = [...options];
    updated[optionIndex].choices[choiceIndex] = {
      ...updated[optionIndex].choices[choiceIndex],
      [field]: value,
    };
    setOptions(updated);
  };

  const removeChoice = (optionIndex: number, choiceIndex: number) => {
    const updated = [...options];
    updated[optionIndex].choices = updated[optionIndex].choices.filter((_, i) => i !== choiceIndex);
    setOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Vui lòng nhập tên món'); return; }
    if (!price || parseFloat(price) <= 0) { setError('Vui lòng nhập giá hợp lệ'); return; }
    if (!category && !customCategory) { setError('Vui lòng chọn danh mục'); return; }
    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      category: showCustomCategory ? customCategory : category,
      image,
      available: initialData?.available ?? true,
      options,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="label">Tên món *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="VD: Phở bò tái chín" />
        </div>

        <div className="md:col-span-2">
          <label className="label">Mô tả</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input-field resize-none" placeholder="Mô tả ngắn về món ăn..." />
        </div>

        <div>
          <label className="label">Giá *</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="input-field" placeholder="0" min="0" />
        </div>

        <div>
          <label className="label">Danh mục</label>
          {showCustomCategory ? (
            <div className="flex gap-2">
              <input type="text" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} className="input-field" placeholder="Nhập danh mục mới" />
              <button type="button" onClick={() => setShowCustomCategory(false)} className="btn-ghost text-xs shrink-0">Chọn</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="select-field">
                <option value="">Chọn danh mục</option>
                {DEFAULT_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <button type="button" onClick={() => setShowCustomCategory(true)} className="btn-ghost text-xs shrink-0">Thêm</button>
            </div>
          )}
        </div>

        <div>
          <label className="label">URL hình ảnh</label>
          <input type="url" value={image} onChange={(e) => setImage(e.target.value)} className="input-field" placeholder="https://..." />
        </div>
      </div>

      {image && (
        <div className="rounded-lg overflow-hidden border w-40 h-40">
          <img src={image} alt="Preview" className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" fill="%23ddd"><rect width="160" height="160"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="12" fill="%23999">No Image</text></svg>'; }}
          />
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Tùy chọn món</h3>
          <button type="button" onClick={addOption} className="btn-secondary text-xs py-1.5">
            <Plus className="h-3.5 w-3.5 mr-1" />
            Thêm tùy chọn
          </button>
        </div>

        {options.length === 0 && (
          <p className="text-sm text-gray-400 italic">
            Chưa có tùy chọn nào. Nhấn &quot;Thêm tùy chọn&quot; để thêm (ví dụ: kích cỡ, topping).
          </p>
        )}

        <div className="space-y-3">
          {options.map((option, oi) => (
            <div key={option.id} className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="label">Tên tùy chọn</label>
                    <input type="text" value={option.name} onChange={(e) => updateOption(oi, 'name', e.target.value)} className="input-field" placeholder="VD: Kích cỡ" />
                  </div>
                  <div>
                    <label className="label">Kiểu</label>
                    <select value={option.type} onChange={(e) => updateOption(oi, 'type', e.target.value)} className="select-field">
                      <option value="single">Chọn 1</option>
                      <option value="multi">Chọn nhiều</option>
                    </select>
                  </div>
                  <div className="flex items-end gap-2">
                    <label className="flex items-center gap-2 pb-2">
                      <input type="checkbox" checked={option.required} onChange={(e) => updateOption(oi, 'required', e.target.checked)} className="rounded border-gray-300" />
                      <span className="text-sm text-gray-700">Bắt buộc</span>
                    </label>
                    <button type="button" onClick={() => removeOption(oi)} className="btn-ghost text-red-500 p-2">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="ml-4 space-y-2">
                {option.choices.map((choice, ci) => (
                  <div key={choice.id} className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-gray-300 shrink-0" />
                    <input type="text" value={choice.name} onChange={(e) => updateChoice(oi, ci, 'name', e.target.value)} className="input-field flex-1" placeholder="Tên lựa chọn" />
                    <input type="number" value={choice.price || ''} onChange={(e) => updateChoice(oi, ci, 'price', parseFloat(e.target.value) || 0)} className="input-field w-24" placeholder="Giá" min="0" />
                    <button type="button" onClick={() => removeChoice(oi, ci)} className="btn-ghost text-red-500 p-2">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => addChoice(oi)} className="btn-ghost text-xs text-brand-600">
                  <Plus className="h-3 w-3 mr-1" />
                  Thêm lựa chọn
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? 'Đang lưu...' : initialData ? 'Cập nhật' : 'Thêm món'}
        </button>
      </div>
    </form>
  );
}
