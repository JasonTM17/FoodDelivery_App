import { assertProductionPublicUrl, isProductionDeployment } from './public-env'

const LOCAL_ADMIN_URL = 'http://localhost:3000'

export function resolveAdminMetadataBase(
  env: Record<string, string | undefined> = process.env,
): URL {
  const configuredUrl = env.NEXT_PUBLIC_ADMIN_URL?.trim()
  if (configuredUrl) return new URL(assertProductionPublicUrl('NEXT_PUBLIC_ADMIN_URL', configuredUrl, env))

  if (!isProductionDeployment(env)) return new URL(LOCAL_ADMIN_URL)

  throw new Error('NEXT_PUBLIC_ADMIN_URL is required for the admin metadata base')
}
