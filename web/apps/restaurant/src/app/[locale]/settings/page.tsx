'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, AlertCircle } from 'lucide-react';
import { api, getStoredRestaurant, setStoredRestaurant } from '@/lib/api';
import type { Restaurant, OpeningHours, DayHours } from '@/lib/types';

const DAY_LABELS: Record<keyof OpeningHours, string> = {
  monday: 'Thứ hai',
  tuesday: 'Thứ ba',
  wednesday: 'Thứ tư',
  thursday: 'Thứ năm',
  friday: 'Thứ sáu',
  saturday: 'Thứ bảy',
  sunday: 'Chủ nhật',
};

const DAY_ORDER: (keyof OpeningHours)[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
];

export default function SettingsPage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [openingHours, setOpeningHours] = useState<OpeningHours>({
    monday: { open: '08:00', close: '22:00', isClosed: false },
    tuesday: { open: '08:00', close: '22:00', isClosed: false },
    wednesday: { open: '08:00', close: '22:00', isClosed: false },
    thursday: { open: '08:00', close: '22:00', isClosed: false },
    friday: { open: '08:00', close: '22:00', isClosed: false },
    saturday: { open: '09:00', close: '23:00', isClosed: false },
    sunday: { open: '09:00', close: '22:00', isClosed: false },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.get<Restaurant>('/restaurants/profile');
        setRestaurant(data);
        setName(data.name);
        setDescription(data.description || '');
        setAddress(data.address);
        setPhone(data.phone);
        setOpeningHours(data.openingHours);
      } catch (err: unknown) {
        const apiError = err as { message?: string };
        setError(apiError.message || 'Không thể tải thông tin nhà hàng');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const updateHour = (day: keyof OpeningHours, field: keyof DayHours, value: string | boolean) => {
    setOpeningHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const updated = await api.put<Restaurant>('/restaurants/profile', {
        name,
        description,
        address,
        phone,
        openingHours,
      });
      setRestaurant(updated);
      setStoredRestaurant(updated);
      setSuccess('Đã lưu thông tin thành công');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      const apiError = err as { message?: string };
      setError(apiError.message || 'Không thể lưu thông tin');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl skeleton" />
          <div>
            <div className="h-6 w-36 skeleton mb-1" />
            <div className="h-4 w-40 skeleton" />
          </div>
        </div>
        <div className="card max-w-2xl space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="h-4 w-24 skeleton mb-2" />
              <div className="h-10 w-full skeleton rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
          <Settings className="h-5 w-5 text-brand-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cài đặt nhà hàng</h1>
          <p className="text-sm text-gray-500">Quản lý thông tin và giờ hoạt động</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 mb-4 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3 mb-4 text-sm text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* Basic info */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Thông tin cơ bản</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Tên nhà hàng</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="label">Mô tả</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="input-field resize-none"
              />
            </div>
            <div>
              <label className="label">Địa chỉ</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="label">Số điện thoại</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-field"
                required
              />
            </div>
          </div>
        </div>

        {/* Opening hours */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Giờ hoạt động</h2>
          <div className="space-y-3">
            {DAY_ORDER.map((day) => {
              const hours = openingHours[day];
              return (
                <div key={day} className="flex items-center gap-4 py-2 border-b border-gray-100 last:border-0">
                  <div className="w-24 shrink-0">
                    <span className="text-sm font-medium text-gray-700">
                      {DAY_LABELS[day]}
                    </span>
                  </div>
                  <label className="flex items-center gap-2 min-w-[80px]">
                    <input
                      type="checkbox"
                      checked={!hours.isClosed}
                      onChange={(e) => updateHour(day, 'isClosed', !e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-600">
                      {hours.isClosed ? 'Đóng cửa' : 'Mở cửa'}
                    </span>
                  </label>
                  {!hours.isClosed && (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={hours.open}
                        onChange={(e) => updateHour(day, 'open', e.target.value)}
                        className="input-field w-32"
                      />
                      <span className="text-gray-400">→</span>
                      <input
                        type="time"
                        value={hours.close}
                        onChange={(e) => updateHour(day, 'close', e.target.value)}
                        className="input-field w-32"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button type="submit" disabled={isSaving} className="btn-primary">
            <Save className="h-4 w-4 mr-1.5" />
            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </div>
  );
}
