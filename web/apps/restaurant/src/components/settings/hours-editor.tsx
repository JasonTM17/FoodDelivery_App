'use client';

import { useState } from 'react';
import { Clock, Save, Plus, Trash2, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import type { OpeningHours, DayHours } from '@/lib/types';

const DAY_LABELS: Record<keyof OpeningHours, string> = {
  monday: 'Thứ Hai',
  tuesday: 'Thứ Ba',
  wednesday: 'Thứ Tư',
  thursday: 'Thứ Năm',
  friday: 'Thứ Sáu',
  saturday: 'Thứ Bảy',
  sunday: 'Chủ Nhật',
};

const DAY_ORDER: (keyof OpeningHours)[] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
];

const DEFAULT_HOURS: OpeningHours = {
  monday: { open: '08:00', close: '22:00', isClosed: false },
  tuesday: { open: '08:00', close: '22:00', isClosed: false },
  wednesday: { open: '08:00', close: '22:00', isClosed: false },
  thursday: { open: '08:00', close: '22:00', isClosed: false },
  friday: { open: '08:00', close: '22:00', isClosed: false },
  saturday: { open: '09:00', close: '23:00', isClosed: false },
  sunday: { open: '09:00', close: '22:00', isClosed: false },
};

interface Holiday {
  id: string;
  date: string;
  reason: string;
}

export function HoursEditor() {
  const [hours, setHours] = useState<OpeningHours>(DEFAULT_HOURS);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [newHoliday, setNewHoliday] = useState({ date: '', reason: '' });

  const updateHour = (day: keyof OpeningHours, field: keyof DayHours, value: string | boolean) => {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const copyToAll = (day: keyof OpeningHours) => {
    const source = hours[day];
    const updated = { ...hours };
    DAY_ORDER.forEach((d) => { updated[d] = { ...source }; });
    setHours(updated);
  };

  const addHoliday = () => {
    if (!newHoliday.date) return;
    setHolidays((prev) => [...prev, { id: Date.now().toString(), ...newHoliday }]);
    setNewHoliday({ date: '', reason: '' });
  };

  const removeHoliday = (id: string) => setHolidays((prev) => prev.filter((h) => h.id !== id));

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    try {
      await api.put('/restaurants/profile', { openingHours: hours, holidays });
      setSuccess('Đã lưu lịch hoạt động');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Không thể lưu');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Giờ hoạt động</h1>
            <p className="text-sm text-gray-500">Thiết lập lịch mở cửa hàng tuần</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="btn-primary">
          <Save className="h-4 w-4 mr-1.5" />
          {isSaving ? 'Đang lưu...' : 'Lưu lịch'}
        </button>
      </div>

      {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 mb-4 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-lg bg-green-50 border border-green-200 p-3 mb-4 text-sm text-green-700">{success}</div>}

      <div className="card mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Lịch hàng tuần</h2>
        <div className="space-y-1">
          {DAY_ORDER.map((day) => {
            const h = hours[day];
            return (
              <div
                key={day}
                className={cn('flex flex-wrap items-center gap-3 px-3 py-3 rounded-lg transition-colors',
                  h.isClosed ? 'bg-gray-50' : 'hover:bg-gray-50/50')}
              >
                <span className={cn('w-24 text-sm font-medium shrink-0', h.isClosed ? 'text-gray-400' : 'text-gray-700')}>
                  {DAY_LABELS[day]}
                </span>
                <label className="flex items-center gap-2 cursor-pointer min-w-[90px]">
                  <input
                    type="checkbox"
                    checked={!h.isClosed}
                    onChange={(e) => updateHour(day, 'isClosed', !e.target.checked)}
                    className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span className={cn('text-sm', h.isClosed ? 'text-gray-400' : 'text-gray-600')}>
                    {h.isClosed ? 'Đóng cửa' : 'Mở cửa'}
                  </span>
                </label>
                {!h.isClosed && (
                  <>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={h.open}
                        onChange={(e) => updateHour(day, 'open', e.target.value)}
                        className="input-field w-32"
                      />
                      <span className="text-gray-400 text-sm">→</span>
                      <input
                        type="time"
                        value={h.close}
                        onChange={(e) => updateHour(day, 'close', e.target.value)}
                        className="input-field w-32"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToAll(day)}
                      className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors ml-auto"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Áp dụng tất cả
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Lịch nghỉ lễ</h2>
        <p className="text-sm text-gray-500 mb-4">Thêm ngày nghỉ đặc biệt — nhà hàng sẽ tự động đóng cửa</p>
        <div className="flex gap-3 mb-4">
          <input
            type="date"
            value={newHoliday.date}
            onChange={(e) => setNewHoliday((prev) => ({ ...prev, date: e.target.value }))}
            className="input-field w-44"
          />
          <input
            type="text"
            value={newHoliday.reason}
            onChange={(e) => setNewHoliday((prev) => ({ ...prev, reason: e.target.value }))}
            placeholder="Lý do (ví dụ: Tết Nguyên Đán)"
            className="input-field flex-1"
          />
          <button onClick={addHoliday} disabled={!newHoliday.date} className="btn-secondary shrink-0">
            <Plus className="h-4 w-4 mr-1.5" />
            Thêm
          </button>
        </div>
        {holidays.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Chưa có ngày nghỉ lễ nào</p>
        ) : (
          <div className="space-y-2">
            {holidays.map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    {new Date(h.date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                  {h.reason && <span className="text-sm text-gray-500 ml-2">— {h.reason}</span>}
                </div>
                <button onClick={() => removeHoliday(h.id)} className="btn-ghost text-red-500 hover:text-red-600 hover:bg-red-50 p-1.5">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Xem trước tuần này</h2>
        <div className="grid grid-cols-7 gap-1">
          {DAY_ORDER.map((day) => {
            const h = hours[day];
            return (
              <div
                key={day}
                className={cn('rounded-lg p-2 text-center', h.isClosed ? 'bg-gray-100' : 'bg-brand-50 border border-brand-100')}
              >
                <p className={cn('text-xs font-medium mb-1', h.isClosed ? 'text-gray-400' : 'text-brand-700')}>
                  {DAY_LABELS[day].replace('Thứ ', 'T')}
                </p>
                {h.isClosed ? (
                  <p className="text-xs text-gray-400">Đóng</p>
                ) : (
                  <p className="text-xs text-brand-600">{h.open}<br />{h.close}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
