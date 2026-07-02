import type { APIRequestContext, APIResponse } from '@playwright/test'
import { API_URL } from './test-users'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  userId: string
  role: string
}

interface Envelope<T> {
  success?: boolean
  data?: T
}

const authTokenCache = new Map<string, AuthTokens>()

function unwrap<T>(body: unknown): T {
  const envelope = body as Envelope<T>
  return envelope?.success === true && 'data' in envelope ? envelope.data as T : body as T
}

function authHeaders(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` }
}

async function assertOk(resp: APIResponse, label: string): Promise<void> {
  if (!resp.ok()) {
    const text = await resp.text()
    throw new Error(`${label}: HTTP ${resp.status()} — ${text}`)
  }
}

export async function loginViaApi(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<AuthTokens> {
  const cacheKey = `${email}:${password}`
  const cached = authTokenCache.get(cacheKey)
  if (cached) return cached

  const resp = await request.post(`${API_URL}/auth/login`, {
    data: { email, password },
  })

  await assertOk(resp, `login(${email})`)
  const payload = unwrap<{
    accessToken: string
    refreshToken: string
    user?: { id?: string; role?: string }
  }>(await resp.json())

  const tokens = {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    userId: payload.user?.id ?? '',
    role: payload.user?.role ?? '',
  }
  authTokenCache.set(cacheKey, tokens)
  return tokens
}

export async function registerViaApi(
  request: APIRequestContext,
  email: string,
  password: string,
  fullName: string,
  phone: string,
): Promise<AuthTokens> {
  const resp = await request.post(`${API_URL}/auth/register`, {
    data: { email, password, fullName, phone },
  })
  await assertOk(resp, `register(${email})`)
  const payload = unwrap<{
    accessToken: string
    refreshToken: string
    user?: { id?: string; role?: string }
  }>(await resp.json())

  return {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    userId: payload.user?.id ?? '',
    role: payload.user?.role ?? '',
  }
}

export async function getRestaurantIdViaApi(
  request: APIRequestContext,
  token: string,
): Promise<string> {
  const resp = await request.get(`${API_URL}/restaurant/profile`, {
    headers: authHeaders(token),
  })
  if (!resp.ok()) return ''
  const payload = unwrap<{ id?: string; restaurantId?: string }>(await resp.json())
  return payload.id ?? payload.restaurantId ?? ''
}

export async function getFirstMenuItemIdViaApi(
  request: APIRequestContext,
  restaurantId: string,
): Promise<string> {
  const resp = await request.get(`${API_URL}/restaurants/${restaurantId}/menu`)
  if (!resp.ok()) return ''
  const payload = unwrap<{
    categories?: Array<{ items?: Array<{ id: string }>; menuItems?: Array<{ id: string }> }>
    items?: Array<{ items?: Array<{ id: string }>; menuItems?: Array<{ id: string }> }>
  }>(await resp.json())
  const categories = Array.isArray(payload) ? payload : (payload.categories ?? payload.items ?? [])

  for (const category of categories) {
    const item = (category.items ?? category.menuItems ?? [])[0]
    if (item?.id) return item.id
  }
  return ''
}

export async function getDefaultAddressIdViaApi(
  request: APIRequestContext,
  token: string,
): Promise<string> {
  const resp = await request.get(`${API_URL}/users/addresses`, {
    headers: authHeaders(token),
  })
  await assertOk(resp, 'listAddresses')
  const addresses = unwrap<Array<{ id: string; isDefault?: boolean }>>(await resp.json())
  return (addresses.find(address => address.isDefault) ?? addresses[0])?.id ?? ''
}

export async function placeOrderViaApi(
  request: APIRequestContext,
  token: string,
  restaurantId: string,
  menuItemId: string,
): Promise<string> {
  const addressId = await getDefaultAddressIdViaApi(request, token)
  if (!addressId) throw new Error('placeOrder: no customer address available')

  await request.delete(`${API_URL}/cart`, {
    headers: authHeaders(token),
  })

  const cartResp = await request.post(`${API_URL}/cart/items`, {
    headers: authHeaders(token),
    data: { restaurantId, menuItemId, quantity: 1 },
  })
  await assertOk(cartResp, 'addCartItem')

  const resp = await request.post(`${API_URL}/orders`, {
    headers: authHeaders(token),
    data: { addressId, paymentMethod: 'cash' },
  })
  await assertOk(resp, 'placeOrder')
  const payload = unwrap<{ id?: string; orderId?: string }>(await resp.json())
  return payload.id ?? payload.orderId ?? ''
}

export async function getOrderStatusViaApi(
  request: APIRequestContext,
  token: string,
  orderId: string,
): Promise<string> {
  const resp = await request.get(`${API_URL}/orders/${orderId}`, {
    headers: authHeaders(token),
  })
  if (!resp.ok()) return ''
  const payload = unwrap<{ status?: string }>(await resp.json())
  return payload.status ?? ''
}

export async function updateOrderStatusViaApi(
  request: APIRequestContext,
  token: string,
  orderId: string,
  status: string,
): Promise<boolean> {
  const resp = await request.patch(
    `${API_URL}/restaurant/orders/${orderId}/status`,
    {
      headers: authHeaders(token),
      data: { status },
    },
  )
  return resp.ok()
}
