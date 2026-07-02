'use client';

import { useTranslations } from 'next-intl';

const ALLERGEN_OPTIONS = [
  { value: 'Gluten', labelKey: 'gluten' },
  { value: 'Dairy', labelKey: 'dairy' },
  { value: 'Eggs', labelKey: 'eggs' },
  { value: 'Nuts', labelKey: 'nuts' },
  { value: 'Peanuts', labelKey: 'peanuts' },
  { value: 'Soy', labelKey: 'soy' },
  { value: 'Fish', labelKey: 'fish' },
  { value: 'Shellfish', labelKey: 'shellfish' },
] as const;

interface MenuItemAllergenPickerProps {
  allergens: string[];
  onToggle: (allergen: string) => void;
}

export function MenuItemAllergenPicker({ allergens, onToggle }: MenuItemAllergenPickerProps) {
  const t = useTranslations('menu.editPage.allergens');

  return (
    <div>
      <label className="label">{t('label')}</label>
      <div className="mt-1 flex flex-wrap gap-2">
        {ALLERGEN_OPTIONS.map((allergen) => (
          <button
            key={allergen.value}
            type="button"
            onClick={() => onToggle(allergen.value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              allergens.includes(allergen.value)
                ? 'border-orange-300 bg-orange-100 text-orange-700'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
          >
            {t(`options.${allergen.labelKey}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
