const LOCAL_DEV_API_URL = 'http://localhost:3001/api';

export function resolveApiBaseUrl(
  env: Record<string, string | undefined> = process.env,
): string {
  const configuredUrl = env.NEXT_PUBLIC_API_URL?.trim();
  if (configuredUrl) return configuredUrl;

  if (env.NODE_ENV !== 'production') return LOCAL_DEV_API_URL;

  throw new Error('NEXT_PUBLIC_API_URL is required for the admin API client');
}
