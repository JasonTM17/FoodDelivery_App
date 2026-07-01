'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { apiPatch } from '@/lib/api';
import { PageHeader } from '@foodflow/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Save, Webhook, CreditCard, Bell, Bot } from 'lucide-react';

export default function SettingsIntegrationsPage() {
  const t = useTranslations('settingsIntegrations');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await apiPatch('/admin/settings/integrations', {});
    } catch (err) {
      setSaveError((err as { message?: string }).message || 'Không thể lưu tích hợp');
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
              <CreditCard className="h-4 w-4 text-primary" />
              SePay
              <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 ml-auto">● {t('connected')}</Badge>
            </CardTitle>
            <CardDescription>{t('sePayDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('apiKey')}</Label>
              <Input type="password" defaultValue="sk-sepay-**********************" readOnly />
            </div>
            <div className="space-y-2">
              <Label>{t('webhookUrl')}</Label>
              <Input
                defaultValue={`${process.env.NEXT_PUBLIC_API_URL ?? ''}/webhooks/sepay`}
                readOnly
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('enableSePay')}</Label>
                <p className="text-xs text-muted-foreground">{t('enableSePayDesc')}</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="h-4 w-4 text-primary" />
              N8N Automation
              <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 ml-auto">● {t('connected')}</Badge>
            </CardTitle>
            <CardDescription>{t('n8nDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('instanceUrl')}</Label>
              <Input defaultValue={process.env.NEXT_PUBLIC_N8N_URL ?? 'http://localhost:5678'} />
            </div>
            <div className="space-y-2">
              <Label>{t('apiKey')}</Label>
              <Input type="password" defaultValue="n8n-**********************" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('enableN8n')}</Label>
                <p className="text-xs text-muted-foreground">{t('enableN8nDesc')}</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4 text-primary" />
              Firebase / FCM
            </CardTitle>
            <CardDescription>{t('fcmDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('projectId')}</Label>
              <Input defaultValue="foodflow-prod" />
            </div>
            <div className="space-y-2">
              <Label>{t('serviceAccountKey')}</Label>
              <Input type="password" placeholder={t('serviceAccountPlaceholder')} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('enableFcm')}</Label>
                <p className="text-xs text-muted-foreground">{t('enableFcmDesc')}</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Webhook className="h-4 w-4 text-primary" />
              {t('outboundWebhooks')}
            </CardTitle>
            <CardDescription>{t('outboundWebhooksDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('webhookSecret')}</Label>
              <Input type="password" defaultValue="whsec-**********************" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('enableOutboundWebhooks')}</Label>
                <p className="text-xs text-muted-foreground">{t('enableOutboundWebhooksDesc')}</p>
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
