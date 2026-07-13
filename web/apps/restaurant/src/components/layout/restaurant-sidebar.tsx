'use client';

import type { Ref } from 'react';
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FoodFlowLogo } from '@foodflow/ui/foodflow-logo';
import { Link, usePathname } from '@/navigation';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { useAuth } from '@/lib/auth-provider';
import { getStoredRestaurant } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  NAV_ITEMS,
  SETTINGS_ITEMS,
  type RestaurantNavItem,
} from './restaurant-sidebar-navigation';

interface RestaurantSidebarProps {
  collapsed?: boolean;
  className?: string;
  initialFocusRef?: Ref<HTMLAnchorElement>;
  onCollapsedChange?: (collapsed: boolean) => void;
  onNavigate?: () => void;
  showCollapseToggle?: boolean;
}

export function RestaurantSidebar({
  collapsed = false,
  className,
  initialFocusRef,
  onCollapsedChange,
  onNavigate,
  showCollapseToggle = true,
}: RestaurantSidebarProps) {
  const rawPathname = usePathname();
  const pathname = rawPathname.replace(/^\/(vi|en|ja)/, '') || '/';
  const { logout } = useAuth();
  const t = useTranslations();
  const restaurant = getStoredRestaurant();

  const isActive = (item: RestaurantNavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const initialFocusHref =
    [...NAV_ITEMS, ...SETTINGS_ITEMS].find(isActive)?.href ?? NAV_ITEMS[0]?.href;

  const renderNavigationItem = (item: RestaurantNavItem) => {
    const itemIsActive = isActive(item);
    const label = t(item.tKey);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        // The active destination is the least surprising first focus target
        // when reopening the mobile navigation. Keep Overview as the fallback.
        ref={item.href === initialFocusHref ? initialFocusRef : undefined}
        href={item.href}
        prefetch={false}
        onClick={onNavigate}
        aria-current={itemIsActive ? 'page' : undefined}
        aria-label={collapsed ? label : undefined}
        title={collapsed ? label : undefined}
        className={cn(
          'flex min-h-11 touch-manipulation items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar motion-reduce:transition-none',
          itemIsActive
            ? 'bg-sidebar-active text-white'
            : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground',
          collapsed && 'justify-center px-2',
        )}
      >
        <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
        {!collapsed && <span className="min-w-0 truncate">{label}</span>}
      </Link>
    );
  };

  const handleLogout = () => {
    onNavigate?.();
    logout();
  };

  return (
    <aside
      className={cn(
        'flex h-full min-h-0 w-[260px] flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out motion-reduce:transition-none',
        collapsed && 'w-16',
        className,
      )}
    >
      <div
        className={cn(
          'flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-hover px-4',
          collapsed && 'justify-center px-2',
        )}
      >
        <FoodFlowLogo
          label={t('sidebar.brand')}
          showWordmark={false}
          markClassName="h-9 w-9"
          className="shrink-0"
        />
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {restaurant?.name || t('sidebar.defaultName')}
            </p>
            <p className="truncate text-xs text-sidebar-muted">{t('sidebar.manage')}</p>
          </div>
        )}
      </div>

      <nav
        aria-label={t('sidebar.navigation')}
        className="flex-1 space-y-1 overflow-y-auto overscroll-contain p-3 scrollbar-thin"
      >
        {NAV_ITEMS.map(renderNavigationItem)}

        <div className="mt-1 border-t border-sidebar-hover pt-2">
          {!collapsed && (
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-sidebar-muted">
              {t('sidebar.settingsGroup')}
            </p>
          )}
          {SETTINGS_ITEMS.map((item) => renderNavigationItem(item))}
        </div>
      </nav>

      {showCollapseToggle && (
        <div className="border-t border-sidebar-hover p-3">
          <button
            type="button"
            onClick={() => onCollapsedChange?.(!collapsed)}
            aria-label={t(collapsed ? 'sidebar.expand' : 'sidebar.collapse')}
            aria-pressed={collapsed}
            title={t(collapsed ? 'sidebar.expand' : 'sidebar.collapse')}
            className={cn(
              'flex min-h-11 w-full touch-manipulation items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-muted transition-colors duration-200 hover:bg-sidebar-hover hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar motion-reduce:transition-none',
              collapsed && 'justify-center px-2',
            )}
          >
            {collapsed ? (
              <ChevronRight aria-hidden="true" className="h-5 w-5" />
            ) : (
              <>
                <ChevronLeft aria-hidden="true" className="h-5 w-5 shrink-0" />
                <span>{t('sidebar.collapse')}</span>
              </>
            )}
          </button>
        </div>
      )}

      <div className="border-t border-sidebar-hover px-3 py-2">
        <LocaleSwitcher collapsed={collapsed} onNavigate={onNavigate} />
      </div>

      <div className="border-t border-sidebar-hover p-3">
        <button
          type="button"
          onClick={handleLogout}
          aria-label={collapsed ? t('common.logout') : undefined}
          title={collapsed ? t('common.logout') : undefined}
          className={cn(
            'flex min-h-11 w-full touch-manipulation items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-muted transition-colors duration-200 hover:bg-red-600/20 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar motion-reduce:transition-none',
            collapsed && 'justify-center px-2',
          )}
        >
          <LogOut aria-hidden="true" className="h-5 w-5 shrink-0" />
          {!collapsed && <span>{t('common.logout')}</span>}
        </button>
      </div>
    </aside>
  );
}
