'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User, Shield, Save, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { cn, formatTimeAgo } from '@/lib/utils';

interface StaffDetail {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'chef' | 'cashier' | 'server';
  avatar: string;
  lastActive: string;
  status: 'active' | 'pending' | 'inactive';
  permissions: Record<string, boolean>;
}

const CAPABILITIES = [
  { key: 'orders', label: 'Đơn hàng', desc: 'Xem & quản lý đơn hàng' },
  { key: 'menu', label: 'Thực đơn', desc: 'Thêm, sửa, ẩn món' },
  { key: 'revenue', label: 'Doanh thu', desc: 'Xem báo cáo doanh thu' },
  { key: 'promotions', label: 'Khuyến mãi', desc: 'Tạo & quản lý khuyến mãi' },
  { key: 'staff', label: 'Nhân viên', desc: 'Mời & quản lý nhân viên' },
  { key: 'settings', label: 'Cài đặt', desc: 'Chỉnh sửa thông tin nhà hàng' },
];

const ROLE_DEFAULTS: Record<string, string[]> = {
  owner: ['orders', 'menu', 'revenue', 'promotions', 'staff', 'settings'],
  manager: ['orders', 'menu', 'revenue', 'promotions', 'staff', 'settings'],
  chef: ['orders', 'menu'],
  cashier: ['orders', 'revenue'],
  server: ['orders'],
};

const ROLE_LABELS: Record<string, string> = {
  owner: 'Chủ', manager: 'Quản lý', chef: 'Bếp trưởng', cashier: 'Thu ngân', server: 'Phục vụ',
};

export default function StaffDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [member, setMember] = useState<StaffDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [perms, setPerms] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      const data = await api.get<StaffDetail>(`/restaurant/staff/${id}`);
      setMember(data);
      setSelectedRole(data.role);
      setPerms(data.permissions);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Không tìm thấy nhân viên');
    } finally { setIsLoading(false); }
  };

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    const defaults: Record<string, boolean> = {};
    CAPABILITIES.forEach(c => { defaults[c.key] = (ROLE_DEFAULTS[role] || []).includes(c.key); });
    setPerms(defaults);
  };

  const togglePerm = (key: string) => {
    if (member?.role === 'owner') return;
    setPerms(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    try {
      await api.patch(`/restaurant/staff/${id}`, { role: selectedRole, permissions: perms });
      setSuccess('Đã lưu thay đổi');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Không thể lưu thay đổi');
    } finally { setIsSaving(false); }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-32 skeleton" />
        <div className="card h-24" />
        <div className="card h-64" />
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <span className="text-red-600 text-2xl font-bold">!</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy nhân viên</h2>
        <p className="text-sm text-gray-500 mb-6">{error}</p>
        <button onClick={() => router.push('/staff')} className="btn-primary">Quay lại</button>
      </div>
    );
  }

  const isOwner = member.role === 'owner';

  return (
    <div className="animate-fade-in-up">
      <button onClick={() => router.push('/staff')} className="btn-ghost mb-4 -ml-2">
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Quay lại danh sách
      </button>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 shrink-0 overflow-hidden">
          {member.avatar ? (
            <img src={member.avatar} alt={member.name} className="w-14 h-14 object-cover" />
          ) : (
            <span className="text-xl font-bold text-indigo-600">{member.name.charAt(0)}</span>
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{member.name}</h1>
          <p className="text-sm text-gray-500">{member.email}</p>
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
            <Clock className="h-3 w-3" />
            Hoạt động {formatTimeAgo(member.lastActive)}
          </p>
        </div>
      </div>

      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3 mb-4">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid gap-6">
        <div className="card">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-gray-400" />
            Vai trò
          </h3>
          <select
            value={selectedRole}
            onChange={e => handleRoleChange(e.target.value)}
            className="select-field max-w-xs"
            disabled={isOwner}
          >
            {Object.entries(ROLE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          {isOwner && <p className="text-xs text-gray-400 mt-1">Không thể thay đổi vai trò của Chủ nhà hàng</p>}
        </div>

        <div className="card">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-gray-400" />
            Quyền hạn
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CAPABILITIES.map(cap => (
              <label
                key={cap.key}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                  perms[cap.key] ? 'border-brand-200 bg-brand-50' : 'border-gray-200 hover:bg-gray-50',
                  isOwner && 'cursor-not-allowed opacity-60'
                )}
              >
                <input
                  type="checkbox"
                  checked={perms[cap.key] || false}
                  onChange={() => togglePerm(cap.key)}
                  disabled={isOwner}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">{cap.label}</p>
                  <p className="text-xs text-gray-500">{cap.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={handleSave} disabled={isSaving || isOwner} className="btn-primary">
            <Save className="h-4 w-4 mr-1.5" />
            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}
