import { describe, expect, it } from 'vitest';
import {
  buildGoOnlineBody,
  buildLocationUpdateBody,
  buildOfferResponseBody,
  isOfferExpired,
  isSampleFresh,
  offerResponsePath,
  offerSecondsRemaining,
  parseDispatchOffer,
  shouldSendSample,
  LOCATION_SAMPLE_MIN_INTERVAL_MS,
  LOCATION_MAX_AGE_MS,
} from '@/lib/dispatch';

// Deterministic UUID fixture; never an issued dispatch credential.
const VALID_TOKEN = '00000000-0000-4000-8000-000000000001';

function offerPayload(overrides: Record<string, unknown> = {}) {
  return {
    orderId: 'order-1',
    offerToken: VALID_TOKEN,
    restaurantName: 'Pho 24',
    restaurantAddress: '10 Le Loi',
    deliveryAddress: '22 Nguyen Hue',
    orderTotal: 120000,
    deliveryFee: 25000,
    distanceKm: 1.8,
    timeoutSeconds: 30,
    ...overrides,
  };
}

describe('parseDispatchOffer', () => {
  it('parses a valid realtime offer and computes expiry', () => {
    const now = 1_000_000;
    const offer = parseDispatchOffer(offerPayload(), now);
    expect(offer).not.toBeNull();
    expect(offer!.orderId).toBe('order-1');
    expect(offer!.offerToken).toBe(VALID_TOKEN);
    expect(offer!.expiresAt).toBe(now + 30_000);
    expect(offer!.restaurantName).toBe('Pho 24');
  });

  it('rejects payloads without a usable offer token', () => {
    expect(parseDispatchOffer(offerPayload({ offerToken: 'not-a-uuid' }))).toBeNull();
    expect(parseDispatchOffer(offerPayload({ offerToken: undefined }))).toBeNull();
    expect(parseDispatchOffer(offerPayload({ orderId: undefined }))).toBeNull();
    expect(parseDispatchOffer(null)).toBeNull();
    expect(parseDispatchOffer('driver:new_order')).toBeNull();
  });

  it('defaults the timeout when the payload omits it', () => {
    const now = 1_000_000;
    const offer = parseDispatchOffer(offerPayload({ timeoutSeconds: undefined }), now);
    expect(offer!.expiresAt).toBe(now + 30_000);
  });
});

describe('offer expiry', () => {
  it('counts down and expires', () => {
    const now = 1_000_000;
    const offer = parseDispatchOffer(offerPayload({ timeoutSeconds: 10 }), now)!;
    expect(offerSecondsRemaining(offer, now)).toBe(10);
    expect(offerSecondsRemaining(offer, now + 9_500)).toBe(1);
    expect(isOfferExpired(offer, now + 9_500)).toBe(false);
    expect(isOfferExpired(offer, now + 10_000)).toBe(true);
    expect(offerSecondsRemaining(offer, now + 11_000)).toBe(0);
  });
});

describe('buildOfferResponseBody / offerResponsePath', () => {
  it('builds the REST respond contract', () => {
    expect(offerResponsePath('order-9')).toBe('/driver/dispatch/offers/order-9/respond');
    expect(buildOfferResponseBody(VALID_TOKEN, 'accept')).toEqual({
      offerToken: VALID_TOKEN,
      decision: 'accept',
    });
    expect(buildOfferResponseBody(VALID_TOKEN, 'reject').decision).toBe('reject');
  });
});

describe('location bodies', () => {
  it('builds a fresh sampledAt for go-online', () => {
    const body = buildGoOnlineBody({ lat: 10.8, lng: 106.7, accuracy: 5, timestamp: 1700000000000 });
    expect(body).toEqual({
      lat: 10.8,
      lng: 106.7,
      accuracy: 5,
      sampledAt: new Date(1700000000000).toISOString(),
    });
  });

  it('builds a location update with optional fields omitted when absent', () => {
    const body = buildLocationUpdateBody({ lat: 10.8, lng: 106.7, timestamp: 1700000000000 });
    expect(body).toEqual({
      lat: 10.8,
      lng: 106.7,
      timestamp: new Date(1700000000000).toISOString(),
    });
    const full = buildLocationUpdateBody({
      lat: 10.8,
      lng: 106.7,
      bearing: 90,
      speed: 8,
      accuracy: 4,
      timestamp: 1700000000000,
    });
    expect(full.bearing).toBe(90);
    expect(full.speed).toBe(8);
    expect(full.accuracy).toBe(4);
  });
});

describe('sample freshness and throttling', () => {
  it('rejects samples older than the backend acceptance window', () => {
    const now = 1_000_000;
    expect(isSampleFresh(now, now)).toBe(true);
    expect(isSampleFresh(now - LOCATION_MAX_AGE_MS - 1, now)).toBe(false);
    expect(isSampleFresh(NaN, now)).toBe(false);
  });

  it('throttles sends to the minimum interval', () => {
    const t0 = 1_000_000;
    expect(shouldSendSample(null, t0)).toBe(true);
    expect(shouldSendSample(t0, t0 + LOCATION_SAMPLE_MIN_INTERVAL_MS - 1)).toBe(false);
    expect(shouldSendSample(t0, t0 + LOCATION_SAMPLE_MIN_INTERVAL_MS)).toBe(true);
  });
});
