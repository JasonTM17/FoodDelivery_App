export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
}

export type LocationErrorKind = 'denied' | 'unavailable' | 'timeout' | 'unsupported';

export class GeoError extends Error {
  readonly kind: LocationErrorKind;

  constructor(kind: LocationErrorKind, message: string) {
    super(message);
    this.name = 'GeoError';
    this.kind = kind;
  }
}

/** UI-facing state machine for geolocation permission/result. */
export type LocationState =
  | { status: 'idle' }
  | { status: 'requesting' }
  | ({ status: 'granted' } & Pick<GeoPosition, 'lat' | 'lng' | 'accuracy'>)
  | { status: 'denied' }
  | { status: 'unavailable' }
  | { status: 'timeout' }
  | { status: 'unsupported' };

export function locationStateFromError(error: unknown): LocationState {
  if (error instanceof GeoError) return { status: error.kind };
  const code = (error as GeolocationPositionError | undefined)?.code;
  switch (code) {
    case 1:
      return { status: 'denied' };
    case 3:
      return { status: 'timeout' };
    default:
      return { status: 'unavailable' };
  }
}

export function isGeolocationSupported(): boolean {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator;
}

function mapError(error: GeolocationPositionError): GeoError {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return new GeoError('denied', 'Location permission was denied');
    case error.POSITION_UNAVAILABLE:
      return new GeoError('unavailable', 'Location is unavailable');
    case error.TIMEOUT:
      return new GeoError('timeout', 'Location request timed out');
    default:
      return new GeoError('unavailable', 'Location is unavailable');
  }
}

export function getCurrentPosition(options?: PositionOptions): Promise<GeoPosition> {
  if (!isGeolocationSupported()) {
    return Promise.reject(new GeoError('unsupported', 'Geolocation is not supported by this browser'));
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      (error) => reject(mapError(error)),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 10_000, ...options },
    );
  });
}

/**
 * Resolves with real coordinates or rejects with a typed LocationState —
 * never fabricates a position.
 */
export function getCurrentLocation(options?: PositionOptions): Promise<GeoPosition> {
  return getCurrentPosition(options).catch((error: unknown) =>
    Promise.reject(locationStateFromError(error)),
  );
}

/** Vietnam delivery bounds enforced by the backend; used for client pre-checks. */
export const VIETNAM_DELIVERY_BOUNDS = {
  minLat: 8.0,
  maxLat: 23.5,
  minLng: 102.0,
  maxLng: 110.0,
} as const;

export function isWithinVietnamBounds(lat: number, lng: number): boolean {
  return (
    lat >= VIETNAM_DELIVERY_BOUNDS.minLat &&
    lat <= VIETNAM_DELIVERY_BOUNDS.maxLat &&
    lng >= VIETNAM_DELIVERY_BOUNDS.minLng &&
    lng <= VIETNAM_DELIVERY_BOUNDS.maxLng
  );
}
