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
      setSaveError((err as { message?: string }).message || 'Không thể lưu cài đặt');
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
              Chung
            </CardTitle>
            <CardDescription>Cấu hình chung của nền tảng</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">Tên nền tảng</Label>
              <Input id="siteName" defaultValue="FoodFlow" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Múi giờ</Label>
              <Input id="timezone" defaultValue="Asia/Ho_Chi_Minh" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Đơn vị tiền tệ</Label>
              <Input id="currency" defaultValue="VND" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Chế độ bảo trì</Label>
                <p className="text-xs text-muted-foreground">Tạm ngưng hoạt động nền tảng</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Đăng ký mới</Label>
                <p className="text-xs text-muted-foreground">Cho phép người dùng đăng ký mới</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4 text-primary" />
              Thông báo
            </CardTitle>
            <CardDescription>Cấu hình thông báo hệ thống</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Thông báo đơn mới</Label>
                <p className="text-xs text-muted-foreground">Gửi khi có đơn hàng mới</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Thông báo hỗ trợ</Label>
                <p className="text-xs text-muted-foreground">Gửi khi có ticket hỗ trợ mới</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Thông báo tài xế mới</Label>
                <p className="text-xs text-muted-foreground">Gửi khi có tài xế đăng ký mới</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email digest hàng ngày</Label>
                <p className="text-xs text-muted-foreground">Gửi báo cáo tổng kết cuối ngày</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-primary" />
              Bảo mật
            </CardTitle>
            <CardDescription>Cấu hình bảo mật hệ thống</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Phiên đăng nhập tối đa (phút)</Label>
              <Input type="number" defaultValue="480" />
            </div>
            <div className="space-y-2">
              <Label>Số lần đăng nhập sai tối đa</Label>
              <Input type="number" defaultValue="5" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Xác thực 2 lớp</Label>
                <p className="text-xs text-muted-foreground">Bắt buộc 2FA cho admin</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Ghi log đăng nhập</Label>
                <p className="text-xs text-muted-foreground">Ghi lại mọi lần đăng nhập</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4 text-primary" />
              Dữ liệu
            </CardTitle>
            <CardDescription>Quản lý dữ liệu hệ thống</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Tự động xóa log</Label>
                <p className="text-xs text-muted-foreground">Xóa audit log sau 90 ngày</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Xóa đơn hàng cũ</Label>
                <p className="text-xs text-muted-foreground">Xóa đơn đã giao sau 365 ngày</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" size="sm">
                Xuất dữ liệu
              </Button>
              <Button variant="outline" className="flex-1" size="sm">
                Sao lưu
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
          {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
        </Button>
      </div>
    </div>
  );
}
