import { describe, expect, it, vi } from 'vitest';
import { FoodFlowApiClient } from '@foodflow/api-client';

describe('FoodFlowApiClient blob authentication', () => {
  it('retries a blob request with the newly refreshed access token', async () => {
    let accessToken = 'expired-token';
    const setTokens = vi.fn(tokens => { accessToken = tokens.accessToken; });
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const authorization = new Headers(init?.headers).get('Authorization');

      if (url.endsWith('/auth/refresh')) {
        return Response.json({ success: true, data: { accessToken: 'fresh-token' } });
      }
      if (authorization === 'Bearer expired-token') {
        return Response.json({ title: 'Unauthorized', status: 401 }, { status: 401 });
      }
      return new Response('audit,csv', { status: 200, headers: { 'Content-Type': 'text/csv' } });
    });
    const client = new FoodFlowApiClient({
      baseUrl: 'https://api.foodflow.test',
      getAccessToken: () => accessToken,
      getRefreshToken: () => 'refresh-token',
      setTokens,
      clearTokens: vi.fn(),
      fetcher: fetcher as typeof fetch,
    });

    const blob = await client.requestBlob('/admin/audit-logs/export');

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('text/csv');
    expect(blob.size).toBe(9);
    expect(setTokens).toHaveBeenCalledWith({ accessToken: 'fresh-token' });
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(new Headers(fetcher.mock.calls[2]?.[1]?.headers).get('Authorization'))
      .toBe('Bearer fresh-token');
  });

  it('clears the session when a blob request cannot refresh', async () => {
    const clearTokens = vi.fn();
    const onUnauthorized = vi.fn();
    const fetcher = vi.fn(async () => (
      Response.json({ title: 'Unauthorized', status: 401 }, { status: 401 })
    ));
    const client = new FoodFlowApiClient({
      baseUrl: 'https://api.foodflow.test',
      getAccessToken: () => 'expired-token',
      getRefreshToken: () => 'invalid-refresh-token',
      setTokens: vi.fn(),
      clearTokens,
      onUnauthorized,
      fetcher: fetcher as typeof fetch,
    });

    await expect(client.requestBlob('/admin/audit-logs/export')).rejects.toMatchObject({
      code: 'AUTH_SESSION_EXPIRED',
      status: 401,
    });
    expect(clearTokens).toHaveBeenCalledTimes(1);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
