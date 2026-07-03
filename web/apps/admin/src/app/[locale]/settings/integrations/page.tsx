'use client';

import { useQuery } from '@tanstack/react-query';
import type { AdminSettingsSectionResponse } from '@foodflow/api-client';
import { EmptyState } from '@foodflow/ui/empty-state';
import { Bell, Bot, CreditCard, ShieldCheck, Webhook, XCircle } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { PageHeader } from '@/components/layout/admin-page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiGet } from '@/lib/api';
import { useAiMonitorOverview } from '../../ai-monitor/ai-monitor-query';
import type { AiMonitorOverview } from '../../ai-monitor/ai-monitor-types';
import {
  IntegrationStatusCard,
  type IntegrationStatus,
} from './integration-status-card';

export default function SettingsIntegrationsPage() {
  const t = useTranslations('settingsIntegrations');
  const locale = useLocale();
  const settingsQuery = useQuery<AdminSettingsSectionResponse>({
    queryKey: ['admin-settings', 'integrations'],
    queryFn: () => apiGet('/admin/settings/integrations'),
  });
  const aiQuery = useAiMonitorOverview();

  if (settingsQuery.isLoading || aiQuery.isLoading) return <IntegrationsSkeleton />;

  if (settingsQuery.isError && aiQuery.isError) {
    return (
      <EmptyState
        icon={XCircle}
        title={t('loadErrorTitle')}
        description={t('loadErrorDescription')}
        actionLabel={t('retry')}
        onAction={() => {
          void settingsQuery.refetch();
          void aiQuery.refetch();
        }}
      />
    );
  }

  const settings = settingsQuery.data?.settings ?? {};
  const integrations = [
    {
      icon: CreditCard,
      title: 'SePay',
      description: t('sePayDescription'),
      status: storedStatus(settingsQuery.isError, readBoolean(settings, 'sepayConfigured')),
      detailLabel: t('configurationSource'),
      detail: t('serverSecretManager'),
    },
    {
      icon: Bot,
      title: t('aiChatbot'),
      description: t('aiChatbotDescription'),
      status: aiStatus(aiQuery.isError, aiQuery.data),
      detailLabel: t('model'),
      detail: aiQuery.data?.instance.model ?? t('notAvailable'),
    },
    {
      icon: Bell,
      title: t('pushNotifications'),
      description: t('fcmDescription'),
      status: storedStatus(
        settingsQuery.isError,
        readBoolean(settings, 'notificationProviderConfigured'),
      ),
      detailLabel: t('configurationSource'),
      detail: t('serverSecretManager'),
    },
    {
      icon: Webhook,
      title: t('outboundWebhooks'),
      description: t('outboundWebhooksDesc'),
      status: storedStatus(
        settingsQuery.isError,
        readBoolean(settings, 'outboundWebhooksConfigured'),
      ),
      detailLabel: t('signature'),
      detail: t('hmacSignature'),
    },
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Admin' },
          { label: t('settingsBreadcrumb'), href: '/settings' },
          { label: t('title') },
        ]}
        title={t('title')}
        description={t('description')}
      />

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex gap-3 p-4 text-sm">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="font-medium">{t('secretsManagedServerSideTitle')}</p>
            <p className="mt-1 text-muted-foreground">{t('secretsManagedServerSideDescription')}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {integrations.map((integration) => (
          <IntegrationStatusCard
            key={integration.title}
            {...integration}
            statusLabel={t(`statuses.${integration.status}`)}
          />
        ))}
      </div>

      {settingsQuery.data?.updatedAt ? (
        <p className="text-right text-xs text-muted-foreground">
          {t('lastUpdated', {
            value: new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
              new Date(settingsQuery.data.updatedAt),
            ),
          })}
        </p>
      ) : null}
    </div>
  );
}

function readBoolean(settings: Record<string, unknown>, key: string): boolean {
  return settings[key] === true;
}

function storedStatus(isError: boolean, configured: boolean): IntegrationStatus {
  if (isError) return 'unavailable';
  return configured ? 'configured' : 'not_configured';
}

function aiStatus(isError: boolean, overview: AiMonitorOverview | undefined): IntegrationStatus {
  if (isError || !overview) return 'unavailable';
  return overview?.instance.status === 'not_configured' ? 'not_configured' : 'configured';
}

function IntegrationsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-20 rounded-lg" />
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-48 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
