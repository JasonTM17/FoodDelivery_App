'use client';

import { Link, usePathname, useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import {
  ShoppingBag,
  UtensilsCrossed,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Star,
  Bell,
  UserCircle,
  Clock,
  Tag,
  TrendingUp,
  LayoutDashboard,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { FoodFlowLogo } from '@foodflow/ui/foodflow-logo';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { clearToken, getStoredRestaurant } from '@/lib/api';
import { LocaleSwitcher } from '@/components/locale-switcher';

interface NavItem {
  href: string;
  tKey: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface SettingsItem extends NavItem {
  exact: boolean;
}

const NAV_ITEMS: NavItem[] = [
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

const SETTINGS_ITEMS: SettingsItem[] = [
  { href: '/settings', tKey: 'sidebar.settingsGeneral', icon: Settings, exact: true },
  { href: '/settings/profile', tKey: 'sidebar.settingsProfile', icon: UserCircle, exact: false },
  { href: '/settings/hours', tKey: 'sidebar.settingsHours', icon: Clock, exact: false },
];

export function RestaurantSidebar() {
  const rawPathname = usePathname();
  // Strip locale prefix so active checks work for both /orders and /vi/orders
  const pathname = rawPathname.replace(/^\/(vi|en|ja)/, '') || '/';
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const t = useTranslations();
  const restaurant = getStoredRestaurant();

  const isSettingsActive = pathname.startsWith('/settings');

  const handleLogout = () => {
    clearToken();
    router.push('/login');
  };

  return (
    <aside
      className={cn(
        'flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 h-screen fixed left-0 top-0 z-40',
        collapsed ? 'w-16' : 'w-[260px]'
      )}
    >
      {/* Restaurant info */}
      <div
        className={cn(
          'flex items-center gap-3 px-4 h-16 border-b border-sidebar-hover shrink-0',
          collapsed && 'justify-center px-2'
        )}
      >
        <FoodFlowLogo showWordmark={false} markClassName="h-9 w-9" className="shrink-0" />
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {restaurant?.name || t('sidebar.defaultName')}
            </p>
            <p className="truncate text-xs text-sidebar-muted">{t('sidebar.manage')}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-active text-white'
                  : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground',
                collapsed && 'justify-center px-2'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{t(item.tKey)}</span>}
            </Link>
          );
        })}

        {/* Settings sub-navigation */}
        <div className="pt-2 mt-1 border-t border-sidebar-hover">
          {collapsed ? (
            <Link
              href="/settings"
              prefetch={false}
              className={cn(
                'flex items-center justify-center rounded-lg px-2 py-2.5 text-sm font-medium transition-colors',
                isSettingsActive
                  ? 'bg-sidebar-active text-white'
                  : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground'
              )}
            >
              <Settings className="h-5 w-5" />
            </Link>
          ) : (
            <>
              <p className="px-3 pb-1 text-xs font-semibold text-sidebar-muted uppercase tracking-wider">
                {t('sidebar.settingsGroup')}
              </p>
              {SETTINGS_ITEMS.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-sidebar-active text-white'
                        : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground'
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{t(item.tKey)}</span>
                  </Link>
                );
              })}
            </>
          )}
        </div>
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-sidebar-hover p-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5 mx-auto" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5 shrink-0" />
              <span>{t('sidebar.collapse')}</span>
            </>
          )}
        </button>
      </div>

      {/* Locale switcher */}
      <div className="border-t border-sidebar-hover px-3 py-2">
        <LocaleSwitcher collapsed={collapsed} />
      </div>

      {/* Logout */}
      <div className="border-t border-sidebar-hover p-3">
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-muted transition-colors hover:bg-red-600/20 hover:text-red-400 w-full',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>{t('common.logout')}</span>}
        </button>
      </div>
    </aside>
  );
}
