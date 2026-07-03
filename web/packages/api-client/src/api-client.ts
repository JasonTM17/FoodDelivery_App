import type {
  ApiClientOptions,
  ApiEnvelope,
  ApiRequestOptions,
  PaginationMeta,
  ProblemDetail,
  TokenPair,
} from './types';

export class ApiClientError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly detail?: string;
  readonly problem: ProblemDetail;

  constructor(problem: ProblemDetail) {
    super(problem.detail || problem.title);
    this.name = 'ApiClientError';
    this.status = problem.status;
    this.code = problem.code;
    this.detail = problem.detail;
    this.problem = problem;
  }
}

function isEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as Record<string, unknown>).success === true &&
    'data' in value
  );
}

function isBodyInit(value: unknown): value is BodyInit {
  return (
    typeof value === 'string' ||
    value instanceof Blob ||
    value instanceof FormData ||
    value instanceof URLSearchParams ||
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value)
  );
}

export class FoodFlowApiClient {
  private readonly options: ApiClientOptions;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(options: ApiClientOptions) {
    this.options = {
      ...options,
      baseUrl: options.baseUrl.replace(/\/$/, ''),
    };
  }

  async request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const envelope = await this.requestEnvelope<T>(path, options);
    return envelope.data;
  }

  async requestEnvelope<T>(
    path: string,
    options: ApiRequestOptions = {},
  ): Promise<{ data: T; meta?: PaginationMeta }> {
    const response = await this.sendWithRefresh(path, options);
    return this.parseEnvelope<T>(response);
  }

  async requestBlob(path: string, options: ApiRequestOptions = {}): Promise<Blob> {
    const response = await this.sendWithRefresh(path, options);
    if (!response.ok) {
      throw await this.toError(response);
    }
    return response.blob();
  }

  private async sendWithRefresh(path: string, options: ApiRequestOptions): Promise<Response> {
    const response = await this.send(path, options);
    if (response.status !== 401 || options.requireAuth === false || options.skipRefresh) {
      return response;
    }

    await response.body?.cancel();
    const refreshed = await this.refreshAccessToken();
    if (!refreshed) this.expireSession();
    return this.send(path, { ...options, skipRefresh: true });
  }

  private expireSession(): never {
    this.options.clearTokens();
    this.options.onUnauthorized?.();
    throw new ApiClientError({
      title: 'Unauthorized',
      detail: 'Your session has expired.',
      status: 401,
      code: 'AUTH_SESSION_EXPIRED',
    });
  }

  private async send(path: string, options: ApiRequestOptions): Promise<Response> {
    const { params, requireAuth = true, skipRefresh: _skipRefresh, body, ...init } = options;
    const headers = new Headers(init.headers);

    if (body !== undefined && body !== null && !isBodyInit(body)) {
      headers.set('Content-Type', 'application/json');
    }

    if (requireAuth) {
      const accessToken = this.options.getAccessToken();
      if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
    }

    return (this.options.fetcher ?? fetch)(this.buildUrl(path, params), {
      ...init,
      headers,
      body:
        body === undefined || body === null
          ? undefined
          : isBodyInit(body)
            ? body
            : JSON.stringify(body),
    });
  }

  private buildUrl(path: string, params?: ApiRequestOptions['params']): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${this.options.baseUrl}${normalizedPath}`);
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
    return url.toString();
  }

  private async parseEnvelope<T>(response: Response): Promise<{ data: T; meta?: PaginationMeta }> {
    if (!response.ok) throw await this.toError(response);
    if (response.status === 204) return { data: undefined as T };

    let value: unknown;
    try {
      value = await response.json();
    } catch {
      throw new ApiClientError({
        title: 'Invalid API response body',
        detail: 'Expected a JSON FoodFlow API success envelope.',
        status: response.status,
        code: 'API_CONTRACT_INVALID_JSON',
      });
    }

    if (isEnvelope<T>(value)) return { data: value.data, meta: value.meta };

    throw new ApiClientError({
      title: 'Invalid API response envelope',
      detail: 'Expected FoodFlow API success envelope with success=true and data.',
      status: response.status,
      code: 'API_CONTRACT_INVALID_ENVELOPE',
    });
  }

  private async toError(response: Response): Promise<ApiClientError> {
    const fallback: ProblemDetail = {
      title: response.statusText || 'Request failed',
      status: response.status,
    };

    try {
      const value = (await response.json()) as Partial<ProblemDetail> & {
        message?: string | string[];
        error?: string | {
          code?: string;
          message?: string;
          details?: unknown;
        };
      };
      const legacyMessage = Array.isArray(value.message) ? value.message.join('; ') : value.message;
      const nestedError =
        typeof value.error === 'object' && value.error !== null ? value.error : undefined;
      const stringError = typeof value.error === 'string' ? value.error : undefined;
      return new ApiClientError({
        type: value.type,
        title:
          value.title || legacyMessage || nestedError?.message || stringError || fallback.title,
        detail: value.detail || legacyMessage || nestedError?.message,
        status: value.status || response.status,
        instance: value.instance,
        code: value.code || nestedError?.code,
        errors: value.errors ?? nestedError?.details,
      });
    } catch {
      return new ApiClientError(fallback);
    }
  }

  private refreshAccessToken(): Promise<boolean> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = this.performRefresh().finally(() => {
      this.refreshPromise = null;
    });
    return this.refreshPromise;
  }

  private async performRefresh(): Promise<boolean> {
    const refreshToken = this.options.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await this.send('/auth/refresh', {
        method: 'POST',
        body: { refreshToken },
        requireAuth: false,
        skipRefresh: true,
      });
      if (!response.ok) return false;

      const { data: tokens } = await this.parseEnvelope<TokenPair>(response);
      if (!tokens?.accessToken) return false;
      this.options.setTokens(tokens);
      return true;
    } catch {
      return false;
    }
  }
}
