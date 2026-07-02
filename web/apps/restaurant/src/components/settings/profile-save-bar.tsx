import { Save } from 'lucide-react';
import type { Restaurant } from '@/lib/types';

interface ProfileSaveBarProps {
  restaurant: Restaurant | null;
  isSaving: boolean;
  uploading: boolean;
}

export function ProfileSaveBar({ restaurant, isSaving, uploading }: ProfileSaveBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-end gap-3 border-t border-gray-200 bg-white px-6 py-3">
      {restaurant && (
        <p className="mr-auto text-xs text-gray-400">
          Cập nhật lần cuối: {new Date(restaurant.updatedAt).toLocaleDateString('vi-VN')}
        </p>
      )}
      <button type="submit" disabled={isSaving || uploading} className="btn-primary">
        <Save className="mr-1.5 h-4 w-4" />
        {uploading ? 'Đang tải ảnh...' : isSaving ? 'Đang lưu...' : 'Lưu hồ sơ'}
      </button>
    </div>
  );
}
