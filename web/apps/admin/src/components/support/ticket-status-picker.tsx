'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiPatch } from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface TicketStatusPickerProps {
  ticketId: string;
  currentStatus: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: 'Mở', color: 'border-blue-500' },
  in_progress: { label: 'Đang xử lý', color: 'border-orange-500' },
  waiting_customer: { label: 'Chờ khách', color: 'border-yellow-500' },
  resolved: { label: 'Đã giải quyết', color: 'border-green-500' },
  closed: { label: 'Đã đóng', color: 'border-gray-500' },
};

export default function TicketStatusPicker({ ticketId, currentStatus, className }: TicketStatusPickerProps) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState(currentStatus);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');

  const handleChange = async (newStatus: string) => {
    setUpdating(true);
    setUpdateError('');
    setStatus(newStatus);
    try {
      await apiPatch(`/admin/support-tickets/${ticketId}`, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ['support-ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    } catch (err) {
      setStatus(currentStatus);
      setUpdateError((err as { message?: string }).message || 'Không thể cập nhật trạng thái');
    } finally {
      setUpdating(false);
    }
  };

  const config = statusConfig[status] || statusConfig.open;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('h-3 w-3 rounded-full border-2', config.color)} />
      <Select value={status} onValueChange={handleChange} disabled={updating}>
        <SelectTrigger className="h-8 w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(statusConfig).map(([k, v]) => (
            <SelectItem key={k} value={k}>{v.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {updateError && <span className="text-xs text-destructive">{updateError}</span>}
    </div>
  );
}
