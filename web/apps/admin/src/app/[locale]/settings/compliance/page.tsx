'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { apiPatch } from '@/lib/api';
import { PageHeader } from '@/components/layout/admin-page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Save, ShieldCheck, FileText, Database, Globe } from 'lucide-react';

export default function SettingsCompliancePage() {
  const t = useTranslations('settingsCompliance');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await apiPatch('/admin/settings/compliance', {});
    } catch (err) {
      setSaveError((err as { message?: string }).message || 'Không thể lưu cài đặt tuân thủ');
    } finally {
      setSaving(false);
    }
  };

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
              <Input id="tosUrl" placeholder="https://foodflow.vn/terms" type="url" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="privacyUrl">{t('privacyUrl')}</Label>
              <Input id="privacyUrl" placeholder="https://foodflow.vn/privacy" type="url" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cookiePolicyUrl">{t('cookiePolicyUrl')}</Label>
              <Input id="cookiePolicyUrl" placeholder="https://foodflow.vn/cookies" type="url" />
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
                <Input id="auditLogRetentionDays" type="number" defaultValue="90" className="w-24" />
                <span className="text-sm text-muted-foreground">{t('days')}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderRetentionDays">{t('orderRetention')}</Label>
              <div className="flex items-center gap-2">
                <Input id="orderRetentionDays" type="number" defaultValue="365" className="w-24" />
                <span className="text-sm text-muted-foreground">{t('days')}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="userDataRetentionDays">{t('userDataRetention')}</Label>
              <div className="flex items-center gap-2">
                <Input id="userDataRetentionDays" type="number" defaultValue="730" className="w-24" />
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
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('dataExportRequest')}</Label>
                <p className="text-xs text-muted-foreground">{t('dataExportRequestDesc')}</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('deletionRequest')}</Label>
                <p className="text-xs text-muted-foreground">{t('deletionRequestDesc')}</p>
              </div>
              <Switch defaultChecked />
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
              <Input id="jurisdiction" defaultValue="Vietnam" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vatNumber">{t('vatNumber')}</Label>
              <Input id="vatNumber" placeholder="0123456789" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('vatEnabled')}</Label>
                <p className="text-xs text-muted-foreground">{t('vatEnabledDesc')}</p>
              </div>
              <Switch defaultChecked />
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
