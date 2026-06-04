import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format as dateFormat, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

export function formatTimeAgo(dateString: string): string {
  try {
    return formatDistanceToNow(parseISO(dateString), {
      addSuffix: true,
      locale: vi,
    });
  } catch {
    return 'Không rõ';
  }
}

export function formatDateTime(dateString: string): string {
  try {
    return dateFormat(parseISO(dateString), 'HH:mm - dd/MM/yyyy');
  } catch {
    return 'Không rõ';
  }
}

export function formatTime(dateString: string): string {
  try {
    return dateFormat(parseISO(dateString), 'HH:mm');
  } catch {
    return 'Không rõ';
  }
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  preparing: 'Đang chuẩn bị',
  ready: 'Sẵn sàng',
  delivering: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
  rejected: 'Từ chối',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-red-100 text-red-800 border-red-200',
  confirmed: 'bg-orange-100 text-orange-800 border-orange-200',
  preparing: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ready: 'bg-green-100 text-green-800 border-green-200',
  delivering: 'bg-blue-100 text-blue-800 border-blue-200',
  delivered: 'bg-gray-100 text-gray-800 border-gray-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
};

export function getStatusColor(status: string): string {
  return ORDER_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}
