'use client';

import { Link, usePathname } from '@/navigation';
import { useTranslations } from 'next-intl';
import type { Ref } from 'react';
import { FoodFlowLogo } from '@foodflow/ui/foodflow-logo';
import {
  BarChart3,
  Bot,
  Car,
  Download,
  FileBarChart,
  HeadphonesIcon,
  LayoutDashboard,
  LogOut,
  Percent,
  ShoppingBag,
  Store,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-provider';
import { cn } from '@/lib/utils';

interface NavItem {
  tKey: string;
  href: string;
  icon: LucideIcon;
}

interface AdminSidebarProps {
  className?: string;
  initialFocusRef?: Ref<HTMLAnchorElement>;
  onNavigate?: () => void;
}

const navItems: NavItem[] = [
  { tKey: 'nav.overview', href: '/overview', icon: LayoutDashboard },
  { tKey: 'nav.orders', href: '/orders', icon: ShoppingBag },
  { tKey: 'nav.restaurants', href: '/restaurants', icon: Store },
  { tKey: 'nav.users', href: '/users', icon: Users },
  { tKey: 'nav.drivers', href: '/drivers', icon: Car },
  { tKey: 'nav.promotions', href: '/promotions', icon: Percent },
  { tKey: 'nav.support', href: '/support', icon: HeadphonesIcon },
  { tKey: 'nav.analytics', href: '/analytics', icon: BarChart3 },
  { tKey: 'nav.reports', href: '/reports', icon: FileBarChart },
  { tKey: 'nav.exportJobs', href: '/export-jobs', icon: Download },
  { tKey: 'nav.aiMonitor', href: '/ai-monitor', icon: Bot },
];

export default function AdminSidebar({ className, initialFocusRef, onNavigate }: AdminSidebarProps) {
  const rawPathname = usePathname();
  const pathname = rawPathname.replace(/^\/(vi|en|ja)/, '') || '/';
  const t = useTranslations();
  const { logout } = useAuth();

  const handleLogout = () => {
    onNavigate?.();
    logout();
  };

  return (
    <aside className={cn('flex h-full w-64 flex-col bg-sidebar', className)}>
      <div className="flex h-16 shrink-0 items-center gap-2 border-b border-white/10 px-4">
        <FoodFlowLogo
          label={t('sidebar.brand')}
          className="min-w-0 flex-1"
          markClassName="h-9 w-9"
          wordmarkClassName="text-white"
        />
        <span className="ml-2 whitespace-nowrap rounded-full bg-white/15 px-1.5 py-0.5 text-[9px] font-semibold text-white ring-1 ring-white/25">
          {t('sidebar.adminBadge')}
        </span>
      </div>

      <nav aria-label={t('sidebar.navigation')} className="flex-1 space-y-1 overflow-y-auto overscroll-contain p-4">
        {navItems.map((item, index) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              ref={index === 0 ? initialFocusRef : undefined}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-active focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar',
                isActive
                  ? 'bg-sidebar-active/10 text-sidebar-active-foreground'
                  : 'text-sidebar-foreground hover:bg-white/5 hover:text-white',
              )}
            >
              <Icon aria-hidden="true" className={cn('h-5 w-5', isActive && 'text-sidebar-active')} />
              <span>{t(item.tKey)}</span>
              {isActive && <span aria-hidden="true" className="ml-auto h-2 w-2 rounded-full bg-sidebar-active" />}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
        >
          <LogOut aria-hidden="true" className="h-5 w-5" />
          {t('common.logout')}
        </button>
      </div>
    </aside>
  );
}
