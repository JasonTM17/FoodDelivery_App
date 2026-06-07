'use client';

import { useState } from 'react';
import { Star, MessageSquare, Filter, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface Review {
  id: string;
  customerName: string;
  customerInitial: string;
  rating: number;
  comment: string;
  reply: string | null;
  createdAt: string;
  orderId: string;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            'h-3.5 w-3.5',
            s <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'
          )}
        />
      ))}
    </div>
  );
}

const MOCK_REVIEWS: Review[] = [
  { id: '1', customerName: 'Nguyễn Văn A', customerInitial: 'A', rating: 5, comment: 'Món ăn rất ngon, giao hàng nhanh!', reply: null, createdAt: '2024-01-15T10:30:00Z', orderId: 'ORD-001' },
  { id: '2', customerName: 'Trần Thị B', customerInitial: 'B', rating: 4, comment: 'Đồ ăn ngon, tuy nhiên cần cải thiện đóng gói.', reply: 'Cảm ơn bạn đã góp ý! Chúng tôi sẽ cải thiện ngay.', createdAt: '2024-01-14T14:20:00Z', orderId: 'ORD-002' },
  { id: '3', customerName: 'Lê Văn C', customerInitial: 'C', rating: 3, comment: 'Bình thường, không có gì đặc biệt.', reply: null, createdAt: '2024-01-13T09:15:00Z', orderId: 'ORD-003' },
  { id: '4', customerName: 'Phạm Thị D', customerInitial: 'D', rating: 5, comment: 'Xuất sắc! Sẽ tiếp tục ủng hộ.', reply: null, createdAt: '2024-01-12T18:45:00Z', orderId: 'ORD-004' },
  { id: '5', customerName: 'Hoàng Văn E', customerInitial: 'E', rating: 2, comment: 'Giao hàng chậm, đồ ăn nguội.', reply: null, createdAt: '2024-01-11T12:00:00Z', orderId: 'ORD-005' },
];

export function ReviewsDashboard() {
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [commentOnly, setCommentOnly] = useState(false);

  const totalReviews = reviews.length;
  const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / totalReviews;
  const fiveStarPct = Math.round((reviews.filter((r) => r.rating === 5).length / totalReviews) * 100);
  const responseRate = Math.round((reviews.filter((r) => r.reply).length / totalReviews) * 100);

  const filtered = reviews.filter((r) => {
    if (ratingFilter !== null && r.rating !== ratingFilter) return false;
    if (commentOnly && !r.comment) return false;
    return true;
  });

  const handleReply = async (reviewId: string) => {
    const text = replyTexts[reviewId];
    if (!text?.trim()) return;
    setSubmitting(reviewId);
    try {
      await api.post(`/restaurants/reviews/${reviewId}/reply`, { reply: text });
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, reply: text } : r)));
      setReplyTexts((prev) => { const n = { ...prev }; delete n[reviewId]; return n; });
    } catch {
      // keep draft on error
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
          <Star className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Đánh giá khách hàng</h1>
          <p className="text-sm text-gray-500">Quản lý và phản hồi đánh giá</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="kpi-card">
          <p className="text-xs text-gray-500 mb-1">Đánh giá trung bình</p>
          <div className="flex items-end gap-1.5">
            <span className="text-2xl font-bold text-gray-900">{avgRating.toFixed(1)}</span>
            <Star className="h-5 w-5 text-amber-400 fill-amber-400 mb-0.5" />
          </div>
        </div>
        <div className="kpi-card">
          <p className="text-xs text-gray-500 mb-1">Tổng đánh giá</p>
          <span className="text-2xl font-bold text-gray-900">{totalReviews}</span>
        </div>
        <div className="kpi-card">
          <p className="text-xs text-gray-500 mb-1">Tỷ lệ 5 sao</p>
          <span className="text-2xl font-bold text-gray-900">{fiveStarPct}%</span>
        </div>
        <div className="kpi-card">
          <p className="text-xs text-gray-500 mb-1">Tỷ lệ phản hồi</p>
          <span className="text-2xl font-bold text-gray-900">{responseRate}%</span>
        </div>
      </div>

      <div className="card mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Lọc:</span>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setRatingFilter(null)}
              className={cn('px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                ratingFilter === null ? 'bg-brand-500 text-white border-brand-500' : 'border-gray-300 text-gray-600 hover:bg-gray-50')}
            >
              Tất cả
            </button>
            {[5, 4, 3, 2, 1].map((star) => (
              <button
                key={star}
                onClick={() => setRatingFilter(ratingFilter === star ? null : star)}
                className={cn('flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                  ratingFilter === star ? 'bg-brand-500 text-white border-brand-500' : 'border-gray-300 text-gray-600 hover:bg-gray-50')}
              >
                {star}<Star className="h-3 w-3 fill-current" />
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer ml-auto">
            <input type="checkbox" checked={commentOnly} onChange={(e) => setCommentOnly(e.target.checked)} className="rounded border-gray-300" />
            Chỉ có bình luận
          </label>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="card text-center py-12">
            <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Chưa có đánh giá nào</p>
          </div>
        )}
        {filtered.map((review) => (
          <div key={review.id} className="card space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-brand-100 flex items-center justify-center text-sm font-semibold text-brand-600 shrink-0">
                  {review.customerInitial}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{review.customerName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StarDisplay rating={review.rating} />
                    <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              </div>
              <span className="badge border-gray-200 text-gray-500">#{review.orderId}</span>
            </div>
            {review.comment && <p className="text-sm text-gray-700">{review.comment}</p>}
            {review.reply ? (
              <div className="rounded-lg bg-brand-50 border border-brand-100 p-3">
                <p className="text-xs font-medium text-brand-600 mb-1">Phản hồi của nhà hàng</p>
                <p className="text-sm text-gray-700">{review.reply}</p>
              </div>
            ) : (
              <div className="flex gap-2">
                <textarea
                  rows={2}
                  value={replyTexts[review.id] || ''}
                  onChange={(e) => setReplyTexts((prev) => ({ ...prev, [review.id]: e.target.value }))}
                  placeholder="Viết phản hồi..."
                  className="input-field resize-none flex-1 text-sm"
                />
                <button
                  onClick={() => handleReply(review.id)}
                  disabled={!replyTexts[review.id]?.trim() || submitting === review.id}
                  className="btn-primary self-end"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
