'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Breadcrumb } from '@foodflow/ui/breadcrumb';
import { EmptyState } from '@foodflow/ui/empty-state';
import { PageHeader } from '@foodflow/ui/page-header';
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
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Percent, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Promotion {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrder: number;
  maxDiscount: number;
  usageCount: number;
  usageLimit: number;
  startDate: string;
  endDate: string;
  active: boolean;
  description: string;
}

interface PromotionsResponse {
  promotions: Promotion[];
}

export default function PromotionsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage',
    value: '',
    minOrder: '',
    maxDiscount: '',
    usageLimit: '',
    startDate: '',
    endDate: '',
    description: '',
    active: true,
  });
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery<PromotionsResponse>({
    queryKey: ['promotions'],
    queryFn: () => apiGet<PromotionsResponse>('/admin/promotions'),
  });

  const openCreateDialog = () => {
    setEditingPromotion(null);
    setFormData({
      code: '',
      type: 'percentage',
      value: '',
      minOrder: '',
      maxDiscount: '',
      usageLimit: '',
      startDate: '',
      endDate: '',
      description: '',
      active: true,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      code: promotion.code,
      type: promotion.type,
      value: String(promotion.value),
      minOrder: String(promotion.minOrder || ''),
      maxDiscount: String(promotion.maxDiscount || ''),
      usageLimit: String(promotion.usageLimit || ''),
      startDate: promotion.startDate?.split('T')[0] || '',
      endDate: promotion.endDate?.split('T')[0] || '',
      description: promotion.description || '',
      active: promotion.active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        code: formData.code,
        type: formData.type,
        value: Number(formData.value),
        minOrder: formData.minOrder ? Number(formData.minOrder) : 0,
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : 0,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : 0,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        description: formData.description,
        active: formData.active,
      };

      if (editingPromotion) {
        await apiPut(`/admin/promotions/${editingPromotion.id}`, payload);
      } else {
        await apiPost('/admin/promotions', payload);
      }

      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      setDialogOpen(false);
    } catch (err) {
      console.error('Failed to save promotion:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (promotionId: string) => {
    if (!confirm('Xóa khuyến mãi này?')) return;
    try {
      await apiDelete(`/admin/promotions/${promotionId}`);
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
    } catch (err) {
      console.error('Failed to delete promotion:', err);
    }
  };

  const toggleActive = async (promotion: Promotion) => {
    await apiPut(`/admin/promotions/${promotion.id}`, { active: !promotion.active });
    queryClient.invalidateQueries({ queryKey: ['promotions'] });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[{ label: 'Admin' }, { label: 'Khuyến mãi' }]}
        title="Khuyến mãi"
        description="Quản lý mã khuyến mãi và ưu đãi"
        actions={
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Tạo khuyến mãi
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Mã khuyến mãi</CardTitle>
          <CardDescription>
            {data ? `${data.promotions.length} mã khuyến mãi` : 'Đang tải...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : data && data.promotions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Giá trị</TableHead>
                  <TableHead>Đã dùng / Giới hạn</TableHead>
                  <TableHead>Hạn sử dụng</TableHead>
                  <TableHead>Kích hoạt</TableHead>
                  <TableHead className="w-24 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.promotions.map((promo) => (
                  <TableRow key={promo.id}>
                    <TableCell className="font-mono font-medium">{promo.code}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        {promo.type === 'percentage' ? (
                          <Percent className="h-3 w-3" />
                        ) : (
                          <DollarSign className="h-3 w-3" />
                        )}
                        {promo.type === 'percentage' ? 'Phần trăm' : 'Cố định'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {promo.type === 'percentage'
                        ? `${promo.value}%`
                        : formatCurrency(promo.value)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {promo.usageCount}
                        {promo.usageLimit > 0 ? ` / ${promo.usageLimit}` : ' / &infin;'}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {promo.endDate ? formatDate(promo.endDate) : 'Không có'}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={promo.active}
                        onCheckedChange={() => toggleActive(promo)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(promo)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(promo.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={Percent}
              title="Chưa có mã khuyến mãi nào"
              description="Tạo mã khuyến mãi để thu hút khách hàng"
              actionLabel="Tạo khuyến mãi"
              onAction={openCreateDialog}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPromotion ? 'Chỉnh sửa khuyến mãi' : 'Tạo khuyến mãi mới'}
            </DialogTitle>
            <DialogDescription>
              {editingPromotion
                ? 'Cập nhật thông tin mã khuyến mãi'
                : 'Thêm mã khuyến mãi mới vào hệ thống'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Mã khuyến mãi</Label>
                <Input
                  id="code"
                  placeholder="WELCOME10"
                  value={formData.code}
                  onChange={(e) => setFormData((f) => ({ ...f, code: e.target.value }))}
                  disabled={!!editingPromotion}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Loại</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData((f) => ({ ...f, type: v }))}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Phần trăm</SelectItem>
                    <SelectItem value="fixed">Cố định</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value">
                  {formData.type === 'percentage' ? 'Phần trăm giảm' : 'Số tiền giảm'}
                </Label>
                <Input
                  id="value"
                  type="number"
                  placeholder={formData.type === 'percentage' ? '10' : '50000'}
                  value={formData.value}
                  onChange={(e) => setFormData((f) => ({ ...f, value: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minOrder">Đơn tối thiểu</Label>
                <Input
                  id="minOrder"
                  type="number"
                  placeholder="0"
                  value={formData.minOrder}
                  onChange={(e) => setFormData((f) => ({ ...f, minOrder: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxDiscount">Giảm tối đa</Label>
                <Input
                  id="maxDiscount"
                  type="number"
                  placeholder="0"
                  value={formData.maxDiscount}
                  onChange={(e) => setFormData((f) => ({ ...f, maxDiscount: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="usageLimit">Giới hạn lượt dùng</Label>
                <Input
                  id="usageLimit"
                  type="number"
                  placeholder="0 = không giới hạn"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData((f) => ({ ...f, usageLimit: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Ngày bắt đầu</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Ngày kết thúc</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData((f) => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                placeholder="Mô tả ngắn về khuyến mãi"
                value={formData.description}
                onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Đang lưu...' : editingPromotion ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
