const LOCAL_RESTAURANT_URL = 'http://localhost:3002'

export function resolveRestaurantMetadataBase(
  env: Record<string, string | undefined> = process.env,
): URL {
  const configuredUrl = env.NEXT_PUBLIC_RESTAURANT_URL?.trim()
  if (configuredUrl) return new URL(configuredUrl)

  if (env.NODE_ENV !== 'production') return new URL(LOCAL_RESTAURANT_URL)

  throw new Error('NEXT_PUBLIC_RESTAURANT_URL is required for the restaurant metadata base')
}
