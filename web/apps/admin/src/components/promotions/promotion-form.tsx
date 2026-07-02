'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { apiPatch, apiPost } from '@/lib/api';
import { promotionSchema, type PromotionFormValues } from '@/lib/schemas/promotion-schema';
import { toAdminPromotionPayload } from './admin-promotions-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import PromotionPreview from './promotion-preview';
import { useState } from 'react';

interface PromotionFormProps {
  defaultValues?: Partial<PromotionFormValues>;
  editId?: string;
  onSuccess?: () => void;
}

const discountTypeLabels: Record<string, string> = {
  combo: 'Combo',
  percent: 'Phần trăm (%)',
  fixed: 'Cố định (VND)',
  bogo: 'Mua 1 tặng 1',
  shipping: 'Miễn phí vận chuyển',
};

const audienceLabels: Record<string, string> = {
  all: 'Tất cả người dùng',
  new: 'Người dùng mới',
  vip: 'Người dùng VIP',
  segment: 'Theo phân khúc',
};

export default function PromotionForm({ defaultValues, editId, onSuccess }: PromotionFormProps) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const form = useForm<PromotionFormValues>({
    resolver: zodResolver(promotionSchema),
    defaultValues: {
      code: '',
      name: '',
      discountType: 'percent',
      discountValue: 0,
      minOrderVnd: 0,
      maxDiscountVnd: 0,
      audience: 'all',
      perUserLimit: 1,
      active: true,
      ...defaultValues,
    },
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = form;
  const values = watch();

  const onSubmit = async (data: PromotionFormValues) => {
    setSaving(true);
    setSaveError('');
    try {
      if (editId) {
        await apiPatch(`/admin/promotions/${editId}`, toAdminPromotionPayload(data));
      } else {
        await apiPost('/admin/promotions', toAdminPromotionPayload(data));
      }
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      onSuccess?.();
    } catch (err) {
      setSaveError((err as { message?: string }).message || 'Không thể lưu khuyến mãi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Mã khuyến mãi *</Label>
                <Input id="code" placeholder="Ví dụ: WELCOME30" {...register('code')} />
                {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Tên khuyến mãi *</Label>
                <Input id="name" placeholder="Ví dụ: Chào mừng 30K" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea id="description" placeholder="Mô tả ngắn về khuyến mãi" rows={2} {...register('description')} />
              </div>
            </CardContent>
          </Card>

          {/* Discount type */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Loại giảm giá</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="discountType">Loại *</Label>
                <Select
                  value={values.discountType}
                  onValueChange={(v) => setValue('discountType', v as PromotionFormValues['discountType'])}
                >
                  <SelectTrigger id="discountType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(discountTypeLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.discountType && <p className="text-xs text-destructive">{errors.discountType.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountValue">
                  {values.discountType === 'percent' ? 'Phần trăm giảm (%) *' : 'Số tiền (VND) *'}
                </Label>
                <Input id="discountValue" type="number" {...register('discountValue')} />
                {errors.discountValue && <p className="text-xs text-destructive">{errors.discountValue.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxDiscountVnd">Giảm tối đa (VND)</Label>
                <Input id="maxDiscountVnd" type="number" {...register('maxDiscountVnd')} />
              </div>
            </CardContent>
          </Card>

          {/* Conditions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Điều kiện áp dụng</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="minOrderVnd">Đơn tối thiểu (VND)</Label>
                <Input id="minOrderVnd" type="number" {...register('minOrderVnd')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="perUserLimit">Giới hạn/người dùng</Label>
                <Input id="perUserLimit" type="number" {...register('perUserLimit')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxUsage">Tổng lượt dùng (để trống = không giới hạn)</Label>
                <Input id="maxUsage" type="number" {...register('maxUsage')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="audience">Đối tượng *</Label>
                <Select
                  value={values.audience}
                  onValueChange={(v) => setValue('audience', v as PromotionFormValues['audience'])}
                >
                  <SelectTrigger id="audience">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(audienceLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.audience && <p className="text-xs text-destructive">{errors.audience.message}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Timing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thời gian áp dụng</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="validFrom">Từ ngày *</Label>
                <Input id="validFrom" type="date" {...register('validFrom', { valueAsDate: true })} />
                {errors.validFrom && <p className="text-xs text-destructive">{errors.validFrom.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="validUntil">Đến ngày *</Label>
                <Input id="validUntil" type="date" {...register('validUntil', { valueAsDate: true })} />
                {errors.validUntil && <p className="text-xs text-destructive">{errors.validUntil.message}</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Trạng thái</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="active">Kích hoạt ngay</Label>
                <Switch
                  id="active"
                  checked={values.active}
                  onCheckedChange={(v) => setValue('active', v)}
                />
              </div>
            </CardContent>
          </Card>

          <PromotionPreview values={values} />

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? 'Đang lưu...' : editId ? 'Cập nhật khuyến mãi' : 'Tạo khuyến mãi mới'}
          </Button>
          {saveError && <p className="text-sm text-destructive">{saveError}</p>}
        </div>
      </div>
    </form>
  );
}
