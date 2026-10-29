'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import {
  buildLocationUpdateBody,
  isSampleFresh,
  shouldSendSample,
} from '@/lib/dispatch';
import { isGeolocationSupported, locationStateFromError, type LocationState } from '@/lib/location';

interface TrackerResult {
  state: LocationState;
  lastSentAt: number | null;
  lastError: string | null;
}

/**
 * While `active`, watches the device GPS and posts fresh samples to
 * POST /driver/location, throttled to the backend acceptance window.
 * Never fabricates coordinates — a denied/unavailable permission stops the
 * tracker and surfaces the state.
 */
export function useLocationTracker(active: boolean): TrackerResult {
  const [state, setState] = useState<LocationState>({ status: 'idle' });
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const lastSentRef = useRef<number | null>(null);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      if (watchId.current !== null && isGeolocationSupported()) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      return;
    }
    if (!isGeolocationSupported()) {
      setState({ status: 'unsupported' });
      return;
    }

    setState({ status: 'requesting' });
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const sample = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          bearing: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp,
        };
        setState({ status: 'granted', lat: sample.lat, lng: sample.lng, accuracy: sample.accuracy });
        if (!isSampleFresh(sample.timestamp) || !shouldSendSample(lastSentRef.current)) return;
        lastSentRef.current = Date.now();
        setLastSentAt(lastSentRef.current);
        void api.post('/driver/location', buildLocationUpdateBody(sample)).catch(() => {
          setLastError('Location update was rejected by the server.');
        });
      },
      (error) => {
        setState(locationStateFromError(error));
        watchId.current = null;
      },
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 10_000 },
    );

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, [active]);

  return { state, lastSentAt, lastError };
}
