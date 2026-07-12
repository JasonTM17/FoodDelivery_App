'use client';

import type { AiSuggestion, AiSuggestionParams, SuggestionType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Lightbulb, TrendingUp, AlertTriangle, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';

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

export function AiSuggestionCard({ suggestion, onApply, onDismiss, loading }: AiSuggestionCardProps) {
  const t = useTranslations('insights.suggestions');
  const values = suggestion.params ?? {};
  const title = t(suggestion.titleKey, toTranslationValues(values));
  const description = t(suggestion.descriptionKey, toTranslationValues(values));
  const predictedImpact = t(suggestion.predictedImpactKey, toTranslationValues(values));

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
              <span className="text-xs uppercase text-gray-600">{t(`types.${suggestion.type}`)}</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mt-0.5">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
            {predictedImpact && (
              <p className="mt-1.5 text-xs font-medium text-green-700">{predictedImpact}</p>
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
              {t('apply')}
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="btn-ghost text-xs text-gray-500"
            >
              {t('dismiss')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function toTranslationValues(values: AiSuggestionParams): Record<string, string | number | Date> {
  return Object.fromEntries(
    Object.entries(values).filter((entry): entry is [string, string | number] => {
      const value = entry[1];
      return typeof value === 'string' || typeof value === 'number';
    }),
  );
}
