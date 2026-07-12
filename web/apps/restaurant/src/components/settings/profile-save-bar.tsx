import { Save } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { Restaurant } from '@/lib/types';

interface ProfileSaveBarProps {
  restaurant: Restaurant | null;
  isSaving: boolean;
  uploading: boolean;
}

export function ProfileSaveBar({ restaurant, isSaving, uploading }: ProfileSaveBarProps) {
  const locale = useLocale();
  const t = useTranslations('settings.profileForm.saveBar');

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-end gap-3 border-t border-gray-200 bg-white px-6 py-3">
      {restaurant && (
        <p className="mr-auto text-xs text-gray-600">
          {t('lastUpdated', { date: new Date(restaurant.updatedAt).toLocaleDateString(locale) })}
        </p>
      )}
      <button type="submit" disabled={isSaving || uploading} className="btn-primary">
        <Save className="mr-1.5 h-4 w-4" />
        {uploading ? t('uploading') : isSaving ? t('saving') : t('save')}
      </button>
    </div>
  );
}
