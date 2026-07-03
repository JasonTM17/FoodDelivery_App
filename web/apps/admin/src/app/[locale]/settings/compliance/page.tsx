'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { AdminSettingsSectionResponse } from '@foodflow/api-client';
import { EmptyState } from '@foodflow/ui/empty-state';
import { useTranslations } from 'next-intl';
import { apiGet, apiPatch } from '@/lib/api';
import { PageHeader } from '@/components/layout/admin-page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Save, ShieldCheck, FileText, Database, Globe, XCircle } from 'lucide-react';

interface ComplianceForm {
  tosUrl: string;
  privacyUrl: string;
  cookiePolicyUrl: string;
  auditLogRetentionDays: string;
  orderRetentionDays: string;
  userDataRetentionDays: string;
  consentBannerEnabled: boolean;
  dataExportRequestsEnabled: boolean;
  deletionRequestsEnabled: boolean;
  jurisdiction: string;
  vatNumber: string;
  vatEnabled: boolean;
  kycReviewRequired: boolean;
  supportSlaBusinessHours: string;
  exportRetentionHours: string;
}

export default function SettingsCompliancePage() {
  const t = useTranslations('settingsCompliance');
  const query = useQuery<AdminSettingsSectionResponse>({
    queryKey: ['admin-settings', 'compliance'],
    queryFn: () => apiGet('/admin/settings/compliance'),
  });
  const parsedForm = useMemo(() => {
    if (query.data === undefined) return undefined;
    return query.data?.settings ? toComplianceForm(query.data.settings) : null;
  }, [query.data]);
  const [form, setForm] = useState<ComplianceForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (parsedForm) setForm(parsedForm);
  }, [parsedForm]);

  const handleSave = async () => {
    if (!form) return;
    const auditRetentionDays = parsePositiveInteger(form.auditLogRetentionDays);
    const orderRetentionDays = parsePositiveInteger(form.orderRetentionDays);
    const userDataRetentionDays = parsePositiveInteger(form.userDataRetentionDays);
    const exportRetentionHours = parsePositiveInteger(form.exportRetentionHours);
    if (
      auditRetentionDays == null ||
      orderRetentionDays == null ||
      userDataRetentionDays == null ||
      exportRetentionHours == null
    ) {
      setSaveError(t('validationError'));
      return;
    }

    setSaving(true);
    setSaveError('');
    try {
      await apiPatch('/admin/settings/compliance', {
        tosUrl: nullableUrl(form.tosUrl),
        privacyUrl: nullableUrl(form.privacyUrl),
        cookiePolicyUrl: nullableUrl(form.cookiePolicyUrl),
        auditRetentionDays,
        orderRetentionDays,
        userDataRetentionDays,
        exportRetentionHours,
        consentBannerEnabled: form.consentBannerEnabled,
        dataExportRequestsEnabled: form.dataExportRequestsEnabled,
        deletionRequestsEnabled: form.deletionRequestsEnabled,
        kycReviewRequired: form.kycReviewRequired,
        supportSlaBusinessHours: form.supportSlaBusinessHours.trim(),
        jurisdiction: form.jurisdiction.trim(),
        vatNumber: form.vatNumber.trim() || null,
        vatEnabled: form.vatEnabled,
      });
    } catch {
      setSaveError(t('saveError'));
    } finally {
      setSaving(false);
    }
  };

  const setField = <K extends keyof ComplianceForm>(key: K, value: ComplianceForm[K]) => {
    setForm(current => current ? { ...current, [key]: value } : current);
  };

  if (query.isLoading) return <ComplianceSkeleton />;

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

  if (parsedForm === undefined || !form) return <ComplianceSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Admin' },
          { label: 'Settings', href: '/settings' },
          { label: t('title') },
        ]}
        title={t('title')}
        description={t('description')}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-primary" />
              {t('legalDocuments')}
            </CardTitle>
            <CardDescription>{t('legalDocumentsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tosUrl">{t('tosUrl')}</Label>
              <Input
                id="tosUrl"
                placeholder="https://foodflow.vn/terms"
                type="url"
                value={form.tosUrl}
                onChange={(event) => setField('tosUrl', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="privacyUrl">{t('privacyUrl')}</Label>
              <Input
                id="privacyUrl"
                placeholder="https://foodflow.vn/privacy"
                type="url"
                value={form.privacyUrl}
                onChange={(event) => setField('privacyUrl', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cookiePolicyUrl">{t('cookiePolicyUrl')}</Label>
              <Input
                id="cookiePolicyUrl"
                placeholder="https://foodflow.vn/cookies"
                type="url"
                value={form.cookiePolicyUrl}
                onChange={(event) => setField('cookiePolicyUrl', event.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4 text-primary" />
              {t('dataRetention')}
            </CardTitle>
            <CardDescription>{t('dataRetentionDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="auditLogRetentionDays">{t('auditLogRetention')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="auditLogRetentionDays"
                  type="number"
                  min="1"
                  value={form.auditLogRetentionDays}
                  className="w-24"
                  onChange={(event) => setField('auditLogRetentionDays', event.target.value)}
                />
                <span className="text-sm text-muted-foreground">{t('days')}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderRetentionDays">{t('orderRetention')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="orderRetentionDays"
                  type="number"
                  min="1"
                  value={form.orderRetentionDays}
                  className="w-24"
                  onChange={(event) => setField('orderRetentionDays', event.target.value)}
                />
                <span className="text-sm text-muted-foreground">{t('days')}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="userDataRetentionDays">{t('userDataRetention')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="userDataRetentionDays"
                  type="number"
                  min="1"
                  value={form.userDataRetentionDays}
                  className="w-24"
                  onChange={(event) => setField('userDataRetentionDays', event.target.value)}
                />
                <span className="text-sm text-muted-foreground">{t('days')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-primary" />
              {t('gdprSettings')}
            </CardTitle>
            <CardDescription>{t('gdprSettingsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('consentBanner')}</Label>
                <p className="text-xs text-muted-foreground">{t('consentBannerDesc')}</p>
              </div>
              <Switch
                checked={form.consentBannerEnabled}
                onCheckedChange={(checked) => setField('consentBannerEnabled', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('dataExportRequest')}</Label>
                <p className="text-xs text-muted-foreground">{t('dataExportRequestDesc')}</p>
              </div>
              <Switch
                checked={form.dataExportRequestsEnabled}
                onCheckedChange={(checked) => setField('dataExportRequestsEnabled', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('deletionRequest')}</Label>
                <p className="text-xs text-muted-foreground">{t('deletionRequestDesc')}</p>
              </div>
              <Switch
                checked={form.deletionRequestsEnabled}
                onCheckedChange={(checked) => setField('deletionRequestsEnabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4 text-primary" />
              {t('regionalSettings')}
            </CardTitle>
            <CardDescription>{t('regionalSettingsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jurisdiction">{t('jurisdiction')}</Label>
              <Input
                id="jurisdiction"
                value={form.jurisdiction}
                onChange={(event) => setField('jurisdiction', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vatNumber">{t('vatNumber')}</Label>
              <Input
                id="vatNumber"
                placeholder="0123456789"
                value={form.vatNumber}
                onChange={(event) => setField('vatNumber', event.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('vatEnabled')}</Label>
                <p className="text-xs text-muted-foreground">{t('vatEnabledDesc')}</p>
              </div>
              <Switch
                checked={form.vatEnabled}
                onCheckedChange={(checked) => setField('vatEnabled', checked)}
              />
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

function toComplianceForm(settings: Record<string, unknown>): ComplianceForm | null {
  try {
    return {
      tosUrl: readNullableString(settings.tosUrl),
      privacyUrl: readNullableString(settings.privacyUrl),
      cookiePolicyUrl: readNullableString(settings.cookiePolicyUrl),
      auditLogRetentionDays: requireNumberString(settings.auditRetentionDays),
      orderRetentionDays: requireNumberString(settings.orderRetentionDays),
      userDataRetentionDays: requireNumberString(settings.userDataRetentionDays),
      consentBannerEnabled: requireBoolean(settings.consentBannerEnabled),
      dataExportRequestsEnabled: requireBoolean(settings.dataExportRequestsEnabled),
      deletionRequestsEnabled: requireBoolean(settings.deletionRequestsEnabled),
      jurisdiction: requireString(settings.jurisdiction),
      vatNumber: readNullableString(settings.vatNumber),
      vatEnabled: requireBoolean(settings.vatEnabled),
      kycReviewRequired: requireBoolean(settings.kycReviewRequired),
      supportSlaBusinessHours: requireString(settings.supportSlaBusinessHours),
      exportRetentionHours: requireNumberString(settings.exportRetentionHours),
    };
  } catch {
    return null;
  }
}

function ComplianceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-24 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-64 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}

function requireString(value: unknown): string {
  if (typeof value === 'string') return value;
  throw new Error('Settings field must be a string');
}

function readNullableString(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  throw new Error('Settings field must be a nullable string');
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

function nullableUrl(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
