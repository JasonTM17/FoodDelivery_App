'use client';

import { useId, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { MenuItem, MenuItemOption } from '@/lib/types';
import { MenuItemOptionsBuilder } from './menu-item-options-builder';
import { getMenuItemFormError } from './menu-item-form-validation';

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

const DEFAULT_CATEGORY_KEYS = [
  'appetizers',
  'main',
  'soup',
  'salad',
  'drinks',
  'dessert',
  'combo',
] as const;

export function MenuItemForm({ initialData, onSubmit, isSubmitting }: MenuItemFormProps) {
  const t = useTranslations('menu.form');
  const formId = useId();
  const defaultCategories = useMemo(
    () => DEFAULT_CATEGORY_KEYS.map(key => ({ key, label: t(`categories.${key}`) })),
    [t],
  );
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [price, setPrice] = useState(initialData?.price?.toString() || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [image, setImage] = useState(initialData?.image || '');
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [options, setOptions] = useState<MenuItemOption[]>(initialData?.options || []);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    const validationError = getMenuItemFormError({
      name,
      description,
      price,
      category,
      customCategory,
      useCustomCategory: showCustomCategory,
      image,
      options,
    });
    if (validationError) {
      setError(t(`errors.${validationError}`));
      return;
    }

    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      category: showCustomCategory ? customCategory.trim() : category,
      image: image.trim(),
      available: initialData?.available ?? true,
      options,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
      aria-label={t('formAria')}
      aria-describedby={error ? `${formId}-error` : undefined}
    >
      {error && (
        <div id={`${formId}-error`} className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label htmlFor={`${formId}-name`} className="label">{t('name')}</label>
          <input
            id={`${formId}-name`}
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
            required
            className="input-field"
            placeholder={t('namePlaceholder')}
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor={`${formId}-description`} className="label">{t('description')}</label>
          <textarea
            id={`${formId}-description`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            maxLength={500}
            className="input-field resize-none"
            placeholder={t('descriptionPlaceholder')}
          />
        </div>

        <div>
          <label htmlFor={`${formId}-price`} className="label">{t('price')}</label>
          <input id={`${formId}-price`} type="number" value={price} onChange={(event) => setPrice(event.target.value)} className="input-field" placeholder="0" min="1" required />
        </div>

        <div>
          <label htmlFor={`${formId}-category`} className="label">{t('category')}</label>
          {showCustomCategory ? (
            <div className="flex gap-2">
              <input
                id={`${formId}-category`}
                type="text"
                value={customCategory}
                onChange={(event) => setCustomCategory(event.target.value)}
                maxLength={100}
                required
                className="input-field"
                placeholder={t('customCategoryPlaceholder')}
              />
              <button type="button" onClick={() => setShowCustomCategory(false)} className="btn-ghost shrink-0 text-xs">
                {t('selectCategory')}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <select id={`${formId}-category`} value={category} onChange={(event) => setCategory(event.target.value)} className="select-field" required>
                <option value="">{t('selectCategory')}</option>
                {defaultCategories.map((cat) => <option key={cat.key} value={cat.label}>{cat.label}</option>)}
              </select>
              <button type="button" onClick={() => setShowCustomCategory(true)} className="btn-ghost shrink-0 text-xs">
                {t('addCategory')}
              </button>
            </div>
          )}
        </div>

        <div>
          <label htmlFor={`${formId}-image`} className="label">{t('imageUrl')}</label>
          <input id={`${formId}-image`} type="url" value={image} onChange={(event) => setImage(event.target.value)} className="input-field" placeholder="https://..." inputMode="url" />
        </div>
      </div>

      {image && (
        <div className="h-40 w-40 overflow-hidden rounded-lg border">
          <div
            role="img"
            aria-label={t('imagePreview')}
            className="h-full w-full bg-gray-100 bg-cover bg-center"
            style={{ backgroundImage: `url(${JSON.stringify(image)})` }}
          />
        </div>
      )}

      <MenuItemOptionsBuilder options={options} onChange={setOptions} />

      <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? t('saving') : initialData ? t('update') : t('create')}
        </button>
      </div>
    </form>
  );
}
