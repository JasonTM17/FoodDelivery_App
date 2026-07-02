import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewStarDisplayProps {
  rating: number;
  ariaLabel?: string;
  className?: string;
}

export function ReviewStarDisplay({ rating, ariaLabel, className }: ReviewStarDisplayProps) {
  return (
    <div className={cn('flex gap-0.5', className)} role="img" aria-label={ariaLabel}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'h-3.5 w-3.5',
            star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'
          )}
        />
      ))}
    </div>
  );
}
