'use client';

import { useState } from 'react';
import { MessageSquareReply } from 'lucide-react';

interface ReviewReplyModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reply: string) => Promise<void>;
}

export function ReviewReplyModal({ open, onClose, onSubmit }: ReviewReplyModalProps) {
  const [reply, setReply] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async () => {
    if (!reply.trim()) { setError('Vui lòng nhập nội dung phản hồi'); return; }
    if (reply.length > 500) { setError('Phản hồi tối đa 500 ký tự'); return; }
    setSubmitting(true);
    try {
      await onSubmit(reply.trim());
      onClose();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Gửi phản hồi thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" data-testid="review-reply-modal">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
            <MessageSquareReply className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Phản hồi đánh giá</h2>
            <p className="text-xs text-gray-500">Phản hồi của bạn sẽ hiển thị công khai</p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 mb-4">{error}</div>
        )}

        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={5}
          className="input-field resize-none"
          placeholder="Nhập phản hồi của bạn..."
          maxLength={500}
        />
        <p className={reply.length > 450 ? 'text-red-500' : 'text-gray-400'}>
          {reply.length}/500
        </p>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
          <button type="button" onClick={onClose} className="btn-ghost text-sm">Huỷ</button>
          <button type="button" onClick={handleSubmit} disabled={submitting} className="btn-primary text-sm disabled:opacity-50">
            {submitting ? 'Đang gửi...' : 'Gửi phản hồi'}
          </button>
        </div>
      </div>
    </div>
  );
}
