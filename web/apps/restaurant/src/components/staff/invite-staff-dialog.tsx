'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Mail, Send, ShieldCheck } from 'lucide-react';
import type { StaffRole } from '@/lib/types';

interface InviteStaffDialogProps {
  open: boolean;
  onClose: () => void;
  onSend: (emails: string[], role: StaffRole) => Promise<void>;
}

const roles: StaffRole[] = ['manager', 'kitchen', 'cashier', 'viewer'];

export function InviteStaffDialog({ open, onClose, onSend }: InviteStaffDialogProps) {
  const t = useTranslations('staff');
  const [emailInput, setEmailInput] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [role, setRole] = useState<StaffRole>('viewer');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    emailInputRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !sending) {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [onClose, open, sending]);

  if (!open) return null;

  const addEmail = () => {
    const trimmed = emailInput.trim().toLowerCase();
    if (!trimmed) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError(t('invite.invalidEmail'));
      return;
    }
    if (emails.includes(trimmed)) {
      setError(t('invite.duplicateEmail'));
      return;
    }
    setEmails([...emails, trimmed]);
    setEmailInput('');
    setError('');
  };

  const handleSend = async () => {
    if (emails.length === 0) {
      setError(t('invite.emptyEmail'));
      return;
    }
    setSending(true);
    try {
      await onSend(emails, role);
      setEmails([]);
      setEmailInput('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('invite.sendError'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" data-testid="invite-staff-dialog">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
            <Mail className="h-5 w-5 text-brand-600" aria-hidden="true" />
          </div>
          <div>
            <h2 id={titleId} className="text-lg font-bold text-gray-900">{t('invite.title')}</h2>
            <p className="text-xs text-gray-500">{t('invite.description')}</p>
          </div>
        </div>

        {error ? <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

        <div className="space-y-4">
          <div>
            <label className="label">{t('invite.email')}</label>
            <div className="flex gap-2">
              <input
                ref={emailInputRef}
                type="email"
                value={emailInput}
                onChange={event => setEmailInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addEmail();
                  }
                }}
                placeholder={t('invite.emailPlaceholder')}
                className="input-field flex-1"
              />
              <button type="button" onClick={addEmail} className="btn-secondary text-sm">{t('invite.add')}</button>
            </div>
            {emails.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {emails.map(email => (
                  <span key={email} className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-0.5 text-xs text-brand-700">
                    {email}
                    <button type="button" onClick={() => setEmails(emails.filter(item => item !== email))} className="hover:text-red-500" aria-label={t('invite.removeEmail', { email })}>
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <label className="label flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {t('table.columns.role')}
            </label>
            <select value={role} onChange={event => setRole(event.target.value as StaffRole)} className="select-field">
              {roles.map(item => <option key={item} value={item}>{t(`roles.${item}`)}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
          <button type="button" onClick={onClose} className="btn-ghost text-sm">{t('invite.cancel')}</button>
          <button type="button" onClick={handleSend} disabled={sending || emails.length === 0} className="btn-primary text-sm disabled:opacity-50">
            <Send className="mr-1 h-4 w-4" aria-hidden="true" />
            {sending ? t('invite.sending') : t('invite.send')}
          </button>
        </div>
      </div>
    </div>
  );
}
