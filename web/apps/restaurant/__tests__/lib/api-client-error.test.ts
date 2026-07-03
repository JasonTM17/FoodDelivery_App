import { ApiClientError, FoodFlowApiClient } from '@foodflow/api-client';
import { describe, expect, it, vi } from 'vitest';

function createClient(body: unknown, status = 400) {
  return new FoodFlowApiClient({
    baseUrl: 'https://api.foodflow.test',
    getAccessToken: () => null,
    getRefreshToken: () => null,
    setTokens: () => undefined,
    clearTokens: () => undefined,
    fetcher: vi.fn().mockResolvedValue(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  });
}

describe('FoodFlowApiClient error parsing', () => {
  it('rejects successful responses that do not use the canonical success envelope', async () => {
    const client = createClient({ id: 'legacy-raw-payload' }, 200);

    await expect(client.request('/legacy-endpoint', { requireAuth: false })).rejects.toMatchObject({
      name: 'ApiClientError',
      status: 200,
      code: 'API_CONTRACT_INVALID_ENVELOPE',
      message: 'Expected FoodFlow API success envelope with success=true and data.',
    } as Partial<ApiClientError>);
  });

  it('preserves RFC 7807 problem details', async () => {
    const client = createClient({
      type: 'about:blank',
      title: 'Bad Request',
      detail: 'Email is invalid',
      status: 400,
      code: 'VALIDATION_ERROR',
      instance: '/api/auth/login',
    });

    await expect(client.request('/auth/login', { requireAuth: false })).rejects.toMatchObject({
      name: 'ApiClientError',
      message: 'Email is invalid',
      status: 400,
      code: 'VALIDATION_ERROR',
    } as Partial<ApiClientError>);
  });

  it('supports the previous nested error envelope during migration', async () => {
    const client = createClient({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password',
        details: { attemptsRemaining: 4 },
      },
    }, 401);

    await expect(client.request('/auth/login', { requireAuth: false })).rejects.toMatchObject({
      name: 'ApiClientError',
      message: 'Invalid email or password',
      status: 401,
      code: 'UNAUTHORIZED',
      problem: { errors: { attemptsRemaining: 4 } },
    } as Partial<ApiClientError>);
  });
});
