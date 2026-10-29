'use client';

import Link from 'next/link';
import { Badge, cn } from '@foodflow/ui';
import { Star } from 'lucide-react';
import { formatDistance } from '@/lib/format';
import { useLanguage } from '@/lib/language-context';
import type { CardRestaurant } from '@/lib/types';

export function RestaurantCard({
  restaurant,
  distanceKm,
  className,
}: {
  restaurant: CardRestaurant;
  distanceKm?: number | null;
  className?: string;
}) {
  const { t } = useLanguage();
  const closed = !restaurant.isOpen;
  return (
    <Link
      href={`/restaurants/${restaurant.id}`}
      className={cn(
        'group flex gap-3 rounded-xl border bg-white p-3 shadow-xs transition-shadow hover:shadow-md',
        closed && 'opacity-70',
        className,
      )}
    >
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-orange-100">
        {restaurant.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={restaurant.imageUrl}
            alt=""
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl font-bold text-primary/40">
            {restaurant.name.slice(0, 1)}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-semibold text-gray-900">{restaurant.name}</h3>
          {restaurant.rating != null && (
            <span className="flex shrink-0 items-center gap-1 text-sm text-gray-700">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
              {restaurant.rating.toFixed(1)}
            </span>
          )}
        </div>
        <p className="truncate text-sm text-muted-foreground">
          {[
            restaurant.cuisineTypes.map((c) => t(`cuisine.${c}`) || c).slice(0, 2).join(', '),
            restaurant.district ?? restaurant.addressLine,
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Badge variant={closed ? 'secondary' : 'success'}>
            {closed ? t('home.closed') : t('home.open')}
          </Badge>
          {restaurant.prepTimeAvgMinutes != null && (
            <span className="text-xs text-muted-foreground">
              ~{restaurant.prepTimeAvgMinutes} {t('home.mins')}
            </span>
          )}
          {distanceKm != null && (
            <span className="text-xs text-muted-foreground">{formatDistance(distanceKm)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
