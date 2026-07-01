'use client';

import { Users } from 'lucide-react';

interface AudiencePreviewProps {
  estimatedReach: number;
  audienceLabel: string;
}

export function AudiencePreview({ estimatedReach, audienceLabel }: AudiencePreviewProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-brand-50 border border-brand-100 p-3" data-testid="audience-preview">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100">
        <Users className="h-4 w-4 text-brand-600" />
      </div>
      <div>
        <p className="text-sm font-medium text-brand-700">{audienceLabel}</p>
        <p className="text-xs text-brand-600">Ước tính tiếp cận ~{estimatedReach.toLocaleString()} khách hàng</p>
      </div>
    </div>
  );
}
