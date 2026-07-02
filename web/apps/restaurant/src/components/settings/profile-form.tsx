'use client';

import { useEffect, useRef, useState } from 'react';
import { api, setStoredRestaurant } from '@/lib/api';
import type { Restaurant } from '@/lib/types';
import {
  AlertMessage,
  BasicInfoFields,
  OperationsFields,
  ProfileHeader,
  ProfileSkeleton,
} from './profile-form-fields';
import { ProfileImageFields } from './profile-image-fields';
import { ProfileSaveBar } from './profile-save-bar';

export function ProfileForm() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [minOrder, setMinOrder] = useState('0');
  const [isOpen, setIsOpen] = useState(true);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const coverRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        hydrateForm(await api.get<Restaurant>('/restaurant/profile'));
      } catch (err: unknown) {
        setError((err as { message?: string }).message || 'Không thể tải thông tin nhà hàng');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const hydrateForm = (data: Restaurant) => {
    const extra = data as Restaurant & {
      cuisines?: string[];
      minOrderAmount?: number;
    };
    const cover = data.coverUrl ?? data.coverImage ?? null;
    const logo = data.logoUrl ?? data.logo ?? null;

    setRestaurant(data);
    setName(data.name);
    setDescription(data.description || '');
    setAddress(data.address ?? data.addressLine ?? '');
    setPhone(data.phone);
    setIsOpen(data.isOpen ?? data.isActive);
    setCuisines(extra.cuisines ?? data.cuisineTypes ?? []);
    setMinOrder(String(extra.minOrderAmount ?? 0));
    setCoverPreview(cover);
    setCoverUrl(cover);
    setLogoPreview(logo);
    setLogoUrl(logo);
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'logo') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    if (type === 'cover') setCoverPreview(previewUrl);
    else setLogoPreview(previewUrl);

    setUploading(true);
    setError('');
    const uploaded = await uploadImage(file);
    setUploading(false);

    if (!uploaded) {
      setError('Không thể tải ảnh lên. Vui lòng thử lại.');
      return;
    }
    if (type === 'cover') setCoverUrl(uploaded);
    else setLogoUrl(uploaded);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      const updated = await api.patch<Restaurant>('/restaurant/profile', {
        name,
        description,
        addressLine: address,
        phone,
        isOpen,
        cuisineTypes: cuisines,
        minOrderAmount: Number(minOrder),
        ...(coverUrl ? { coverUrl } : {}),
        ...(logoUrl ? { logoUrl } : {}),
      });
      hydrateForm(updated);
      setStoredRestaurant(updated);
      setSuccess('Đã lưu hồ sơ nhà hàng');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Không thể lưu thông tin');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <ProfileSkeleton />;

  return (
    <form onSubmit={handleSave} className="pb-24">
      <ProfileHeader />
      <AlertMessage error={error} success={success} />
      <ProfileImageFields
        coverPreview={coverPreview}
        logoPreview={logoPreview}
        coverRef={coverRef}
        logoRef={logoRef}
        onImageChange={handleImageChange}
      />
      <BasicInfoFields
        values={{ name, description, address, phone }}
        setters={{ setName, setDescription, setAddress, setPhone }}
        cuisines={cuisines}
        onToggleCuisine={toggleCuisine}
      />
      <OperationsFields
        minOrder={minOrder}
        isOpen={isOpen}
        setMinOrder={setMinOrder}
        setIsOpen={setIsOpen}
      />
      <ProfileSaveBar restaurant={restaurant} isSaving={isSaving} uploading={uploading} />
    </form>
  );

  function toggleCuisine(cuisine: string) {
    setCuisines(prev => (prev.includes(cuisine) ? prev.filter(item => item !== cuisine) : [...prev, cuisine]));
  }
}

async function uploadImage(file: File): Promise<string | null> {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const uploaded = await api.post<{ url: string }>('/restaurant/profile/upload', formData);
    return uploaded.url;
  } catch {
    return null;
  }
}
