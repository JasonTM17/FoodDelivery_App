import { expect, test } from '@playwright/test'
import { API_URL, TEST_USERS } from '../fixtures/test-users'
import {
  getFirstMenuItemIdViaApi,
  getRestaurantIdViaApi,
  loginViaApi,
  placeOrderViaApi,
} from '../fixtures/api-helpers'

const OTHER_RESTAURANT = {
  email: process.env.E2E_OTHER_RESTAURANT_EMAIL ?? 'restaurant2@foodflow.vn',
  password: process.env.E2E_OTHER_RESTAURANT_PASSWORD ?? TEST_USERS.restaurant.password,
}

test.describe('Tenant isolation', () => {
  test('restaurant users cannot read or update another restaurant tenant order', async ({ request }) => {
    const [ownerAuth, otherAuth, customerAuth] = await Promise.all([
      loginViaApi(request, TEST_USERS.restaurant.email, TEST_USERS.restaurant.password),
      loginViaApi(request, OTHER_RESTAURANT.email, OTHER_RESTAURANT.password),
      loginViaApi(request, TEST_USERS.customer.email, TEST_USERS.customer.password),
    ])
    expect(ownerAuth.userId).not.toEqual(otherAuth.userId)

    const restaurantId = await getRestaurantIdViaApi(request, ownerAuth.accessToken)
    const otherRestaurantId = await getRestaurantIdViaApi(request, otherAuth.accessToken)
    expect(restaurantId).toBeTruthy()
    expect(otherRestaurantId).toBeTruthy()
    expect(restaurantId).not.toEqual(otherRestaurantId)

    const menuItemId = await getFirstMenuItemIdViaApi(request, restaurantId)
    expect(menuItemId).toBeTruthy()

    const orderId = await placeOrderViaApi(
      request,
      customerAuth.accessToken,
      restaurantId,
      menuItemId,
    )
    expect(orderId).toBeTruthy()

    const otherListResp = await request.get(`${API_URL}/restaurant/orders`, {
      headers: { Authorization: `Bearer ${otherAuth.accessToken}` },
    })
    expect(otherListResp.ok()).toBeTruthy()
    const otherListBody = await otherListResp.json() as {
      data?: { orders?: Array<{ id: string }> }
      orders?: Array<{ id: string }>
    }
    const otherOrders = otherListBody.data?.orders ?? otherListBody.orders ?? []
    expect(otherOrders.map(order => order.id)).not.toContain(orderId)

    const otherDetailResp = await request.get(`${API_URL}/restaurant/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${otherAuth.accessToken}` },
    })
    expect([403, 404]).toContain(otherDetailResp.status())

    const otherUpdateResp = await request.patch(`${API_URL}/restaurant/orders/${orderId}/status`, {
      headers: { Authorization: `Bearer ${otherAuth.accessToken}` },
      data: { status: 'restaurant_accepted' },
    })
    expect([403, 404]).toContain(otherUpdateResp.status())

    const ownerUpdateResp = await request.patch(`${API_URL}/restaurant/orders/${orderId}/status`, {
      headers: { Authorization: `Bearer ${ownerAuth.accessToken}` },
      data: { status: 'restaurant_accepted' },
    })
    expect(ownerUpdateResp.ok()).toBeTruthy()
  })
})
