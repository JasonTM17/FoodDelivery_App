'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { AdminSettingsSectionResponse } from '@foodflow/api-client';
import { EmptyState } from '@foodflow/ui/empty-state';
import { PageHeader } from '@/components/layout/admin-page-header';
import { apiGet, apiPatch } from '@/lib/api';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Bell, Shield, Database, Globe, Save, XCircle } from 'lucide-react';

interface GeneralSettingsForm {
  platformName: string;
  timezone: string;
  currency: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  newOrderNotifications: boolean;
  supportNotifications: boolean;
  newDriverNotifications: boolean;
  dailyDigestEnabled: boolean;
  maxSessionMinutes: string;
  maxLoginFailures: string;
  requireAdminTwoFactor: boolean;
  loginAuditEnabled: boolean;
  autoDeleteLogs: boolean;
  deleteOldOrders: boolean;
}

export default function SettingsPage() {
  const t = useTranslations('settings');
  const query = useQuery<AdminSettingsSectionResponse>({
    queryKey: ['admin-settings', 'general'],
    queryFn: () => apiGet('/admin/settings/general'),
  });
  const parsedForm = useMemo(() => {
    if (query.data === undefined) return undefined;
    return query.data?.settings ? toGeneralForm(query.data.settings) : null;
  }, [query.data]);
  const [form, setForm] = useState<GeneralSettingsForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (parsedForm) setForm(parsedForm);
  }, [parsedForm]);

  const handleSave = async () => {
    if (!form) return;
    const maxSessionMinutes = parsePositiveInteger(form.maxSessionMinutes);
    const maxLoginFailures = parsePositiveInteger(form.maxLoginFailures);
    if (maxSessionMinutes == null || maxLoginFailures == null) {
      setSaveError(t('validationError'));
      return;
    }

    setSaving(true);
    setSaveError('');
    try {
      const payload = {
        platformName: form.platformName.trim(),
        defaultLocale: 'vi',
        timezone: form.timezone.trim(),
        currency: form.currency.trim().toUpperCase(),
        maintenanceMode: form.maintenanceMode,
        registrationEnabled: form.registrationEnabled,
        notifications: {
          newOrder: form.newOrderNotifications,
          support: form.supportNotifications,
          newDriver: form.newDriverNotifications,
          dailyDigest: form.dailyDigestEnabled,
        },
        security: {
          maxSessionMinutes,
          maxLoginFailures,
          requireAdminTwoFactor: form.requireAdminTwoFactor,
          loginAuditEnabled: form.loginAuditEnabled,
        },
        dataRetention: {
          autoDeleteLogs: form.autoDeleteLogs,
          deleteOldOrders: form.deleteOldOrders,
        },
      };
      await apiPatch('/admin/settings/general', payload);
    } catch (err) {
      setSaveError((err as { message?: string }).message || t('saveError'));
    } finally {
      setSaving(false);
    }
  };

  const setField = <K extends keyof GeneralSettingsForm>(key: K, value: GeneralSettingsForm[K]) => {
    setForm(current => current ? { ...current, [key]: value } : current);
  };

  if (query.isLoading) return <SettingsSkeleton />;

  if (query.isError || parsedForm === null) {
    return (
      <EmptyState
        icon={XCircle}
        title={query.isError ? t('loadErrorTitle') : t('contractErrorTitle')}
        description={query.isError ? t('loadErrorDescription') : t('contractErrorDescription')}
        actionLabel={t('retry')}
        onAction={() => {
          setForm(null);
          void query.refetch();
        }}
      />
    );
  }

  if (parsedForm === undefined || !form) return <SettingsSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Admin' }, { label: t('title') }]}
        title={t('title')}
        description={t('description')}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4 text-primary" />
              {t('sections.general.title')}
            </CardTitle>
            <CardDescription>{t('sections.general.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">{t('sections.general.siteName')}</Label>
              <Input
                id="siteName"
                value={form.platformName}
                onChange={(event) => setField('platformName', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">{t('sections.general.timezone')}</Label>
              <Input
                id="timezone"
                value={form.timezone}
                onChange={(event) => setField('timezone', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">{t('sections.general.currency')}</Label>
              <Input
                id="currency"
                value={form.currency}
                onChange={(event) => setField('currency', event.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('sections.general.maintenanceMode')}</Label>
                <p className="text-xs text-muted-foreground">{t('sections.general.maintenanceDescription')}</p>
              </div>
              <Switch
                checked={form.maintenanceMode}
                onCheckedChange={(checked) => setField('maintenanceMode', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('sections.general.registration')}</Label>
                <p className="text-xs text-muted-foreground">{t('sections.general.registrationDescription')}</p>
              </div>
              <Switch
                checked={form.registrationEnabled}
                onCheckedChange={(checked) => setField('registrationEnabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4 text-primary" />
              {t('sections.notifications.title')}
            </CardTitle>
            <CardDescription>{t('sections.notifications.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('sections.notifications.newOrder')}</Label>
                <p className="text-xs text-muted-foreground">{t('sections.notifications.newOrderDescription')}</p>
              </div>
              <Switch
                checked={form.newOrderNotifications}
                onCheckedChange={(checked) => setField('newOrderNotifications', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('sections.notifications.support')}</Label>
                <p className="text-xs text-muted-foreground">{t('sections.notifications.supportDescription')}</p>
              </div>
              <Switch
                checked={form.supportNotifications}
                onCheckedChange={(checked) => setField('supportNotifications', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('sections.notifications.newDriver')}</Label>
                <p className="text-xs text-muted-foreground">{t('sections.notifications.newDriverDescription')}</p>
              </div>
              <Switch
                checked={form.newDriverNotifications}
                onCheckedChange={(checked) => setField('newDriverNotifications', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('sections.notifications.dailyDigest')}</Label>
                <p className="text-xs text-muted-foreground">{t('sections.notifications.dailyDigestDescription')}</p>
              </div>
              <Switch
                checked={form.dailyDigestEnabled}
                onCheckedChange={(checked) => setField('dailyDigestEnabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-primary" />
              {t('sections.security.title')}
            </CardTitle>
            <CardDescription>{t('sections.security.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('sections.security.maxSessionMinutes')}</Label>
              <Input
                type="number"
                min="1"
                value={form.maxSessionMinutes}
                onChange={(event) => setField('maxSessionMinutes', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('sections.security.maxLoginFailures')}</Label>
              <Input
                type="number"
                min="1"
                value={form.maxLoginFailures}
                onChange={(event) => setField('maxLoginFailures', event.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('sections.security.twoFactor')}</Label>
                <p className="text-xs text-muted-foreground">{t('sections.security.twoFactorDescription')}</p>
              </div>
              <Switch
                checked={form.requireAdminTwoFactor}
                onCheckedChange={(checked) => setField('requireAdminTwoFactor', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('sections.security.loginAudit')}</Label>
                <p className="text-xs text-muted-foreground">{t('sections.security.loginAuditDescription')}</p>
              </div>
              <Switch
                checked={form.loginAuditEnabled}
                onCheckedChange={(checked) => setField('loginAuditEnabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4 text-primary" />
              {t('sections.data.title')}
            </CardTitle>
            <CardDescription>{t('sections.data.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('sections.data.autoDeleteLogs')}</Label>
                <p className="text-xs text-muted-foreground">{t('sections.data.autoDeleteLogsDescription')}</p>
              </div>
              <Switch
                checked={form.autoDeleteLogs}
                onCheckedChange={(checked) => setField('autoDeleteLogs', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('sections.data.deleteOldOrders')}</Label>
                <p className="text-xs text-muted-foreground">{t('sections.data.deleteOldOrdersDescription')}</p>
              </div>
              <Switch
                checked={form.deleteOldOrders}
                onCheckedChange={(checked) => setField('deleteOldOrders', checked)}
              />
            </div>
            <Separator />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" size="sm">
                {t('sections.data.exportData')}
              </Button>
              <Button variant="outline" className="flex-1" size="sm">
                {t('sections.data.backup')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        {saveError && (
          <p className="mr-auto self-center text-sm text-destructive">{saveError}</p>
        )}
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="mr-2 h-4 w-4" />
          {saving ? t('saving') : t('save')}
        </Button>
      </div>
    </div>
  );
}

function toGeneralForm(settings: Record<string, unknown>): GeneralSettingsForm | null {
  try {
    const notifications = requireRecord(settings.notifications);
    const security = requireRecord(settings.security);
    const dataRetention = requireRecord(settings.dataRetention);

    return {
      platformName: requireString(settings.platformName),
      timezone: requireString(settings.timezone),
      currency: requireString(settings.currency),
      maintenanceMode: requireBoolean(settings.maintenanceMode),
      registrationEnabled: requireBoolean(settings.registrationEnabled),
      newOrderNotifications: requireBoolean(notifications.newOrder),
      supportNotifications: requireBoolean(notifications.support),
      newDriverNotifications: requireBoolean(notifications.newDriver),
      dailyDigestEnabled: requireBoolean(notifications.dailyDigest),
      maxSessionMinutes: requireNumberString(security.maxSessionMinutes),
      maxLoginFailures: requireNumberString(security.maxLoginFailures),
      requireAdminTwoFactor: requireBoolean(security.requireAdminTwoFactor),
      loginAuditEnabled: requireBoolean(security.loginAuditEnabled),
      autoDeleteLogs: requireBoolean(dataRetention.autoDeleteLogs),
      deleteOldOrders: requireBoolean(dataRetention.deleteOldOrders),
    };
  } catch {
    return null;
  }
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-24 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-72 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  throw new Error('Settings field must be an object');
}

function requireString(value: unknown): string {
  if (typeof value === 'string') return value;
  throw new Error('Settings field must be a string');
}

function requireBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  throw new Error('Settings field must be a boolean');
}

function requireNumberString(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  throw new Error('Settings field must be a finite number');
}

function parsePositiveInteger(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return null;
}
