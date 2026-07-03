import { assertProductionPublicUrl, isProductionDeployment } from './public-env'

const LOCAL_RESTAURANT_URL = 'http://localhost:3002'

export function resolveRestaurantMetadataBase(
  env: Record<string, string | undefined> = process.env,
): URL {
  const configuredUrl = env.NEXT_PUBLIC_RESTAURANT_URL?.trim()
  if (configuredUrl) return new URL(assertProductionPublicUrl('NEXT_PUBLIC_RESTAURANT_URL', configuredUrl, env))

  if (!isProductionDeployment(env)) return new URL(LOCAL_RESTAURANT_URL)

  throw new Error('NEXT_PUBLIC_RESTAURANT_URL is required for the restaurant metadata base')
}
