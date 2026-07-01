'use client';

import { Star } from 'lucide-react';

interface RatingDistributionProps {
  distribution: { five: number; four: number; three: number; two: number; one: number };
  total: number;
  average: number;
}

export function RatingDistribution({ distribution, total, average }: RatingDistributionProps) {
  const bars = [
    { label: '5 sao', count: distribution.five, stars: 5 },
    { label: '4 sao', count: distribution.four, stars: 4 },
    { label: '3 sao', count: distribution.three, stars: 3 },
    { label: '2 sao', count: distribution.two, stars: 2 },
    { label: '1 sao', count: distribution.one, stars: 1 },
  ];

  return (
    <div className="card" data-testid="rating-distribution">
      <div className="flex items-center gap-6">
        {/* Average */}
        <div className="text-center shrink-0">
          <p className="text-4xl font-bold text-gray-900">{average.toFixed(1)}</p>
          <div className="flex justify-center mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${star <= Math.round(average) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
              />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">{total} đánh giá</p>
        </div>

        {/* Bars */}
        <div className="flex-1 space-y-1.5">
          {bars.map((bar) => (
            <div key={bar.stars} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-10">{bar.label}</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all"
                  style={{ width: `${total > 0 ? (bar.count / total) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 w-8 text-right">{bar.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
