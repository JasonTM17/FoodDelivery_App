'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/admin-page-header';
import { apiPatch } from '@/lib/api';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Bell, Shield, Database, Globe, Save } from 'lucide-react';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await apiPatch('/admin/settings', {});
    } catch (err) {
      setSaveError((err as { message?: string }).message || t('saveError'));
    } finally {
      setSaving(false);
    }
  };

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
              <Input id="siteName" defaultValue="FoodFlow" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">{t('sections.general.timezone')}</Label>
              <Input id="timezone" defaultValue="Asia/Ho_Chi_Minh" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">{t('sections.general.currency')}</Label>
              <Input id="currency" defaultValue="VND" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('sections.general.maintenanceMode')}</Label>
                <p className="text-xs text-muted-foreground">{t('sections.general.maintenanceDescription')}</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('sections.general.registration')}</Label>
                <p className="text-xs text-muted-foreground">{t('sections.general.registrationDescription')}</p>
              </div>
              <Switch defaultChecked />
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
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('sections.notifications.support')}</Label>
                <p className="text-xs text-muted-foreground">{t('sections.notifications.supportDescription')}</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('sections.notifications.newDriver')}</Label>
                <p className="text-xs text-muted-foreground">{t('sections.notifications.newDriverDescription')}</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('sections.notifications.dailyDigest')}</Label>
                <p className="text-xs text-muted-foreground">{t('sections.notifications.dailyDigestDescription')}</p>
              </div>
              <Switch defaultChecked />
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
              <Input type="number" defaultValue="480" />
            </div>
            <div className="space-y-2">
              <Label>{t('sections.security.maxLoginFailures')}</Label>
              <Input type="number" defaultValue="5" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('sections.security.twoFactor')}</Label>
                <p className="text-xs text-muted-foreground">{t('sections.security.twoFactorDescription')}</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('sections.security.loginAudit')}</Label>
                <p className="text-xs text-muted-foreground">{t('sections.security.loginAuditDescription')}</p>
              </div>
              <Switch defaultChecked />
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
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('sections.data.deleteOldOrders')}</Label>
                <p className="text-xs text-muted-foreground">{t('sections.data.deleteOldOrdersDescription')}</p>
              </div>
              <Switch />
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
