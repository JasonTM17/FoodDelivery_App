'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { apiPatch } from '@/lib/api';
import { PageHeader } from '@foodflow/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Save, Palette, Type, Image } from 'lucide-react';

export default function SettingsBrandingPage() {
  const t = useTranslations('settingsBranding');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiPatch('/admin/settings/branding', {});
    } catch (err) {
      console.error('Failed to save branding:', err);
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
              <Type className="h-4 w-4 text-primary" />
              {t('brandIdentity')}
            </CardTitle>
            <CardDescription>{t('brandIdentityDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="platformName">{t('platformName')}</Label>
              <Input id="platformName" defaultValue="FoodFlow" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">{t('tagline')}</Label>
              <Input id="tagline" defaultValue="Đặt đồ ăn nhanh chóng" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportEmail">{t('supportEmail')}</Label>
              <Input id="supportEmail" type="email" defaultValue="support@foodflow.vn" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">{t('contactPhone')}</Label>
              <Input id="contactPhone" defaultValue="+84 900 000 000" />
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
                <Input id="primaryColor" defaultValue="#f97316" className="flex-1" />
                <input type="color" defaultValue="#f97316" className="h-10 w-10 cursor-pointer rounded border border-input p-1" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accentColor">{t('accentColor')}</Label>
              <div className="flex gap-2">
                <Input id="accentColor" defaultValue="#ea580c" className="flex-1" />
                <input type="color" defaultValue="#ea580c" className="h-10 w-10 cursor-pointer rounded border border-input p-1" />
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>{t('preview')}</Label>
              <div className="flex gap-2">
                <div className="h-10 flex-1 rounded bg-[#f97316]" />
                <div className="h-10 flex-1 rounded bg-[#ea580c]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Image className="h-4 w-4 text-primary" />
              {t('logoAssets')}
            </CardTitle>
            <CardDescription>{t('logoAssetsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-3">
            {(['logo', 'favicon', 'ogImage'] as const).map((asset) => (
              <div key={asset} className="space-y-2">
                <Label>{t(asset)}</Label>
                <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30">
                  <div className="text-center">
                    <Image className="mx-auto h-6 w-6 text-muted-foreground" />
                    <p className="mt-1 text-xs text-muted-foreground">{t('uploadHint')}</p>
                  </div>
                </div>
                <Input type="file" accept="image/*" className="text-xs" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="mr-2 h-4 w-4" />
          {saving ? t('saving') : t('save')}
        </Button>
      </div>
    </div>
  );
}
