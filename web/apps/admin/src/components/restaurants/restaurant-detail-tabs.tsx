'use client';

import { lazy, Suspense, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ShoppingBag, Star, Store, TrendingUp, Utensils } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const RestaurantOverviewTab = lazy(() => import('./restaurant-overview-tab'));
const RestaurantMenuTab = lazy(() => import('./restaurant-menu-tab'));
const RestaurantOrdersTab = lazy(() => import('./restaurant-orders-tab'));
const RestaurantReviewsTab = lazy(() => import('./restaurant-reviews-tab'));
const RestaurantFinanceTab = lazy(() => import('./restaurant-finance-tab'));

function TabFallback() {
  return <Skeleton className="h-64 w-full rounded-lg" />;
}

interface RestaurantDetailTabsProps {
  restaurant: {
    id: string;
    name: string;
    address: string;
    cuisine: string;
    rating: number;
    totalOrders: number;
    revenue: number;
    status: string;
    description: string;
    owner: { name: string; email: string; phone: string };
    hours?: { open: string; close: string }[];
    phone?: string;
  };
}

const tabTriggerClassName =
  'gap-1.5 whitespace-nowrap rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent';

export default function RestaurantDetailTabs({ restaurant }: RestaurantDetailTabsProps) {
  const t = useTranslations('restaurantTabs');
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList
        aria-label={t('label')}
        className="w-full justify-start gap-0 overflow-x-auto border-b bg-transparent p-0"
      >
        <TabsTrigger value="overview" className={tabTriggerClassName}>
          <Store className="h-4 w-4" aria-hidden="true" />
          {t('overview')}
        </TabsTrigger>
        <TabsTrigger value="menu" className={tabTriggerClassName}>
          <Utensils className="h-4 w-4" aria-hidden="true" />
          {t('menu')}
        </TabsTrigger>
        <TabsTrigger value="orders" className={tabTriggerClassName}>
          <ShoppingBag className="h-4 w-4" aria-hidden="true" />
          {t('orders')}
        </TabsTrigger>
        <TabsTrigger value="reviews" className={tabTriggerClassName}>
          <Star className="h-4 w-4" aria-hidden="true" />
          {t('reviews')}
        </TabsTrigger>
        <TabsTrigger value="finance" className={tabTriggerClassName}>
          <TrendingUp className="h-4 w-4" aria-hidden="true" />
          {t('finance')}
        </TabsTrigger>
      </TabsList>

      <div className="pt-4">
        <Suspense fallback={<TabFallback />}>
          {activeTab === 'overview' && <RestaurantOverviewTab restaurant={restaurant} />}
        </Suspense>
        <Suspense fallback={<TabFallback />}>
          {activeTab === 'menu' && <RestaurantMenuTab restaurantId={restaurant.id} />}
        </Suspense>
        <Suspense fallback={<TabFallback />}>
          {activeTab === 'orders' && <RestaurantOrdersTab restaurantId={restaurant.id} />}
        </Suspense>
        <Suspense fallback={<TabFallback />}>
          {activeTab === 'reviews' && <RestaurantReviewsTab restaurantId={restaurant.id} />}
        </Suspense>
        <Suspense fallback={<TabFallback />}>
          {activeTab === 'finance' && <RestaurantFinanceTab restaurantId={restaurant.id} />}
        </Suspense>
      </div>
    </Tabs>
  );
}
