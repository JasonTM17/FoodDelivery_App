'use client';

import { usePathname } from '@/navigation';
import { Menu } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { useAuth } from '@/lib/auth-provider';

const breadcrumbKeys: Record<string, string> = {
  overview: 'overview',
  orders: 'orders',
  restaurants: 'restaurants',
  users: 'users',
  drivers: 'drivers',
  map: 'map',
  promotions: 'promotions',
  support: 'support',
  analytics: 'analytics',
  reports: 'reports',
  'export-jobs': 'exportJobs',
  settings: 'settings',
  logs: 'logs',
  'ai-monitor': 'aiMonitor',
};

interface AdminTopbarProps {
  onOpenNavigation: () => void;
}

function getCurrentBreadcrumbKey(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const section = [...segments].reverse().find((segment) => breadcrumbKeys[segment]);
  return section ? breadcrumbKeys[section] : 'overview';
}

export default function AdminTopbar({ onOpenNavigation }: AdminTopbarProps) {
  const pathname = usePathname();
  const [adminName, setAdminName] = useState('Admin');
  const t = useTranslations();
  const { logout } = useAuth();

  useEffect(() => {
    const stored = localStorage.getItem('admin_user');
    if (stored) {
      try {
        const user = JSON.parse(stored) as { name?: string; fullName?: string; email?: string };
        setAdminName(user.name || user.fullName || user.email || 'Admin');
      } catch {
        setAdminName('Admin');
      }
    }
  }, []);

  const initials = adminName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const currentBreadcrumbKey = getCurrentBreadcrumbKey(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 min-w-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:gap-4 sm:px-4 lg:px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0 lg:hidden"
        aria-label={t('topbar.openNavigation')}
        onClick={onOpenNavigation}
      >
        <Menu aria-hidden="true" className="h-5 w-5" />
      </Button>

      <p className="min-w-0 truncate text-sm font-medium text-foreground sm:text-base">
        {t(`breadcrumb.${currentBreadcrumbKey}`)}
      </p>

      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        <LocaleSwitcher />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full"
              aria-label={t('topbar.accountMenu')}
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src="" alt={adminName} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{adminName}</p>
                <p className="text-xs leading-none text-muted-foreground">{t('topbar.adminRole')}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              {t('common.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
