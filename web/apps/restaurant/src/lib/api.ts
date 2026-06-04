'use client';

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

export function clearToken(): void {
  localStorage.removeItem('restaurant_token');
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

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (response.status === 401) {
    clearToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw { message: 'Unauthorized', status: 401 } as ApiError;
  }

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
