'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, XCircle, UserCheck, AlertTriangle, Tag, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresValue?: boolean;
}

const bulkActions: BulkAction[] = [
  { id: 'close', label: 'Đóng ticket', icon: XCircle },
  { id: 'assign', label: 'Phân công', icon: UserCheck, requiresValue: true },
  { id: 'change_priority', label: 'Đổi ưu tiên', icon: AlertTriangle, requiresValue: true },
  { id: 'add_tag', label: 'Thêm tag', icon: Tag, requiresValue: true },
  { id: 'export', label: 'Xuất CSV', icon: Download },
];

interface TicketBulkActionsProps {
  selectedIds: string[];
  totalCount: number;
  onClearSelection: () => void;
  onBulkAction: (action: string, value?: string, reason?: string) => Promise<void>;
  className?: string;
}

export default function TicketBulkActions({
  selectedIds,
  totalCount,
  onClearSelection,
  onBulkAction,
  className,
}: TicketBulkActionsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [actionValue, setActionValue] = useState('');
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [bulkError, setBulkError] = useState('');

  if (selectedIds.length === 0) return null;

  const handleExecute = async () => {
    setProcessing(true);
    setBulkError('');
    try {
      await onBulkAction(selectedAction, actionValue || undefined, reason || undefined);
      setDialogOpen(false);
      setSelectedAction('');
      setActionValue('');
      setReason('');
      onClearSelection();
    } catch (err) {
      setBulkError((err as { message?: string }).message || 'Không thể thực hiện thao tác hàng loạt');
    } finally {
      setProcessing(false);
    }
  };

  const action = bulkActions.find((a) => a.id === selectedAction);

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm',
          className
        )}
        data-testid="bulk-actions-bar"
      >
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            Đã chọn {selectedIds.length}/{totalCount} ticket
          </span>
        </div>
        <div className="flex flex-1 items-center gap-2">
          {bulkActions.map((ba) => (
            <Button
              key={ba.id}
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedAction(ba.id);
                setActionValue('');
                setReason('');
                setDialogOpen(true);
              }}
            >
              <ba.icon className="mr-1.5 h-3.5 w-3.5" />
              {ba.label}
            </Button>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          Bỏ chọn
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {action?.label || 'Thao tác hàng loạt'}
            </DialogTitle>
            <DialogDescription>
              Áp dụng cho <Badge variant="secondary">{selectedIds.length} ticket</Badge>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedAction === 'assign' && (
              <div className="space-y-2">
                <Label htmlFor="bulk-assignee">Người xử lý</Label>
                <Select value={actionValue} onValueChange={setActionValue}>
                  <SelectTrigger id="bulk-assignee">
                    <SelectValue placeholder="Chọn người xử lý..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent_1">Nguyễn Văn A</SelectItem>
                    <SelectItem value="agent_2">Trần Thị B</SelectItem>
                    <SelectItem value="agent_pool">Tổ hỗ trợ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedAction === 'change_priority' && (
              <div className="space-y-2">
                <Label htmlFor="bulk-priority">Ưu tiên mới</Label>
                <Select value={actionValue} onValueChange={setActionValue}>
                  <SelectTrigger id="bulk-priority">
                    <SelectValue placeholder="Chọn mức ưu tiên..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Khẩn cấp</SelectItem>
                    <SelectItem value="high">Cao</SelectItem>
                    <SelectItem value="normal">Bình thường</SelectItem>
                    <SelectItem value="low">Thấp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedAction === 'add_tag' && (
              <div className="space-y-2">
                <Label htmlFor="bulk-tag">Tag</Label>
                <Select value={actionValue} onValueChange={setActionValue}>
                  <SelectTrigger id="bulk-tag">
                    <SelectValue placeholder="Chọn tag..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="refund">Hoàn tiền</SelectItem>
                    <SelectItem value="delivery">Giao hàng</SelectItem>
                    <SelectItem value="quality">Chất lượng</SelectItem>
                    <SelectItem value="spam">Spam</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {(selectedAction === 'close' || selectedAction === 'change_priority') && (
              <div className="space-y-2">
                <Label htmlFor="bulk-reason">Lý do (hiển thị trong log)</Label>
                <Textarea
                  id="bulk-reason"
                  placeholder="Nhập lý do thao tác hàng loạt..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                />
              </div>
            )}
          </div>

          {bulkError && <p className="text-sm text-destructive">{bulkError}</p>}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleExecute}
              disabled={processing || (bulkActions.find((a) => a.id === selectedAction)?.requiresValue && !actionValue)}
            >
              {processing ? 'Đang xử lý...' : `Áp dụng cho ${selectedIds.length} ticket`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
