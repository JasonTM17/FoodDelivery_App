'use client';

import { Star, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewFiltersProps {
  selectedRating: number | null;
  onRatingChange: (rating: number | null) => void;
  sortBy: 'newest' | 'oldest' | 'lowest';
  onSortChange: (sort: 'newest' | 'oldest' | 'lowest') => void;
}

export function ReviewFilters({ selectedRating, onRatingChange, sortBy, onSortChange }: ReviewFiltersProps) {
  return (
    <div className="space-y-3" data-testid="review-filters">
      {/* Rating filter */}
      <div className="flex items-center gap-1 flex-wrap">
        {[null, 5, 4, 3, 2, 1].map((rating) => (
          <button
            key={rating ?? 'all'}
            type="button"
            onClick={() => onRatingChange(rating)}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition-colors',
              selectedRating === rating
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-gray-200 text-gray-600 hover:border-brand-300'
            )}
          >
            {rating === null ? (
              'Tất cả'
            ) : (
              <>
                {rating}
                <Star className={cn('h-3 w-3', rating > (selectedRating || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-300')} />
              </>
            )}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Sắp xếp:</span>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as 'newest' | 'oldest' | 'lowest')}
          className="text-xs border rounded-lg px-2 py-1"
        >
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
          <option value="lowest">Thấp nhất</option>
        </select>
      </div>
    </div>
  );
}
