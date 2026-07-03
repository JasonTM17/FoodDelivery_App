'use client';

import { RestaurantDetailHeader } from './restaurant-detail-header';
import { RestaurantMainCards } from './restaurant-detail-main-cards';
import { RestaurantDetailSidebar } from './restaurant-detail-sidebar';
import type { Restaurant } from './restaurant-detail-types';

export function RestaurantDetailContent({
  restaurant,
  onToggleStatus,
}: {
  restaurant: Restaurant;
  onToggleStatus: () => void;
}) {
  return (
    <div className="space-y-6">
      <RestaurantDetailHeader restaurant={restaurant} onToggleStatus={onToggleStatus} />
      <div className="grid gap-6 lg:grid-cols-3">
        <RestaurantMainCards restaurant={restaurant} />
        <RestaurantDetailSidebar restaurant={restaurant} />
      </div>
    </div>
  );
}
