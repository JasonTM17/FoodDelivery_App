'use client';

import { usePathname } from 'next/navigation';
import { Bell, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEffect, useState } from 'react';

const breadcrumbMap: Record<string, string> = {
  overview: 'Tổng quan',
  orders: 'Đơn hàng',
  restaurants: 'Nhà hàng',
  users: 'Người dùng',
  drivers: 'Tài xế',
  map: 'Bản đồ',
  promotions: 'Khuyến mãi',
  support: 'Hỗ trợ',
};

export default function AdminTopbar() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const [adminName, setAdminName] = useState('Admin');

  useEffect(() => {
    const stored = localStorage.getItem('admin_user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        setAdminName(user.name || user.email || 'Admin');
      } catch {
        // ignore
      }
    }
  }, []);

  const initials = adminName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {segments.map((segment, index) => (
          <span key={segment} className="flex items-center gap-2">
            {index > 0 && <span>/</span>}
            <span className={index === segments.length - 1 ? 'font-medium text-foreground' : ''}>
              {breadcrumbMap[segment] || segment}
            </span>
          </span>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Tìm kiếm..." className="w-64 pl-8" />
        </div>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
            3
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
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
                <p className="text-xs leading-none text-muted-foreground">Quản trị viên</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => (window.location.href = '/login')}>
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
