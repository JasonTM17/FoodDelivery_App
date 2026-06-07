const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ApiOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
}

function buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
}

function setToken(token: string): void {
  localStorage.setItem('admin_token', token);
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_refresh_token');
}

function setRefreshToken(refreshToken: string): void {
  localStorage.setItem('admin_refresh_token', refreshToken);
}

function clearTokens(): void {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_refresh_token');
  localStorage.removeItem('admin_user');
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
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
    clearTokens();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Phiên đăng nhập hết hạn');
  }

  return originalRequest();
}

async function handleResponse<T>(response: Response, retryFn: () => Promise<Response>): Promise<T> {
  if (!response.ok) {
    const errorBody = await response.text();
    let errorMessage: string;
    try {
      const parsed = JSON.parse(errorBody);
      errorMessage = parsed.message || parsed.error || `HTTP ${response.status}`;
    } catch {
      errorMessage = errorBody || `HTTP ${response.status}`;
    }

    if (response.status === 401) {
      const retryResponse = await handle401AndRetry(retryFn);
      return handleResponse<T>(retryResponse, retryFn);
    }

    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function apiGet<T>(path: string, options?: ApiOptions): Promise<T> {
  const headers = { ...getAuthHeaders(), ...(options?.headers as Record<string, string>) };

  const retryFn = () =>
    fetch(buildUrl(path, options?.params), {
      method: 'GET',
      headers,
      ...options,
    });

  const response = await retryFn();
  return handleResponse<T>(response, retryFn);
}

export async function apiPost<T>(path: string, body?: unknown, options?: ApiOptions): Promise<T> {
  const headers = { ...getAuthHeaders(), ...(options?.headers as Record<string, string>) };

  const retryFn = () =>
    fetch(buildUrl(path, options?.params), {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });

  const response = await retryFn();
  return handleResponse<T>(response, retryFn);
}

export async function apiPut<T>(path: string, body?: unknown, options?: ApiOptions): Promise<T> {
  const headers = { ...getAuthHeaders(), ...(options?.headers as Record<string, string>) };

  const retryFn = () =>
    fetch(buildUrl(path, options?.params), {
      method: 'PUT',
      headers,
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });

  const response = await retryFn();
  return handleResponse<T>(response, retryFn);
}

export async function apiPatch<T>(path: string, body?: unknown, options?: ApiOptions): Promise<T> {
  const headers = { ...getAuthHeaders(), ...(options?.headers as Record<string, string>) };

  const retryFn = () =>
    fetch(buildUrl(path, options?.params), {
      method: 'PATCH',
      headers,
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });

  const response = await retryFn();
  return handleResponse<T>(response, retryFn);
}

export interface AuditLogFilter {
  actor?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export async function getAuditLogs(
  filter?: AuditLogFilter,
): Promise<{ logs: Array<Record<string, unknown>>; total?: number }> {
  return apiGet('/admin/audit-logs', {
    params: filter as Record<string, string | number | undefined>,
  });
}

export async function apiDelete<T>(path: string, options?: ApiOptions): Promise<T> {
  const headers = { ...getAuthHeaders(), ...(options?.headers as Record<string, string>) };

  const retryFn = () =>
    fetch(buildUrl(path, options?.params), {
      method: 'DELETE',
      headers,
      ...options,
    });

  const response = await retryFn();
  return handleResponse<T>(response, retryFn);
}
