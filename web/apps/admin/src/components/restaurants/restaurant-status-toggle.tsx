'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiPatch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Pause, Play, Trash2 } from 'lucide-react';

interface RestaurantStatusToggleProps {
  restaurantId: string;
  currentStatus: string;
  restaurantName: string;
}

export default function RestaurantStatusToggle({
  restaurantId,
  currentStatus,
  restaurantName,
}: RestaurantStatusToggleProps) {
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [action, setAction] = useState<'pause' | 'activate' | 'delete'>('pause');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const openConfirm = (a: 'pause' | 'activate' | 'delete') => {
    setAction(a);
    setReason('');
    setConfirmOpen(true);
  };

  const executeAction = async () => {
    setLoading(true);
    setActionError('');
    try {
      if (action === 'delete') {
        await apiPatch(`/admin/restaurants/${restaurantId}/status`, {
          status: 'deleted',
          reason,
        });
      } else {
        const newStatus = action === 'activate' ? 'active' : 'disabled';
        await apiPatch(`/admin/restaurants/${restaurantId}/status`, {
          status: newStatus,
          reason,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['restaurant', restaurantId] });
      setConfirmOpen(false);
    } catch (err) {
      setActionError((err as { message?: string }).message || 'Không thể cập nhật trạng thái nhà hàng');
    } finally {
      setLoading(false);
    }
  };

  const actionLabels: Record<string, { title: string; desc: string; icon: typeof Pause }> = {
    pause: { title: `Tạm dừng ${restaurantName}?`, desc: 'Nhà hàng sẽ không nhận đơn hàng mới và bị ẩn khỏi tìm kiếm.', icon: Pause },
    activate: { title: `Kích hoạt lại ${restaurantName}?`, desc: 'Nhà hàng sẽ xuất hiện trở lại và nhận đơn hàng mới.', icon: Play },
    delete: { title: `Xóa ${restaurantName}?`, desc: 'Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan sẽ bị ẩn.', icon: Trash2 },
  };

  const labels = actionLabels[action];
  const Icon = labels.icon;

  return (
    <>
      <div className="flex items-center gap-2">
        {currentStatus === 'active' ? (
          <Button variant="outline" size="sm" onClick={() => openConfirm('pause')}>
            <Pause className="mr-1.5 h-4 w-4" /> Tạm dừng
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => openConfirm('activate')}>
            <Play className="mr-1.5 h-4 w-4" /> Kích hoạt lại
          </Button>
        )}
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => openConfirm('delete')}>
          <Trash2 className="mr-1.5 h-4 w-4" /> Xóa
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-destructive" />
              {labels.title}
            </DialogTitle>
            <DialogDescription>{labels.desc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Lý do (tùy chọn)</label>
            <Textarea
              placeholder="Nhập lý do..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>
          {actionError && <p className="text-sm text-destructive">{actionError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Hủy</Button>
            <Button variant={action === 'delete' ? 'destructive' : 'default'} onClick={executeAction} disabled={loading}>
              {loading ? 'Đang xử lý...' : action === 'pause' ? 'Tạm dừng' : action === 'activate' ? 'Kích hoạt' : 'Xóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
