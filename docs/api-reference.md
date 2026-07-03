# FoodFlow API Reference

Base URL: `http://localhost:3001/api`

## Authentication

All protected endpoints require `Authorization: Bearer <jwt_access_token>` header.

### POST /auth/register
Register a new user account.
```
Body: { email, password, fullName, phone?, role? }
Response: { accessToken, refreshToken, user }
```

### POST /auth/login
Login with email and password.
```
Body: { email, password }
Response: { accessToken, refreshToken, user }
```

### POST /auth/refresh
Refresh expired access token.
```
Body: { refreshToken }
Response: { accessToken, refreshToken, user }
```

### POST /auth/logout
Invalidate refresh token.
```
Headers: Authorization: Bearer <token>
Body: { refreshToken? }
```

## Users

### GET /users/addresses
List the current user's address book. Requires user authentication.

Response envelope:

```json
{
  "success": true,
  "data": [
    {
      "id": "address-id",
      "addressLine": "123 Le Loi",
      "lat": 10.7769,
      "lng": 106.7009,
      "isDefault": true
    }
  ]
}
```

## Restaurants

### GET /restaurants/nearby
Find restaurants near a location using PostGIS.
```
Query: lat, lng, radius (km, default 5), cuisine?, page?, limit?
Response: { items: Restaurant[], meta: { page, limit, total } }
```

### GET /restaurants/:id
Get restaurant detail with opening hours.

### GET /restaurants/:id/menu
Get full menu with categories, items, and options.

### GET /restaurants/search
Search restaurants by name or cuisine.
```
Query: q, page?, limit?
```

## Cart

### GET /cart
Get current user's cart. Requires customer role.

### POST /cart/items
Add item to cart.
```
Body: { restaurantId, menuItemId, quantity, selectedOptions?, notes? }
```

### PATCH /cart/items/:id
Update item quantity or notes.

### DELETE /cart/items/:id
Remove item from cart.

### POST /cart/apply-promotion
Apply promotion code.
```
Body: { code }
```

## Orders

### POST /orders
Place order from cart. Requires customer role.
```
Body: { addressId, paymentMethod (cash|wallet|sepay), promotionCode?, notes? }
Note: public requests must use `wallet`; the legacy database enum is not accepted as an API value.
```

Order codes are generated as 12-character values using the `FDYYMMDDXXXX` pattern to match the database column width.

### GET /orders
Get customer's order history.
```
Query: page?, limit?, status?
```

### GET /orders/:id
Get order detail with items, status history, payment.

### GET /orders/:id/tracking
Get real-time driver location and ETA.

### POST /orders/:id/cancel
Cancel order if allowed by current status.

### POST /orders/:id/review
Submit review after delivery.
```
Body: { foodRating (1-5), deliveryRating (1-5), comment? }
```

## Restaurant Orders

### GET /restaurant/orders
Get restaurant's order queue. Requires restaurant role.

### PATCH /restaurant/orders/:id/status
Update order status (restaurant_accepted, preparing, ready_for_pickup).

### GET /restaurant/orders/:id/messages
Get persisted restaurant-driver order chat messages. Requires restaurant role and tenant ownership.

Response envelope:

```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "message-id",
        "senderType": "driver",
        "senderId": "driver-user-id",
        "content": "Arrived at pickup",
        "createdAt": "2026-07-02T10:00:00.000Z"
      }
    ],
    "canReply": true
  }
}
```

### POST /restaurant/orders/:id/messages
Create a restaurant-driver order chat message and broadcast `/events` `order:message_created`.

```
Body: { content }
```

Returns `400 ORDER_DRIVER_NOT_ASSIGNED` when dispatch has not assigned a driver yet.

## Driver

### POST /driver/online
Go online with current GPS coordinates.
```
Body: { lat, lng }
```

### POST /driver/offline
Go offline.

### GET /driver/orders/available
Get pending orders near driver.

### POST /driver/orders/:id/accept
Accept dispatch offer.
```
Body: { offerToken }
```

### PATCH /driver/orders/:id/status
Update delivery status.

### GET /driver/earnings
Get earnings summary.
```
Query: period (today|week|month)
```

### GET /driver/heatmap
Get real demand heatmap points near the authenticated driver's location.
```
Query: lat, lng, radius, window (now|1h|3h|today)
```

### GET /driver/incentives
Get active and completed driver incentive campaigns. Returns empty arrays when no campaign source is configured.

## Admin

All admin endpoints require admin role.

### GET /admin/dashboard
Dashboard KPI overview.

### GET /admin/orders
All orders with filters and pagination.

### GET /admin/users
User management list.

### PATCH /admin/users/:id/status
Ban or unban user.

### GET /admin/restaurants
Restaurant management list.

### GET /admin/support-tickets
Support ticket list with kanban status.

### GET /admin/online-drivers
Real-time online driver positions from Redis, enriched with DB driver profile and active order.

Response envelope:

```json
{
  "success": true,
  "data": [
    {
      "id": "driver-user-id",
      "driverId": "driver-user-id",
      "name": "Nguyen Van Tai",
      "rating": 4.8,
      "status": "delivering",
      "lat": 10.7769,
      "lng": 106.7009,
      "currentOrder": "ORD-20260702-0001",
      "vehicleType": "motorbike",
      "vehiclePlate": "59A1-12345",
      "lastSeenAt": "2026-07-02T09:00:00.000Z"
    }
  ]
}
```

### GET /admin/audit-logs
Admin activity audit trail.

## WebSocket Events

Connect to `ws://localhost:3001` with namespace:
- `/tracking` — Driver GPS and order tracking
- `/events` — Order status and restaurant notifications
- `/dispatch` — Driver dispatch offers

### Client → Server
| Event | Payload |
|-------|---------|
| `driver:location` | `{ lat, lng, bearing, speed, accuracy, timestamp }` |
| `order:subscribe` | `{ orderId }` |
| `order:unsubscribe` | `{ orderId }` |
| `/events: restaurant:subscribe` | `{ restaurantId }` |
| `/events: restaurant:unsubscribe` | `{ restaurantId }` |
| `driver:go_online` | `{ lat, lng }` |
| `driver:go_offline` | `{}` |
| `/events: admin:subscribe_drivers` | `{}` |
| `/events: admin:unsubscribe_drivers` | `{}` |

### Server → Client
| Event | Payload |
|-------|---------|
| `/events: restaurant:new_order` | `{ orderId, orderCode, total, items }` |
| `/events: order:status:changed` | `{ orderId, status, timestamp }` |
| `/events: order:message_created` | `{ id, senderType, senderId, content, createdAt }` |
| `driver:location_changed` | `{ driverId, lat, lng, bearing, timestamp }` |
| `/events: admin:driver_location_changed` | `{ driverId, lat, lng, orderId, status, timestamp }` |
| `driver:assigned` | `{ driverId, driverName, eta_minutes }` |
| `delivery:eta_updated` | `{ orderId, etaMinutes }` |

## Error Format

Web/admin/restaurant API errors use RFC 7807 Problem Details directly, not the success envelope:

```json
{
  "type": "https://api.foodflow.vn/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Order not found",
  "instance": "/api/orders/xxx",
  "code": "ORDER_NOT_FOUND"
}
```
