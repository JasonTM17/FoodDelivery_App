import {
  FoodFlowApiClient,
  type ApiRequestOptions,
  type PaginationMeta,
  type TokenPair,
} from '@foodflow/api-client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ApiOptions extends Omit<ApiRequestOptions, 'body'> {}

function getStorageValue(key: string): string | null {
  return typeof window === 'undefined' ? null : localStorage.getItem(key);
}

function setTokens(tokens: TokenPair): void {
  localStorage.setItem('admin_token', tokens.accessToken);
  if (tokens.refreshToken) localStorage.setItem('admin_refresh_token', tokens.refreshToken);
}

function clearTokens(): void {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_refresh_token');
  localStorage.removeItem('admin_user');
}

function redirectToLocalizedLogin(): void {
  if (typeof window === 'undefined') return;
  const locale = window.location.pathname.match(/^\/(vi|en|ja)(?:\/|$)/)?.[1] ?? 'vi';
  window.location.assign(`/${locale}/login`);
}

const client = new FoodFlowApiClient({
  baseUrl: API_BASE,
  getAccessToken: () => getStorageValue('admin_token'),
  getRefreshToken: () => getStorageValue('admin_refresh_token'),
  setTokens,
  clearTokens,
  onUnauthorized: redirectToLocalizedLogin,
});

export function apiGet<T>(path: string, options?: ApiOptions): Promise<T> {
  return client.request<T>(path, { ...options, method: 'GET' });
}

export function apiGetEnvelope<T>(
  path: string,
  options?: ApiOptions,
): Promise<{ data: T; meta?: PaginationMeta }> {
  return client.requestEnvelope<T>(path, { ...options, method: 'GET' });
}

export function apiPost<T>(path: string, body?: unknown, options?: ApiOptions): Promise<T> {
  return client.request<T>(path, {
    ...options,
    method: 'POST',
    body: body as ApiRequestOptions['body'],
  });
}

export function apiPut<T>(path: string, body?: unknown, options?: ApiOptions): Promise<T> {
  return client.request<T>(path, {
    ...options,
    method: 'PUT',
    body: body as ApiRequestOptions['body'],
  });
}

export function apiPatch<T>(path: string, body?: unknown, options?: ApiOptions): Promise<T> {
  return client.request<T>(path, {
    ...options,
    method: 'PATCH',
    body: body as ApiRequestOptions['body'],
  });
}

export function apiDelete<T>(path: string, options?: ApiOptions): Promise<T> {
  return client.request<T>(path, { ...options, method: 'DELETE' });
}

export function apiDownload(path: string, options?: ApiOptions): Promise<Blob> {
  return client.requestBlob(path, { ...options, method: 'GET' });
}
