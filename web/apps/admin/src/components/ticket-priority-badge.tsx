'use client';

import { cn } from '@/lib/utils';

const priorityStyles: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700 border-gray-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  urgent: 'bg-red-100 text-red-700 border-red-200',
};

const priorityLabels: Record<string, string> = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
  urgent: 'Khẩn cấp',
};

interface TicketPriorityBadgeProps {
  priority: string;
}

export default function TicketPriorityBadge({ priority }: TicketPriorityBadgeProps) {
  const normalized = priority.toLowerCase();
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        priorityStyles[normalized] || 'bg-gray-100 text-gray-700 border-gray-200'
      )}
    >
      {priorityLabels[normalized] || priority}
    </span>
  );
}
