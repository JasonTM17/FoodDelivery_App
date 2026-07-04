import { assertProductionPublicUrl, isProductionDeployment } from './public-env';

const LOCAL_DEV_API_URL = 'http://localhost:3001/api';
const BUNDLED_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;

export function resolveApiBaseUrl(
  env?: Record<string, string | undefined>,
): string {
  const sourceEnv = env ?? process.env;
  const configuredUrl = (env?.NEXT_PUBLIC_API_URL ?? BUNDLED_PUBLIC_API_URL)?.trim();
  if (configuredUrl) return assertProductionPublicUrl('NEXT_PUBLIC_API_URL', configuredUrl, sourceEnv);

  if (!isProductionDeployment(sourceEnv)) return LOCAL_DEV_API_URL;

  throw new Error('NEXT_PUBLIC_API_URL is required for the admin API client');
}
