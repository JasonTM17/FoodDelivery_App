import type { APIRequestContext } from '@playwright/test'
import { API_URL } from './test-users'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  userId: string
  role: string
}

async function assertOk(
  resp: Awaited<ReturnType<APIRequestContext['post']>>,
  label: string,
): Promise<void> {
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
  const resp = await request.post(`${API_URL}/auth/login`, {
    data: { email, password },
  })
  await assertOk(resp, `login(${email})`)
  const body = await resp.json()
  return {
    accessToken: body.accessToken,
    refreshToken: body.refreshToken,
    userId: body.user?.id ?? '',
    role: body.user?.role ?? '',
  }
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
  const body = await resp.json()
  return {
    accessToken: body.accessToken,
    refreshToken: body.refreshToken,
    userId: body.user?.id ?? '',
    role: body.user?.role ?? '',
  }
}

// Returns the restaurant ID that belongs to the currently-authenticated restaurant account
export async function getRestaurantIdViaApi(
  request: APIRequestContext,
  token: string,
): Promise<string> {
  const resp = await request.get(`${API_URL}/restaurants/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!resp.ok()) return ''
  const body = await resp.json()
  return body.id ?? body.restaurantId ?? ''
}

// Returns the first available menu item ID for the given restaurant
export async function getFirstMenuItemIdViaApi(
  request: APIRequestContext,
  restaurantId: string,
): Promise<string> {
  const resp = await request.get(`${API_URL}/restaurants/${restaurantId}/menu`)
  if (!resp.ok()) return ''
  const body = await resp.json()
  const categories: Array<{ items?: Array<{ id: string }> }> =
    Array.isArray(body) ? body : (body.categories ?? [])
  return categories[0]?.items?.[0]?.id ?? ''
}

export async function placeOrderViaApi(
  request: APIRequestContext,
  token: string,
  restaurantId: string,
  menuItemId: string,
): Promise<string> {
  const resp = await request.post(`${API_URL}/orders`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      restaurantId,
      items: [{ menuItemId, quantity: 1 }],
      deliveryAddress: '1 Nguyễn Huệ, Quận 1, TP. HCM',
      deliveryLat: 10.7757,
      deliveryLng: 106.7004,
      paymentMethod: 'cod',
    },
  })
  await assertOk(resp, 'placeOrder')
  const body = await resp.json()
  return body.id ?? body.orderId ?? ''
}

export async function getOrderStatusViaApi(
  request: APIRequestContext,
  token: string,
  orderId: string,
): Promise<string> {
  const resp = await request.get(`${API_URL}/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!resp.ok()) return ''
  const body = await resp.json()
  return body.status ?? ''
}

export async function updateOrderStatusViaApi(
  request: APIRequestContext,
  token: string,
  orderId: string,
  status: string,
): Promise<boolean> {
  const resp = await request.patch(
    `${API_URL}/restaurants/orders/${orderId}/status`,
    {
      headers: { Authorization: `Bearer ${token}` },
      data: { status },
    },
  )
  return resp.ok()
}
