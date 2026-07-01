'use client';

import {
  FoodFlowApiClient,
  type ApiRequestOptions,
  type PaginationMeta,
  type TokenPair,
} from '@foodflow/api-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface FetchOptions extends Omit<ApiRequestOptions, 'body'> {}

function getStorageValue(key: string): string | null {
  return typeof window === 'undefined' ? null : localStorage.getItem(key);
}

export function setToken(token: string): void {
  localStorage.setItem('restaurant_token', token);
}

function setTokens(tokens: TokenPair): void {
  setToken(tokens.accessToken);
  if (tokens.refreshToken) localStorage.setItem('restaurant_refresh_token', tokens.refreshToken);
}

export function clearToken(): void {
  localStorage.removeItem('restaurant_token');
  localStorage.removeItem('restaurant_refresh_token');
  localStorage.removeItem('restaurant_data');
}

export interface StoredRestaurant {
  id?: string;
  name?: string;
  [key: string]: unknown;
}

export function getStoredRestaurant(): StoredRestaurant | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem('restaurant_data');
  if (!data) return null;
  try {
    return JSON.parse(data) as StoredRestaurant;
  } catch {
    localStorage.removeItem('restaurant_data');
    return null;
  }
}

export function setStoredRestaurant(data: unknown): void {
  localStorage.setItem('restaurant_data', JSON.stringify(data));
}

export function isAuthenticated(): boolean {
  return Boolean(getStorageValue('restaurant_token'));
}

function redirectToLocalizedLogin(): void {
  if (typeof window === 'undefined') return;
  const locale = window.location.pathname.match(/^\/(vi|en|ja)(?:\/|$)/)?.[1] ?? 'vi';
  window.location.assign(`/${locale}/login`);
}

const client = new FoodFlowApiClient({
  baseUrl: API_URL,
  getAccessToken: () => getStorageValue('restaurant_token'),
  getRefreshToken: () => getStorageValue('restaurant_refresh_token'),
  setTokens,
  clearTokens: clearToken,
  onUnauthorized: redirectToLocalizedLogin,
});

export function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  return client.request<T>(endpoint, options);
}

export function apiFetchEnvelope<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<{ data: T; meta?: PaginationMeta }> {
  return client.requestEnvelope<T>(endpoint, options);
}

export const api = {
  get: <T>(endpoint: string, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'GET' }),

  getEnvelope: <T>(endpoint: string, options?: FetchOptions) =>
    apiFetchEnvelope<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    client.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body as ApiRequestOptions['body'],
    }),

  put: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    client.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body as ApiRequestOptions['body'],
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    client.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body as ApiRequestOptions['body'],
    }),

  delete: <T>(endpoint: string, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'DELETE' }),

  download: (endpoint: string, options?: FetchOptions) =>
    client.requestBlob(endpoint, { ...options, method: 'GET' }),
};
