import type { ApiRequestOptions } from './ApiRequestOptions';
import type { ApiResult } from './ApiResult';
import type { OpenAPIConfig } from './OpenAPI';
import { CancelablePromise } from './CancelablePromise';
import { ApiError } from './ApiError';

const getUrl = (config: OpenAPIConfig, options: ApiRequestOptions): string => {
  const encoder = config.ENCODE_PATH ?? encodeURI;
  const path = options.url.replace(/{(.*?)}/g, (_, key: string) =>
    encoder(String((options.path ?? {})[key] ?? '')),
  );
  const url = `${config.BASE}${path}`;
  if (options.query) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(options.query)) {
      if (v !== undefined && v !== null) params.append(k, String(v));
    }
    const qs = params.toString();
    if (qs) return `${url}?${qs}`;
  }
  return url;
};

const getHeaders = async (
  config: OpenAPIConfig,
  options: ApiRequestOptions,
): Promise<Headers> => {
  const token = typeof config.TOKEN === 'function' ? await config.TOKEN(options) : config.TOKEN;
  const username =
    typeof config.USERNAME === 'function' ? await config.USERNAME(options) : config.USERNAME;
  const password =
    typeof config.PASSWORD === 'function' ? await config.PASSWORD(options) : config.PASSWORD;
  const extraHeaders =
    typeof config.HEADERS === 'function' ? await config.HEADERS(options) : config.HEADERS ?? {};

  const headers = new Headers({
    Accept: 'application/json',
    ...extraHeaders,
    ...(options.headers as Record<string, string>),
  });

  if (options.body !== undefined && options.mediaType) {
    headers.set('Content-Type', options.mediaType);
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (username && password) {
    headers.set('Authorization', `Basic ${btoa(`${username}:${password}`)}`);
  }
  return headers;
};

const getBody = (options: ApiRequestOptions): BodyInit | undefined => {
  if (options.body === undefined) return undefined;
  if (options.mediaType?.includes('json')) return JSON.stringify(options.body);
  if (options.mediaType?.includes('form') && options.formData) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(options.formData)) {
      fd.append(k, v as string | Blob);
    }
    return fd;
  }
  return options.body;
};

export const request = <T>(
  config: OpenAPIConfig,
  options: ApiRequestOptions<T>,
): CancelablePromise<T> => {
  return new CancelablePromise<T>(async (resolve, reject, onCancel) => {
    try {
      const url = getUrl(config, options);
      const headers = await getHeaders(config, options);
      const body = getBody(options);

      const controller = new AbortController();
      onCancel(() => controller.abort());

      const response = await fetch(url, {
        method: options.method,
        headers,
        body,
        signal: controller.signal,
        credentials: config.WITH_CREDENTIALS ? 'include' : 'same-origin',
      });

      let responseBody: unknown;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        responseBody = await response.json();
      } else {
        responseBody = await response.text();
      }

      const result: ApiResult = {
        url,
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        body: responseBody,
      };

      if (!response.ok) {
        throw new ApiError(options, result, `HTTP ${response.status}: ${response.statusText}`);
      }

      const transformed = options.responseTransformer
        ? await options.responseTransformer(responseBody as T)
        : (responseBody as T);

      resolve(transformed);
    } catch (error) {
      if (error instanceof ApiError) {
        reject(error);
      } else if (error instanceof DOMException && error.name === 'AbortError') {
        reject(
          new ApiError(
            options,
            { url: '', ok: false, status: 0, statusText: 'AbortError', body: null },
            'Request cancelled',
          ),
        );
      } else {
        reject(
          new ApiError(
            options,
            { url: '', ok: false, status: 0, statusText: 'Error', body: null },
            String(error),
          ),
        );
      }
    }
  });
};
