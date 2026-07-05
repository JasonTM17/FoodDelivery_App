const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

export function isProductionDeployment(env: Record<string, string | undefined>): boolean {
  const appEnv = env.NEXT_PUBLIC_APP_ENV?.trim().toLowerCase();
  if (appEnv === 'development' || appEnv === 'test' || appEnv === 'local') return false;
  return env.VERCEL_ENV === 'production' || appEnv === 'production' || env.NODE_ENV === 'production';
}

function isLocalHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return LOCAL_HOSTNAMES.has(normalized) || normalized.endsWith('.localhost') || normalized.endsWith('.local');
}

export function assertProductionPublicUrl(
  envName: string,
  rawUrl: string,
  env: Record<string, string | undefined>,
  allowedProtocols: readonly string[] = ['https:'],
): string {
  const parsed = new URL(rawUrl);

  if (isProductionDeployment(env)) {
    if (!allowedProtocols.includes(parsed.protocol) || isLocalHostname(parsed.hostname)) {
      throw new Error(`${envName} must be a secure public URL in production`);
    }
  }

  return parsed.toString().replace(/\/$/, rawUrl.endsWith('/') ? '/' : '');
}
