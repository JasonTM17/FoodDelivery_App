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
