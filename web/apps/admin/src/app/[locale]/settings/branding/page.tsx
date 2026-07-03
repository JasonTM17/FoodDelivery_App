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
import { Separator } from '@/components/ui/separator';
import { Save, Palette, Type, Image as ImageIcon, XCircle } from 'lucide-react';

interface BrandingForm {
  platformName: string;
  tagline: string;
  supportEmail: string;
  contactPhone: string;
  primaryColor: string;
  successColor: string;
  logoUrl: string;
  faviconUrl: string;
  ogImageUrl: string;
}

export default function SettingsBrandingPage() {
  const t = useTranslations('settingsBranding');
  const query = useQuery<AdminSettingsSectionResponse>({
    queryKey: ['admin-settings', 'branding'],
    queryFn: () => apiGet('/admin/settings/branding'),
  });
  const parsedForm = useMemo(() => {
    if (query.data === undefined) return undefined;
    return query.data?.settings ? toBrandingForm(query.data.settings) : null;
  }, [query.data]);
  const [form, setForm] = useState<BrandingForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (parsedForm) setForm(parsedForm);
  }, [parsedForm]);

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    setSaveError('');
    try {
      await apiPatch('/admin/settings/branding', {
        platformName: form.platformName.trim(),
        tagline: form.tagline.trim(),
        supportEmail: form.supportEmail.trim(),
        contactPhone: form.contactPhone.trim(),
        primaryColor: form.primaryColor.trim(),
        successColor: form.successColor.trim(),
        logoUrl: nullableUrl(form.logoUrl),
        faviconUrl: nullableUrl(form.faviconUrl),
        ogImageUrl: nullableUrl(form.ogImageUrl),
        themeMode: 'system',
      });
    } catch {
      setSaveError(t('saveError'));
    } finally {
      setSaving(false);
    }
  };

  const setField = <K extends keyof BrandingForm>(key: K, value: BrandingForm[K]) => {
    setForm(current => current ? { ...current, [key]: value } : current);
  };

  if (query.isLoading) return <BrandingSkeleton />;

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

  if (parsedForm === undefined || !form) return <BrandingSkeleton />;

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
              <Type className="h-4 w-4 text-primary" />
              {t('brandIdentity')}
            </CardTitle>
            <CardDescription>{t('brandIdentityDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="platformName">{t('platformName')}</Label>
              <Input
                id="platformName"
                value={form.platformName}
                onChange={(event) => setField('platformName', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">{t('tagline')}</Label>
              <Input
                id="tagline"
                value={form.tagline}
                onChange={(event) => setField('tagline', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportEmail">{t('supportEmail')}</Label>
              <Input
                id="supportEmail"
                type="email"
                value={form.supportEmail}
                onChange={(event) => setField('supportEmail', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">{t('contactPhone')}</Label>
              <Input
                id="contactPhone"
                value={form.contactPhone}
                onChange={(event) => setField('contactPhone', event.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="h-4 w-4 text-primary" />
              {t('colorScheme')}
            </CardTitle>
            <CardDescription>{t('colorSchemeDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">{t('primaryColor')}</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  value={form.primaryColor}
                  className="flex-1"
                  onChange={(event) => setField('primaryColor', event.target.value)}
                />
                <input
                  aria-label={t('primaryColor')}
                  type="color"
                  value={form.primaryColor}
                  className="h-10 w-10 cursor-pointer rounded border border-input p-1"
                  onChange={(event) => setField('primaryColor', event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accentColor">{t('accentColor')}</Label>
              <div className="flex gap-2">
                <Input
                  id="accentColor"
                  value={form.successColor}
                  className="flex-1"
                  onChange={(event) => setField('successColor', event.target.value)}
                />
                <input
                  aria-label={t('accentColor')}
                  type="color"
                  value={form.successColor}
                  className="h-10 w-10 cursor-pointer rounded border border-input p-1"
                  onChange={(event) => setField('successColor', event.target.value)}
                />
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>{t('preview')}</Label>
              <div className="flex gap-2">
                <div className="h-10 flex-1 rounded" style={{ backgroundColor: form.primaryColor }} />
                <div className="h-10 flex-1 rounded" style={{ backgroundColor: form.successColor }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="h-4 w-4 text-primary" />
              {t('logoAssets')}
            </CardTitle>
            <CardDescription>{t('logoAssetsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-3">
            {([
              ['logo', 'logoUrl'],
              ['favicon', 'faviconUrl'],
              ['ogImage', 'ogImageUrl'],
            ] as const).map(([labelKey, field]) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={field}>{t(labelKey)}</Label>
                <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30">
                  <div className="text-center">
                    <ImageIcon className="mx-auto h-6 w-6 text-muted-foreground" />
                    <p className="mt-1 text-xs text-muted-foreground">{form[field] || t('uploadHint')}</p>
                  </div>
                </div>
                <Input
                  id={field}
                  type="url"
                  value={form[field]}
                  placeholder="https://..."
                  className="text-xs"
                  onChange={(event) => setField(field, event.target.value)}
                />
              </div>
            ))}
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

function toBrandingForm(settings: Record<string, unknown>): BrandingForm | null {
  try {
    return {
      platformName: requireString(settings.platformName),
      tagline: requireString(settings.tagline),
      supportEmail: requireString(settings.supportEmail),
      contactPhone: requireString(settings.contactPhone),
      primaryColor: requireString(settings.primaryColor),
      successColor: requireString(settings.successColor),
      logoUrl: readNullableString(settings.logoUrl),
      faviconUrl: readNullableString(settings.faviconUrl),
      ogImageUrl: readNullableString(settings.ogImageUrl),
    };
  } catch {
    return null;
  }
}

function BrandingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-24 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-lg bg-muted" />
        <div className="h-72 animate-pulse rounded-lg bg-muted" />
        <div className="h-56 animate-pulse rounded-lg bg-muted lg:col-span-2" />
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

function nullableUrl(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
