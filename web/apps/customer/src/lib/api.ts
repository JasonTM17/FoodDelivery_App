'use client';

import {
  ApiClientError,
  FoodFlowApiClient,
  type ApiRequestOptions,
  type PaginationMeta,
  type TokenPair,
} from '@foodflow/api-client';
import { resolveApiBaseUrl } from '@/lib/api-base-url';

export const CUSTOMER_TOKEN_KEY = 'customer_token';
export const CUSTOMER_REFRESH_KEY = 'customer_refresh_token';

interface FetchOptions extends Omit<ApiRequestOptions, 'body'> {}

export function pageFromEnvelope<T>(envelope: { data: T[]; meta?: PaginationMeta }) {
  return { items: envelope.data, total: envelope.meta?.total ?? envelope.data.length,
    page: envelope.meta?.page ?? 1, limit: envelope.meta?.limit ?? envelope.data.length };
}

function getStorageValue(key: string): string | null {
  return typeof window === 'undefined' ? null : localStorage.getItem(key);
}

export function setToken(token: string): void {
  localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
}

function setTokens(tokens: TokenPair): void {
  setToken(tokens.accessToken);
  if (tokens.refreshToken) localStorage.setItem(CUSTOMER_REFRESH_KEY, tokens.refreshToken);
}

export function getAccessToken(): string | null {
  return getStorageValue(CUSTOMER_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return getStorageValue(CUSTOMER_REFRESH_KEY);
}

/**
 * Tokens live in localStorage (not HttpOnly cookies), so clearing must wipe
 * every session key on logout / unauthorized.
 */
export function clearToken(): void {
  localStorage.removeItem(CUSTOMER_TOKEN_KEY);
  localStorage.removeItem(CUSTOMER_REFRESH_KEY);
}

function redirectToLogin(): void {
  if (typeof window === 'undefined') return;
  if (window.location.pathname.startsWith('/login')) return;
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.assign(`/login?next=${next}`);
}

// Constructed lazily so module import never resolves env — prerendering
// during `next build` must not require NEXT_PUBLIC_API_URL; a real request
// in production without it still throws inside resolveApiBaseUrl.
let client: FoodFlowApiClient | null = null;

function getClient(): FoodFlowApiClient {
  if (!client) {
    client = new FoodFlowApiClient({
      baseUrl: resolveApiBaseUrl(),
      getAccessToken,
      getRefreshToken,
      setTokens,
      clearTokens: clearToken,
      onUnauthorized: redirectToLogin,
    });
  }
  return client;
}

export function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  return getClient().request<T>(endpoint, options);
}

export function apiFetchEnvelope<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<{ data: T; meta?: PaginationMeta }> {
  return getClient().requestEnvelope<T>(endpoint, options);
}

export const api = {
  getPage: async <T>(endpoint: string, options?: FetchOptions) =>
    pageFromEnvelope(await apiFetchEnvelope<T[]>(endpoint, { ...options, method: 'GET' })),
  get: <T>(endpoint: string, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'GET' }),

  getEnvelope: <T>(endpoint: string, options?: FetchOptions) =>
    apiFetchEnvelope<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    getClient().request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body as ApiRequestOptions['body'],
    }),

  put: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    getClient().request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body as ApiRequestOptions['body'],
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    getClient().request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body as ApiRequestOptions['body'],
    }),

  delete: <T>(endpoint: string, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'DELETE' }),
};

export { ApiClientError };
