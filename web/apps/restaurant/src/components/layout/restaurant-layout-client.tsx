'use client';

import { useRef, useState } from 'react';
import { Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FoodFlowLogo } from '@foodflow/ui/foodflow-logo';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@foodflow/ui/sheet';
import { AiChatbotWidget } from '@/components/chatbot/ai-chatbot-widget';
import { cn } from '@/lib/utils';
import { RestaurantSidebar } from './restaurant-sidebar';

export function RestaurantLayoutClient({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const firstNavigationLinkRef = useRef<HTMLAnchorElement>(null);
  const t = useTranslations();

  return (
    <div className="min-h-dvh overflow-x-hidden bg-gray-50">
      <a
        href="#main-content"
        className="sr-only z-[60] rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-800 shadow-lg focus:fixed focus:left-4 focus:top-4 focus:not-sr-only focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
      >
        {t('common.skipToMain')}
      </a>

      <RestaurantSidebar
        collapsed={isSidebarCollapsed}
        onCollapsedChange={setIsSidebarCollapsed}
        className="fixed inset-y-0 left-0 z-40 hidden lg:flex"
      />

      <Sheet open={isNavigationOpen} onOpenChange={setIsNavigationOpen}>
        <SheetContent
          side="left"
          closeLabel={t('common.close')}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            firstNavigationLinkRef.current?.focus();
          }}
          className="w-72 max-w-[calc(100vw-2rem)] overscroll-contain border-0 bg-sidebar p-0 text-sidebar-foreground [&>button]:text-white"
        >
          <SheetTitle className="sr-only">{t('sidebar.mobileTitle')}</SheetTitle>
          <SheetDescription className="sr-only">{t('sidebar.mobileDescription')}</SheetDescription>
          <RestaurantSidebar
            className="w-full"
            initialFocusRef={firstNavigationLinkRef}
            onNavigate={() => setIsNavigationOpen(false)}
            showCollapseToggle={false}
          />
        </SheetContent>
      </Sheet>

      <div
        className={cn(
          'flex min-h-dvh min-w-0 flex-col transition-[margin-left] duration-200 ease-out motion-reduce:transition-none',
          isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-[260px]',
        )}
      >
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
          <FoodFlowLogo
            label={t('sidebar.brand')}
            markClassName="h-9 w-9"
            wordmarkClassName="text-gray-900"
          />
          <button
            type="button"
            className="inline-flex h-11 w-11 touch-manipulation items-center justify-center rounded-lg text-gray-700 transition-colors duration-200 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
            aria-label={t('sidebar.openNavigation')}
            onClick={() => setIsNavigationOpen(true)}
          >
            <Menu aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>

        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 p-4 sm:p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>

      <AiChatbotWidget />
    </div>
  );
}
