'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, UserPlus, Search, MoreHorizontal, Mail, Shield,
  ChefHat, User, Store, HandCoins, Clock
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn, formatTimeAgo } from '@/lib/utils';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'chef' | 'cashier' | 'server';
  avatar: string;
  lastActive: string;
  status: 'active' | 'pending' | 'inactive';
}

const ROLE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  owner: { label: 'Chủ', icon: <Store className="h-3.5 w-3.5" />, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  manager: { label: 'Quản lý', icon: <Shield className="h-3.5 w-3.5" />, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  chef: { label: 'Bếp trưởng', icon: <ChefHat className="h-3.5 w-3.5" />, color: 'bg-orange-100 text-orange-700 border-orange-200' },
  cashier: { label: 'Thu ngân', icon: <HandCoins className="h-3.5 w-3.5" />, color: 'bg-green-100 text-green-700 border-green-200' },
  server: { label: 'Phục vụ', icon: <User className="h-3.5 w-3.5" />, color: 'bg-gray-100 text-gray-700 border-gray-200' },
};

export default function StaffPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('chef');
  const [inviteMulti, setInviteMulti] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  useEffect(() => { fetchStaff(); }, []);

  const fetchStaff = async () => {
    try {
      const data = await api.get<StaffMember[]>('/restaurant/staff');
      setStaff(data);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Không thể tải danh sách nhân viên');
    } finally { setIsLoading(false); }
  };

  const handleInvite = async () => {
    setInviteError('');
    setInviteSuccess('');
    const emails = inviteMulti
      ? inviteMulti.split(/[,\n]/).map(e => e.trim()).filter(Boolean)
      : [inviteEmail.trim()];
    if (emails.length === 0 || !emails[0]) {
      setInviteError('Vui lòng nhập ít nhất một email');
      return;
    }
    setIsInviting(true);
    try {
      await api.post('/restaurant/staff/invite', { emails, role: inviteRole });
      setInviteSuccess(`Đã gửi ${emails.length} lời mời`);
      setInviteEmail('');
      setInviteMulti('');
      setTimeout(() => { setShowInvite(false); setInviteSuccess(''); }, 2000);
      await fetchStaff();
    } catch (err: unknown) {
      setInviteError((err as { message?: string }).message || 'Không thể gửi lời mời');
    } finally { setIsInviting(false); }
  };

  const handleRemove = async (staffId: string, name: string) => {
    if (!confirm(`Xóa ${name} khỏi nhà hàng? Hành động này không thể hoàn tác.`)) return;
    try {
      await api.delete(`/restaurant/staff/${staffId}`);
      await fetchStaff();
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Không thể xóa nhân viên');
    }
  };

  const filtered = staff.filter(s => {
    if (roleFilter !== 'all' && s.role !== roleFilter) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-32 skeleton" />
        {[1, 2, 3, 4].map(i => <div key={i} className="h-16 skeleton rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
            <Users className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Nhân viên</h1>
            <p className="text-sm text-gray-500">{staff.length} thành viên</p>
          </div>
        </div>
        <button onClick={() => setShowInvite(true)} className="btn-primary">
          <UserPlus className="h-4 w-4 mr-1.5" />
          Mời nhân viên
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Invite dialog */}
      {showInvite && (
        <div className="card mb-6 border-brand-200 bg-brand-50">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Mail className="h-4 w-4 text-brand-600" />
            Mời nhân viên
          </h3>
          {inviteError && <p className="text-sm text-red-600 mb-3">{inviteError}</p>}
          {inviteSuccess && <p className="text-sm text-green-600 mb-3">{inviteSuccess}</p>}
          <div className="space-y-3">
            <div>
              <label className="label">Email (phân cách bằng dấu phẩy hoặc xuống dòng)</label>
              <textarea
                value={inviteMulti || inviteEmail}
                onChange={e => { setInviteMulti(e.target.value); setInviteEmail(''); }}
                className="input-field h-20 resize-none"
                placeholder="chef@nhahang.vn, cashier@nhahang.vn"
              />
            </div>
            <div>
              <label className="label">Vai trò</label>
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="select-field">
                <option value="manager">Quản lý</option>
                <option value="chef">Bếp trưởng</option>
                <option value="cashier">Thu ngân</option>
                <option value="server">Phục vụ</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={handleInvite} disabled={isInviting} className="btn-primary">
                {isInviting ? 'Đang gửi...' : 'Gửi lời mời'}
              </button>
              <button onClick={() => setShowInvite(false)} className="btn-ghost">Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="select-field w-40">
          <option value="all">Tất cả vai trò</option>
          <option value="owner">Chủ</option>
          <option value="manager">Quản lý</option>
          <option value="chef">Bếp trưởng</option>
          <option value="cashier">Thu ngân</option>
          <option value="server">Phục vụ</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 mx-auto mb-4">
            <Users className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">Chưa có nhân viên nào</h3>
          <p className="text-sm text-gray-500 mb-4">Mời nhân viên đầu tiên vào nhà hàng</p>
          <button onClick={() => setShowInvite(true)} className="btn-primary">
            <UserPlus className="h-4 w-4 mr-1.5" />
            Mời nhân viên
          </button>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {filtered.map(member => {
            const role = ROLE_CONFIG[member.role] || ROLE_CONFIG.server;
            return (
              <div key={member.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0 group">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 shrink-0 overflow-hidden">
                  {member.avatar ? (
                    <img src={member.avatar} alt={member.name} className="w-10 h-10 object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-indigo-600">{member.name.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{member.name}</span>
                    <span className={cn('badge', role.color)}>
                      {role.icon}
                      <span className="ml-1">{role.label}</span>
                    </span>
                    {member.status === 'pending' && (
                      <span className="badge bg-yellow-100 text-yellow-700 border-yellow-200">Đang chờ</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {member.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(member.lastActive)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => router.push(`/staff/${member.id}`)}
                    className="btn-ghost text-xs py-1 px-2"
                  >
                    Chi tiết
                  </button>
                  {member.role !== 'owner' && (
                    <button
                      onClick={() => handleRemove(member.id, member.name)}
                      className="btn-ghost text-xs py-1 px-2 text-red-600 hover:bg-red-50"
                    >
                      Xóa
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
