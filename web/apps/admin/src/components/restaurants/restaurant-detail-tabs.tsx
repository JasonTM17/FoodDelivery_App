'use client';

import { useState, lazy, Suspense } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Store, Utensils, ShoppingBag, Star, TrendingUp } from 'lucide-react';

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

export default function RestaurantDetailTabs({ restaurant }: RestaurantDetailTabsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="w-full justify-start gap-0 border-b bg-transparent p-0">
        <TabsTrigger
          value="overview"
          className="gap-1.5 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
        >
          <Store className="h-4 w-4" />
          Tổng quan
        </TabsTrigger>
        <TabsTrigger
          value="menu"
          className="gap-1.5 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
        >
          <Utensils className="h-4 w-4" />
          Menu
        </TabsTrigger>
        <TabsTrigger
          value="orders"
          className="gap-1.5 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
        >
          <ShoppingBag className="h-4 w-4" />
          Đơn hàng
        </TabsTrigger>
        <TabsTrigger
          value="reviews"
          className="gap-1.5 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
        >
          <Star className="h-4 w-4" />
          Đánh giá
        </TabsTrigger>
        <TabsTrigger
          value="finance"
          className="gap-1.5 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
        >
          <TrendingUp className="h-4 w-4" />
          Tài chính
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
