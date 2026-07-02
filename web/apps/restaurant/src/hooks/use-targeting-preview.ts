'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  previewTargeting,
  type TargetingPreview,
} from '@/lib/actions/targeting-actions';
import type { PromotionTarget } from '@/lib/types';

interface TargetingPreviewState {
  data: TargetingPreview | null;
  error: boolean;
  isLoading: boolean;
}

export function useTargetingPreview(target: PromotionTarget) {
  const { audience, lastOrderWithinDays, minOrderCount, segmentId } = target;
  const [requestVersion, setRequestVersion] = useState(0);
  const [state, setState] = useState<TargetingPreviewState>({
    data: null,
    error: false,
    isLoading: true,
  });

  useEffect(() => {
    let active = true;
    setState(current => ({ ...current, error: false, isLoading: true }));

    previewTargeting({ audience, lastOrderWithinDays, minOrderCount, segmentId })
      .then(data => {
        if (active) setState({ data, error: false, isLoading: false });
      })
      .catch(() => {
        if (active) setState({ data: null, error: true, isLoading: false });
      });

    return () => {
      active = false;
    };
  }, [
    requestVersion,
    audience,
    lastOrderWithinDays,
    minOrderCount,
    segmentId,
  ]);

  const retry = useCallback(() => setRequestVersion(version => version + 1), []);

  return { ...state, retry };
}
