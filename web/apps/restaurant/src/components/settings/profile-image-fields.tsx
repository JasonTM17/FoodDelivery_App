import type { ChangeEvent, RefObject } from 'react';
import { Camera } from 'lucide-react';

interface ProfileImageFieldsProps {
  coverPreview: string | null;
  logoPreview: string | null;
  coverRef: RefObject<HTMLInputElement>;
  logoRef: RefObject<HTMLInputElement>;
  onImageChange: (event: ChangeEvent<HTMLInputElement>, type: 'cover' | 'logo') => void;
}

export function ProfileImageFields({
  coverPreview,
  logoPreview,
  coverRef,
  logoRef,
  onImageChange,
}: ProfileImageFieldsProps) {
  return (
    <div className="card mb-6 space-y-4">
      <h2 className="text-base font-semibold text-gray-900">Ảnh đại diện</h2>
      <div>
        <label className="label">Ảnh bìa (16:9)</label>
        <div
          onClick={() => coverRef.current?.click()}
          className="relative flex aspect-video w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-brand-400"
        >
          {coverPreview ? (
            <div
              role="img"
              aria-label="Cover"
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${JSON.stringify(coverPreview)})` }}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <Camera className="h-8 w-8" />
              <span className="text-sm">Nhấn để tải ảnh bìa</span>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors hover:bg-black/10">
            {coverPreview && <Camera className="h-6 w-6 text-white opacity-0 hover:opacity-100" />}
          </div>
        </div>
        <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={event => onImageChange(event, 'cover')} />
      </div>
      <div>
        <label className="label">Logo nhà hàng</label>
        <div className="flex items-center gap-4">
          <div
            onClick={() => logoRef.current?.click()}
            className="flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-brand-400"
          >
            {logoPreview ? (
              <div
                role="img"
                aria-label="Logo"
                className="h-full w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${JSON.stringify(logoPreview)})` }}
              />
            ) : (
              <Camera className="h-6 w-6 text-gray-400" />
            )}
          </div>
          <p className="text-sm text-gray-500">Ảnh vuông, tối thiểu 200×200px. Định dạng JPG, PNG, WebP.</p>
        </div>
        <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={event => onImageChange(event, 'logo')} />
      </div>
    </div>
  );
}
