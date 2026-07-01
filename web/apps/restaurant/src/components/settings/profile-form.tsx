'use client';

import { useState, useEffect, useRef } from 'react';
import { UserCircle, Save, AlertCircle, Camera, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, getStoredRestaurant, setStoredRestaurant } from '@/lib/api';
import type { Restaurant } from '@/lib/types';

const CUISINE_OPTIONS = [
  'Việt Nam', 'Trung Hoa', 'Nhật Bản', 'Hàn Quốc', 'Thái Lan',
  'Ý', 'Fastfood', 'Chay', 'Hải sản', 'Lẩu', 'Nướng', 'Bánh mì',
];

export function ProfileForm() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [minOrder, setMinOrder] = useState('0');
  const [deliveryFee, setDeliveryFee] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [bankAccount, setBankAccount] = useState('');
  const [bankName, setBankName] = useState('');
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const coverRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<Restaurant>('/restaurant/profile');
        setRestaurant(data);
        setName(data.name);
        setDescription(data.description || '');
        setAddress(data.address);
        setPhone(data.phone);
        setIsActive(data.isActive);
        if (data.coverImage) { setCoverPreview(data.coverImage); setCoverUrl(data.coverImage); }
        if (data.logo) { setLogoPreview(data.logo); setLogoUrl(data.logo); }
      } catch (err: unknown) {
        const e = err as { message?: string };
        setError(e.message || 'Không thể tải thông tin nhà hàng');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const uploadImage = async (file: File, type: 'cover' | 'logo'): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('prefix', `restaurant-${type}`);
    const token = typeof window !== 'undefined' ? localStorage.getItem('restaurant_token') : null;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'}/storage/upload`,
        {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        }
      );
      if (!res.ok) return null;
      const json = await res.json() as { url: string };
      return json.url;
    } catch {
      return null;
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'logo') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    if (type === 'cover') setCoverPreview(previewUrl);
    else setLogoPreview(previewUrl);
    setUploading(true);
    setError('');
    const uploaded = await uploadImage(file, type);
    setUploading(false);
    if (uploaded) {
      if (type === 'cover') setCoverUrl(uploaded);
      else setLogoUrl(uploaded);
    } else {
      setError('Không thể tải ảnh lên. Vui lòng thử lại.');
    }
  };

  const toggleCuisine = (c: string) => {
    setCuisines((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      const updated = await api.patch<Restaurant>('/restaurant/profile', {
        name, description, address, phone, isActive,
        cuisines, minOrderAmount: Number(minOrder), deliveryFee: Number(deliveryFee),
        bankAccount, bankName,
        ...(coverUrl ? { coverImage: coverUrl } : {}),
        ...(logoUrl ? { logo: logoUrl } : {}),
      });
      setRestaurant(updated);
      setStoredRestaurant(updated);
      setSuccess('Đã lưu hồ sơ nhà hàng');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Không thể lưu thông tin');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="h-48 w-full skeleton rounded-xl mb-6" />
        <div className="card max-w-2xl space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}><div className="h-4 w-24 skeleton mb-2" /><div className="h-10 w-full skeleton rounded-lg" /></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="pb-24">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
          <UserCircle className="h-5 w-5 text-brand-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Hồ sơ nhà hàng</h1>
          <p className="text-sm text-gray-500">Thông tin hiển thị cho khách hàng</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 mb-4 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /><span>{error}</span>
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3 mb-4 text-sm text-green-700">{success}</div>
      )}

      {/* Cover + logo */}
      <div className="card mb-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Ảnh đại diện</h2>
        <div>
          <label className="label">Ảnh bìa (16:9)</label>
          <div
            onClick={() => coverRef.current?.click()}
            className="relative w-full aspect-video rounded-xl border-2 border-dashed border-gray-300 overflow-hidden cursor-pointer hover:border-brand-400 transition-colors bg-gray-50 flex items-center justify-center"
          >
            {coverPreview ? (
              <img src={coverPreview} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <Camera className="h-8 w-8" />
                <span className="text-sm">Nhấn để tải ảnh bìa</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
              {coverPreview && <Camera className="h-6 w-6 text-white opacity-0 hover:opacity-100" />}
            </div>
          </div>
          <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, 'cover')} />
        </div>
        <div>
          <label className="label">Logo nhà hàng</label>
          <div className="flex items-center gap-4">
            <div
              onClick={() => logoRef.current?.click()}
              className="h-24 w-24 rounded-full border-2 border-dashed border-gray-300 cursor-pointer hover:border-brand-400 transition-colors bg-gray-50 flex items-center justify-center overflow-hidden shrink-0"
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Camera className="h-6 w-6 text-gray-400" />
              )}
            </div>
            <p className="text-sm text-gray-500">Ảnh vuông, tối thiểu 200×200px. Định dạng JPG, PNG, WebP.</p>
          </div>
          <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, 'logo')} />
        </div>
      </div>

      {/* Basic info */}
      <div className="card mb-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Thông tin cơ bản</h2>
        <div><label className="label">Tên nhà hàng</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" required /></div>
        <div><label className="label">Mô tả</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input-field resize-none" placeholder="Giới thiệu về nhà hàng..." /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label">Địa chỉ</label><input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="input-field" required /></div>
          <div><label className="label">Số điện thoại</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field" required /></div>
        </div>
        <div>
          <label className="label">Ẩm thực</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {CUISINE_OPTIONS.map((c) => (
              <button key={c} type="button" onClick={() => toggleCuisine(c)}
                className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  cuisines.includes(c) ? 'bg-brand-500 text-white border-brand-500' : 'border-gray-300 text-gray-600 hover:border-brand-300 hover:text-brand-600')}
              >
                {cuisines.includes(c) && <X className="h-3 w-3 inline mr-1" />}{c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Operational */}
      <div className="card mb-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Thiết lập vận hành</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label">Đơn tối thiểu (đ)</label><input type="number" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} min="0" className="input-field" /></div>
          <div><label className="label">Phí giao hàng (đ)</label><input type="number" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} min="0" className="input-field" /></div>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
          <div>
            <p className="text-sm font-medium text-gray-900">Nhận đơn</p>
            <p className="text-xs text-gray-500">Bật để nhà hàng hiển thị và nhận đơn mới</p>
          </div>
          <button type="button" onClick={() => setIsActive((v) => !v)} className="focus:outline-none">
            {isActive ? <ToggleRight className="h-8 w-8 text-brand-500" /> : <ToggleLeft className="h-8 w-8 text-gray-400" />}
          </button>
        </div>
      </div>

      {/* Bank account */}
      <div className="card mb-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Tài khoản nhận thanh toán</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label">Số tài khoản</label><input type="text" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} placeholder="VD: 0123456789" className="input-field" /></div>
          <div><label className="label">Ngân hàng</label><input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="VD: Vietcombank" className="input-field" /></div>
        </div>
      </div>

      {/* Fixed save bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-end gap-3 z-30">
        {restaurant && <p className="text-xs text-gray-400 mr-auto">Cập nhật lần cuối: {new Date(restaurant.updatedAt).toLocaleDateString('vi-VN')}</p>}
        <button type="submit" disabled={isSaving || uploading} className="btn-primary">
          <Save className="h-4 w-4 mr-1.5" />
          {uploading ? 'Đang tải ảnh...' : isSaving ? 'Đang lưu...' : 'Lưu hồ sơ'}
        </button>
      </div>
    </form>
  );
}
