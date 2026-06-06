'use client';

import type { ApiError } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('restaurant_token');
}

export function setToken(token: string): void {
  localStorage.setItem('restaurant_token', token);
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('restaurant_refresh_token');
}

function setRefreshToken(refreshToken: string): void {
  localStorage.setItem('restaurant_refresh_token', refreshToken);
}

export function clearToken(): void {
  localStorage.removeItem('restaurant_token');
  localStorage.removeItem('restaurant_refresh_token');
  localStorage.removeItem('restaurant_data');
}

export function getStoredRestaurant() {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem('restaurant_data');
  return data ? JSON.parse(data) : null;
}

export function setStoredRestaurant(data: unknown): void {
  localStorage.setItem('restaurant_data', JSON.stringify(data));
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    setToken(data.token);
    if (data.refreshToken) setRefreshToken(data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

async function handle401AndRetry(originalRequest: () => Promise<Response>): Promise<Response> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshPromise = tryRefreshToken().finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });
  }

  const refreshed = await refreshPromise;
  if (!refreshed) {
    clearToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw { message: 'Phiên đăng nhập hết hạn', status: 401 } as ApiError;
  }

  return originalRequest();
}

export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { requireAuth = true, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (requireAuth) {
    const token = getToken();
    if (!token) {
      throw { message: 'Unauthorized', status: 401 } as ApiError;
    }
    headers['Authorization'] = `Bearer ${token}`;
  }

  const retryFn = () =>
    fetch(`${API_URL}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

  const response = await retryFn();

  if (response.status === 401 && requireAuth) {
    const retryResponse = await handle401AndRetry(retryFn);
    return handleResponse<T>(retryResponse, retryFn);
  }

  return handleResponse<T>(response, retryFn);
}

async function handleResponse<T>(response: Response, retryFn: () => Promise<Response>): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw { message: error.message || 'Request failed', status: response.status } as ApiError;
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'DELETE' }),
};
