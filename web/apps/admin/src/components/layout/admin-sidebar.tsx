'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Store,
  Car,
  Percent,
  HeadphonesIcon,
  Bot,
  BarChart3,
  LogOut,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  tKey: string;
  href: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { tKey: 'nav.overview',    href: '/overview',   icon: LayoutDashboard },
  { tKey: 'nav.orders',      href: '/orders',      icon: ShoppingBag },
  { tKey: 'nav.restaurants', href: '/restaurants', icon: Store },
  { tKey: 'nav.users',       href: '/users',       icon: Users },
  { tKey: 'nav.drivers',     href: '/drivers',     icon: Car },
  { tKey: 'nav.promotions',  href: '/promotions',  icon: Percent },
  { tKey: 'nav.support',     href: '/support',     icon: HeadphonesIcon },
  { tKey: 'nav.analytics',   href: '/analytics',   icon: BarChart3 },
  { tKey: 'nav.aiMonitor',   href: '/ai-monitor',  icon: Bot },
];

export default function AdminSidebar() {
  const rawPathname = usePathname();
  // Strip locale prefix so active checks work for both /overview and /vi/overview
  const pathname = rawPathname.replace(/^\/(vi|en|ja)/, '') || '/';
  const t = useTranslations();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    window.location.href = '/login';
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-sidebar">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2 border-b border-white/10 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-active">
          <span className="text-sm font-bold text-white">FF</span>
        </div>
        <span className="text-lg font-semibold text-white">{t('sidebar.brand')}</span>
        <span className="ml-1 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">
          Admin
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-active/10 text-sidebar-active-foreground'
                  : 'text-sidebar-foreground hover:bg-white/5 hover:text-white'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive ? 'text-sidebar-active' : '')} />
              {t(item.tKey)}
              {isActive && (
                <div className="ml-auto h-2 w-2 rounded-full bg-sidebar-active" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-white/10 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-5 w-5" />
          {t('common.logout')}
        </button>
      </div>
    </aside>
  );
}
