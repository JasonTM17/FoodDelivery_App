'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface MenuItemPhotoUploadProps {
  value: string;
  onChange: (url: string) => void;
  onUpload?: (file: File) => Promise<string>;
}

export function MenuItemPhotoUpload({ value, onChange, onUpload }: MenuItemPhotoUploadProps) {
  const t = useTranslations('menu.photoUpload');
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      if (onUpload) {
        const url = await onUpload(file);
        setPreview(url);
        onChange(url);
      } else {
        // local preview only
        const reader = new FileReader();
        reader.onload = () => {
          setPreview(reader.result as string);
          onChange(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div data-testid="menu-item-photo-upload">
      <label className="label">{t('label')}</label>
      {preview ? (
        <div className="relative w-40 h-40 rounded-lg overflow-hidden border">
          <div
            role="img"
            aria-label={t('previewAria')}
            className="h-full w-full bg-gray-100 bg-cover bg-center"
            style={{ backgroundImage: `url(${JSON.stringify(preview)})` }}
          />
          <button
            type="button"
            onClick={() => { setPreview(''); onChange(''); }}
            className="absolute top-1 right-1 rounded-full bg-white/80 p-0.5 hover:bg-white"
            aria-label={t('removeAria')}
          >
            <X className="h-4 w-4 text-gray-700" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex flex-col items-center justify-center w-40 h-40 rounded-lg border-2 border-dashed border-gray-300 hover:border-brand-400 transition-colors"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 text-brand-500 animate-spin" />
          ) : (
            <>
              <Upload className="h-6 w-6 text-gray-400 mb-1" />
              <span className="text-xs text-gray-500">{t('upload')}</span>
            </>
          )}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
