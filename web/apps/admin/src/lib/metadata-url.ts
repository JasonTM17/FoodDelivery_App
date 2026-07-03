const LOCAL_ADMIN_URL = 'http://localhost:3000'

export function resolveAdminMetadataBase(
  env: Record<string, string | undefined> = process.env,
): URL {
  const configuredUrl = env.NEXT_PUBLIC_ADMIN_URL?.trim()
  if (configuredUrl) return new URL(configuredUrl)

  if (env.NODE_ENV !== 'production') return new URL(LOCAL_ADMIN_URL)

  throw new Error('NEXT_PUBLIC_ADMIN_URL is required for the admin metadata base')
}
