'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, UtensilsCrossed } from 'lucide-react';
import { MenuItemOptionsBuilder } from '@/components/menu/menu-item-options-builder';
import { MenuItemPhotoUpload } from '@/components/menu/menu-item-photo-upload';
import { MenuItemAvailabilityToggle } from '@/components/menu/menu-item-availability-toggle';
import { api } from '@/lib/api';
import type { MenuItem, MenuItemOption } from '@/lib/types';
import { MenuItemAllergenPicker } from './menu-item-allergen-picker';

interface MenuItemEditorProps {
  id: string;
}

export function MenuItemEditor({ id }: MenuItemEditorProps) {
  const router = useRouter();
  const t = useTranslations('menu.editPage');
  const tBoard = useTranslations('menu.board');
  const tForm = useTranslations('menu.form');
  const loadErrorMessage = t('loadError');
  const contractErrorMessage = t('contractError');

  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedItem, setHasLoadedItem] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
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
    setIsLoading(true);
    setHasLoadedItem(false);
    setError('');
    api
      .get<unknown>(`/restaurant/menu/items/${id}`)
      .then((data) => {
        const item = parseMenuItemEditorPayload(data, contractErrorMessage);
        setName(item.name);
        setDescription(item.description ?? '');
        setPrice(item.price.toString());
        setCategory(item.category);
        setImage(item.image || '');
        setAllergens(item.allergens);
        setOptions(item.options);
        if (item.available === false) {
          setAvailabilityMode('hidden');
        } else {
          setAvailabilityMode('always');
        }
        setHasLoadedItem(true);
      })
      .catch((err: unknown) =>
        setError((err as { message?: string }).message || loadErrorMessage)
      )
      .finally(() => setIsLoading(false));
  }, [id, contractErrorMessage, loadErrorMessage, reloadKey]);

  const toggleAllergen = (allergen: string) =>
    setAllergens((prev) =>
      prev.includes(allergen) ? prev.filter((x) => x !== allergen) : [...prev, allergen]
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError(tForm('errors.nameRequired')); return; }
    if (!price || parseFloat(price) <= 0) { setError(tForm('errors.priceInvalid')); return; }
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
      setError((err as { message?: string }).message || t('saveError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return null;

  if (!hasLoadedItem) {
    return (
      <div>
        <button type="button" onClick={() => router.push('/menu')} className="btn-ghost mb-4 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          {t('back')}
        </button>

        <div className="rounded-lg border border-red-200 bg-red-50 p-6" role="alert">
          <h1 className="text-base font-semibold text-red-900">{loadErrorMessage}</h1>
          <p className="mt-2 text-sm text-red-700">{error || loadErrorMessage}</p>
          <button
            type="button"
            onClick={() => setReloadKey((current) => current + 1)}
            className="btn-secondary mt-4"
          >
            {tBoard('retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button type="button" onClick={() => router.push('/menu')} className="btn-ghost mb-4 -ml-2">
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        {t('back')}
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
          <UtensilsCrossed className="h-5 w-5 text-brand-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-sm text-gray-500">{t('description')}</p>
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
              <label className="label">{tForm('name')}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder={tForm('namePlaceholder')}
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">{tForm('description')}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="input-field resize-none"
              />
            </div>
            <div>
              <label className="label">{tForm('price')}</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="input-field"
                min="0"
              />
            </div>
            <div>
              <label className="label">{tForm('category')}</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field"
                placeholder={t('categoryPlaceholder')}
              />
            </div>
          </div>

          <MenuItemPhotoUpload value={image} onChange={setImage} />

          <MenuItemOptionsBuilder options={options} onChange={setOptions} />

          <MenuItemAvailabilityToggle
            mode={availabilityMode}
            onModeChange={setAvailabilityMode}
            schedule={schedule}
            onScheduleChange={setSchedule}
          />

          <MenuItemAllergenPicker allergens={allergens} onToggle={toggleAllergen} />

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => router.push('/menu')} className="btn-ghost">
              {t('cancel')}
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? tForm('saving') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type MenuItemEditorPayload = MenuItem & { allergens: string[] };

function parseMenuItemEditorPayload(value: unknown, contractErrorMessage: string): MenuItemEditorPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(contractErrorMessage);
  }
  const item = value as Partial<MenuItem> & { allergens?: unknown; options?: unknown };
  if (
    typeof item.id !== 'string' ||
    typeof item.name !== 'string' ||
    typeof item.price !== 'number' ||
    !Number.isFinite(item.price) ||
    typeof item.category !== 'string' ||
    typeof item.available !== 'boolean' ||
    !Array.isArray(item.allergens) ||
    !item.allergens.every(allergen => typeof allergen === 'string') ||
    !Array.isArray(item.options)
  ) {
    throw new Error(contractErrorMessage);
  }
  return item as MenuItemEditorPayload;
}
