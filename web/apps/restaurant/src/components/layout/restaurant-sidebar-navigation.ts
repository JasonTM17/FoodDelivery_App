import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Bell,
  Clock,
  LayoutDashboard,
  Settings,
  ShoppingBag,
  Star,
  Tag,
  TrendingUp,
  UserCircle,
  Users,
  UtensilsCrossed,
} from 'lucide-react';

export interface RestaurantNavItem {
  href: string;
  tKey: string;
  icon: LucideIcon;
  exact?: boolean;
}

export const NAV_ITEMS: RestaurantNavItem[] = [
  { href: '/', tKey: 'nav.overview', icon: LayoutDashboard, exact: true },
  { href: '/orders', tKey: 'nav.orders', icon: ShoppingBag },
  { href: '/menu', tKey: 'nav.menu', icon: UtensilsCrossed },
  { href: '/promotions', tKey: 'nav.promotions', icon: Tag },
  { href: '/analytics', tKey: 'nav.analytics', icon: TrendingUp },
  { href: '/insights', tKey: 'nav.insights', icon: TrendingUp },
  { href: '/staff', tKey: 'nav.staff', icon: Users },
  { href: '/revenue', tKey: 'nav.revenue', icon: BarChart3 },
  { href: '/reviews', tKey: 'nav.reviews', icon: Star },
  { href: '/notifications', tKey: 'nav.notifications', icon: Bell },
];

export const SETTINGS_ITEMS: RestaurantNavItem[] = [
  { href: '/settings', tKey: 'sidebar.settingsGeneral', icon: Settings, exact: true },
  { href: '/settings/profile', tKey: 'sidebar.settingsProfile', icon: UserCircle },
  { href: '/settings/hours', tKey: 'sidebar.settingsHours', icon: Clock },
];
