'use client';

import { useState } from 'react';
import type { StaffRole } from '@/lib/types';
import { Mail, ShieldCheck, Send } from 'lucide-react';

interface InviteStaffDialogProps {
  open: boolean;
  onClose: () => void;
  onSend: (emails: string[], role: StaffRole) => Promise<void>;
}

const ROLES: { value: StaffRole; label: string }[] = [
  { value: 'manager', label: 'Quản lý' },
  { value: 'kitchen', label: 'Bếp' },
  { value: 'cashier', label: 'Thu ngân' },
  { value: 'viewer', label: 'Chỉ xem' },
];

export function InviteStaffDialog({ open, onClose, onSend }: InviteStaffDialogProps) {
  const [emailInput, setEmailInput] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [role, setRole] = useState<StaffRole>('viewer');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const addEmail = () => {
    const trimmed = emailInput.trim().toLowerCase();
    if (!trimmed) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Email không hợp lệ');
      return;
    }
    if (emails.includes(trimmed)) {
      setError('Email đã được thêm');
      return;
    }
    setEmails([...emails, trimmed]);
    setEmailInput('');
    setError('');
  };

  const handleSend = async () => {
    if (emails.length === 0) {
      setError('Vui lòng thêm ít nhất 1 email');
      return;
    }
    setSending(true);
    try {
      await onSend(emails, role);
      setEmails([]);
      setEmailInput('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gửi thất bại');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" data-testid="invite-staff-dialog">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
            <Mail className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Mời nhân viên</h2>
            <p className="text-xs text-gray-500">Gửi lời mời qua email</p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 mb-4">{error}</div>
        )}

        <div className="space-y-4">
          <div>
            <label className="label">Email</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={emailInput}
                onChange={(event) => setEmailInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addEmail();
                  }
                }}
                placeholder="nhanvien@nhahang.vn"
                className="input-field flex-1"
              />
              <button type="button" onClick={addEmail} className="btn-secondary text-sm">Thêm</button>
            </div>
            {emails.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {emails.map((email) => (
                  <span key={email} className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-0.5 text-xs text-brand-700">
                    {email}
                    <button type="button" onClick={() => setEmails(emails.filter((item) => item !== email))} className="hover:text-red-500">&times;</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="label flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              Vai trò
            </label>
            <select value={role} onChange={(event) => setRole(event.target.value as StaffRole)} className="select-field">
              {ROLES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button type="button" onClick={onClose} className="btn-ghost text-sm">Huỷ</button>
          <button type="button" onClick={handleSend} disabled={sending || emails.length === 0} className="btn-primary text-sm disabled:opacity-50">
            <Send className="h-4 w-4 mr-1" />
            {sending ? 'Đang gửi...' : 'Gửi lời mời'}
          </button>
        </div>
      </div>
    </div>
  );
}
