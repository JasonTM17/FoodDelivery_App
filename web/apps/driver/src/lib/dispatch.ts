import type { DispatchOffer } from '@/lib/types';

export interface NormalizedOffer extends DispatchOffer {
  orderId: string;
  offerToken: string;
  receivedAt: number;
  expiresAt: number;
}

const DEFAULT_OFFER_TTL_SECONDS = 30;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toNumber(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Parses a realtime `driver:new_order` payload. Returns null when the payload
 * lacks the orderId/offerToken required by the REST respond endpoint — such
 * offers cannot be actioned and must not be shown as live work.
 */
export function parseDispatchOffer(payload: unknown, now = Date.now()): NormalizedOffer | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;
  const orderId = typeof record.orderId === 'string' ? record.orderId : null;
  const offerToken = typeof record.offerToken === 'string' ? record.offerToken : null;
  if (!orderId || !offerToken || !UUID_RE.test(offerToken)) return null;

  const timeoutSeconds = toNumber(record.timeoutSeconds) ?? DEFAULT_OFFER_TTL_SECONDS;
  return {
    orderId,
    offerToken,
    restaurantName: typeof record.restaurantName === 'string' ? record.restaurantName : undefined,
    restaurantAddress:
      typeof record.restaurantAddress === 'string' ? record.restaurantAddress : undefined,
    deliveryAddress:
      typeof record.deliveryAddress === 'string' ? record.deliveryAddress : undefined,
    orderTotal: toNumber(record.orderTotal),
    deliveryFee: toNumber(record.deliveryFee),
    distanceKm: toNumber(record.distanceKm),
    timeoutSeconds,
    surgeMultiplier: toNumber(record.surgeMultiplier),
    receivedAt: now,
    expiresAt: now + timeoutSeconds * 1000,
  };
}

/** Remaining validity of an offer in whole seconds (>= 0). */
export function offerSecondsRemaining(offer: NormalizedOffer, now = Date.now()): number {
  return Math.max(0, Math.ceil((offer.expiresAt - now) / 1000));
}

export function isOfferExpired(offer: NormalizedOffer, now = Date.now()): boolean {
  return offer.expiresAt <= now;
}

/** Body for POST /driver/dispatch/offers/:orderId/respond. */
export function buildOfferResponseBody(
  offerToken: string,
  decision: 'accept' | 'reject',
): { offerToken: string; decision: 'accept' | 'reject' } {
  return { offerToken, decision };
}

export function offerResponsePath(orderId: string): string {
  return `/driver/dispatch/offers/${orderId}/respond`;
}

/** Body for POST /driver/online — fresh client-side sample timestamp. */
export function buildGoOnlineBody(position: {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
}): { lat: number; lng: number; sampledAt: string; accuracy?: number } {
  const sampledAt = new Date(position.timestamp ?? Date.now()).toISOString();
  const body: { lat: number; lng: number; sampledAt: string; accuracy?: number } = {
    lat: position.lat,
    lng: position.lng,
    sampledAt,
  };
  if (position.accuracy != null && Number.isFinite(position.accuracy)) {
    body.accuracy = Math.min(Math.max(0, position.accuracy), 25);
  }
  return body;
}

/** Body for POST /driver/location — always stamps the sample time client-side. */
export function buildLocationUpdateBody(position: {
  lat: number;
  lng: number;
  bearing?: number | null;
  speed?: number | null;
  accuracy?: number;
  timestamp?: number;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    lat: position.lat,
    lng: position.lng,
    timestamp: new Date(position.timestamp ?? Date.now()).toISOString(),
  };
  if (position.bearing != null && Number.isFinite(position.bearing)) body.bearing = position.bearing;
  if (position.speed != null && Number.isFinite(position.speed)) body.speed = position.speed;
  if (position.accuracy != null && Number.isFinite(position.accuracy))
    body.accuracy = position.accuracy;
  return body;
}

/** Minimum interval between POST /driver/location samples while online. */
export const LOCATION_SAMPLE_MIN_INTERVAL_MS = 10_000;
/** Ignore samples older than this — the backend rejects stale timestamps. */
export const LOCATION_MAX_AGE_MS = 30_000;

export function isSampleFresh(timestamp: number, now = Date.now()): boolean {
  return Number.isFinite(timestamp) && now - timestamp <= LOCATION_MAX_AGE_MS;
}

export function shouldSendSample(lastSentAt: number | null, now = Date.now()): boolean {
  return lastSentAt === null || now - lastSentAt >= LOCATION_SAMPLE_MIN_INTERVAL_MS;
}
