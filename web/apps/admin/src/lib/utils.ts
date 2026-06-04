import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', {
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function timeSince(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s trước`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}ph trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'confirmed':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'preparing':
      return 'bg-indigo-100 text-indigo-800 border-indigo-300';
    case 'delivering':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'delivered':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'active':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'disabled':
      return 'bg-gray-100 text-gray-800 border-gray-300';
    case 'online':
    case 'free':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'busy':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'open':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'in_progress':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'resolved':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'closed':
      return 'bg-gray-100 text-gray-800 border-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}
