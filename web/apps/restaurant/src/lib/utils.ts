import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format as dateFormat, parseISO } from 'date-fns';
import { enUS, ja, vi } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, locale = 'vi-VN'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

export function formatCompactCurrency(amount: number, locale = 'vi-VN'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'VND',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
}

export function formatLocalDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function resolveDateFnsLocale(locale?: string) {
  if (locale?.startsWith('ja')) return ja;
  if (locale?.startsWith('vi')) return vi;
  return enUS;
}

export function formatTimeAgo(dateString: string, locale?: string, fallback = '\u2014'): string {
  try {
    return formatDistanceToNow(parseISO(dateString), {
      addSuffix: true,
      locale: resolveDateFnsLocale(locale),
    });
  } catch {
    return fallback;
  }
}

export function formatDateTime(dateString: string, fallback = '\u2014'): string {
  try {
    return dateFormat(parseISO(dateString), 'HH:mm - dd/MM/yyyy');
  } catch {
    return fallback;
  }
}

export function formatTime(dateString: string, fallback = '\u2014'): string {
  try {
    return dateFormat(parseISO(dateString), 'HH:mm');
  } catch {
    return fallback;
  }
}

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
