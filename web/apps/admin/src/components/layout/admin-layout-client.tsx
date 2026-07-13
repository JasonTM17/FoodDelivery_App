'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import AdminSidebar from './admin-sidebar'
import AdminTopbar from './admin-topbar'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import { AiChatbotWidget } from '@/components/chatbot/ai-chatbot-widget'

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false)
  const firstNavigationLinkRef = useRef<HTMLAnchorElement>(null)
  const t = useTranslations()

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only z-[60] rounded-lg bg-background px-4 py-2 text-sm font-semibold text-primary shadow-lg focus:fixed focus:left-4 focus:top-4 focus:not-sr-only focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {t('common.skipToMain')}
      </a>
      <AdminSidebar className="fixed inset-y-0 left-0 z-40 hidden lg:flex" />

      <Sheet open={isNavigationOpen} onOpenChange={setIsNavigationOpen}>
        <SheetContent
          side="left"
          closeLabel={t('common.close')}
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            firstNavigationLinkRef.current?.focus()
          }}
          className="h-dvh max-h-dvh w-64 border-0 bg-sidebar p-0 text-sidebar-foreground sm:max-w-64 [&>button]:text-white"
        >
          <SheetTitle className="sr-only">{t('sidebar.mobileTitle')}</SheetTitle>
          <SheetDescription className="sr-only">{t('sidebar.mobileDescription')}</SheetDescription>
          <AdminSidebar
            initialFocusRef={firstNavigationLinkRef}
            onNavigate={() => setIsNavigationOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-h-screen min-w-0 flex-col lg:ml-64">
        <AdminTopbar onOpenNavigation={() => setIsNavigationOpen(true)} />
        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>

      {/* Authenticated shell only — RootLayoutClient skips this on login/public routes */}
      <AiChatbotWidget />
    </div>
  )
}
