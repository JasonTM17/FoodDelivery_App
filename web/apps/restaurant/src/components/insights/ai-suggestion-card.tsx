'use client';

import type { AiSuggestion, SuggestionType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Lightbulb, TrendingDown, TrendingUp, AlertTriangle, Star } from 'lucide-react';

interface AiSuggestionCardProps {
  suggestion: AiSuggestion;
  onApply?: () => void;
  onDismiss?: () => void;
  loading?: boolean;
}

const TYPE_ICONS: Record<SuggestionType, React.ReactNode> = {
  pricing: <TrendingUp className="h-5 w-5" />,
  menu_mix: <Star className="h-5 w-5" />,
  marketing: <Lightbulb className="h-5 w-5" />,
  operations: <AlertTriangle className="h-5 w-5" />,
};

const TYPE_LABELS: Record<SuggestionType, string> = {
  pricing: 'Định giá',
  menu_mix: 'Thực đơn',
  marketing: 'Marketing',
  operations: 'Vận hành',
};

export function AiSuggestionCard({ suggestion, onApply, onDismiss, loading }: AiSuggestionCardProps) {
  return (
    <div className="card space-y-3" data-testid="ai-suggestion-card">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg shrink-0',
            suggestion.type === 'pricing' ? 'bg-blue-100 text-blue-600' :
            suggestion.type === 'menu_mix' ? 'bg-purple-100 text-purple-600' :
            suggestion.type === 'marketing' ? 'bg-amber-100 text-amber-600' :
            'bg-red-100 text-red-600'
          )}>
            {TYPE_ICONS[suggestion.type]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 uppercase">{TYPE_LABELS[suggestion.type]}</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mt-0.5">{suggestion.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
            {suggestion.predictedImpact && (
              <p className="text-xs text-green-600 mt-1.5 font-medium">{suggestion.predictedImpact}</p>
            )}
          </div>
        </div>
      </div>

      {suggestion.actionable && (
        <div className="flex items-center gap-2 pt-2">
          {onApply && (
            <button
              type="button"
              onClick={onApply}
              disabled={loading}
              className="btn-primary text-xs py-1.5 disabled:opacity-50"
            >
              Áp dụng
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="btn-ghost text-xs text-gray-500"
            >
              Bỏ qua
            </button>
          )}
        </div>
      )}
    </div>
  );
}
