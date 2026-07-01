'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TicketCsatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (score: number, comment: string) => Promise<void>;
}

const starLabels = ['Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Tuyệt vời'];

export default function TicketCsatModal({ open, onOpenChange, onSubmit }: TicketCsatModalProps) {
  const [score, setScore] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async () => {
    if (score === 0) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await onSubmit(score, comment);
      setScore(0);
      setComment('');
      onOpenChange(false);
    } catch (err) {
      setSubmitError((err as { message?: string }).message || 'Không thể gửi đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Đánh giá trải nghiệm hỗ trợ</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex items-center gap-1" data-testid="csat-stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setScore(star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    'h-8 w-8',
                    (hoveredStar || score) >= star
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground/30'
                  )}
                />
              </button>
            ))}
          </div>
          {score > 0 && (
            <p className="text-sm font-medium text-muted-foreground">
              {starLabels[score - 1]}
            </p>
          )}

          <div className="w-full space-y-2">
            <Label htmlFor="csat-comment">Nhận xét thêm (không bắt buộc)</Label>
            <Textarea
              id="csat-comment"
              placeholder="Chia sẻ thêm về trải nghiệm của bạn..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {submitError && <p className="text-sm text-destructive">{submitError}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Để sau
          </Button>
          <Button onClick={handleSubmit} disabled={score === 0 || submitting}>
            {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
