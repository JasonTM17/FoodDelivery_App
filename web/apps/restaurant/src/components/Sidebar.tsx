'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShoppingBag,
  UtensilsCrossed,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Store,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { clearToken, getStoredRestaurant } from '@/lib/api';

const NAV_ITEMS = [
  { href: '/orders', label: 'Đơn hàng', icon: ShoppingBag },
  { href: '/menu', label: 'Thực đơn', icon: UtensilsCrossed },
  { href: '/revenue', label: 'Doanh thu', icon: BarChart3 },
  { href: '/settings', label: 'Cài đặt', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const restaurant = getStoredRestaurant();

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
      <div className={cn('flex items-center gap-3 px-4 h-16 border-b border-sidebar-hover shrink-0', collapsed && 'justify-center px-2')}>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 shrink-0">
          <Store className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {restaurant?.name || 'Nhà hàng'}
            </p>
            <p className="truncate text-xs text-sidebar-muted">Quản lý</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-active text-white'
                  : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground',
                collapsed && 'justify-center px-2'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
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
              <span>Thu gọn</span>
            </>
          )}
        </button>
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
          {!collapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
}
