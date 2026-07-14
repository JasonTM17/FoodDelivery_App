# Customer Guide

Languages: **English** | [Tiếng Việt](./customer-guide.vi.md) | [日本語](./customer-guide.ja.md)

FoodFlow Customer is the native Flutter/Riverpod food-ordering application for Android and iOS. This source-verified guide describes the current Customer flow; it does not claim that a particular production release, payment, map, or push provider is live. Customer has no web address: use the installed mobile app, or run [main_customer.dart](../mobile/lib/main_customer.dart) with the Android customer flavor.

## What you can do

| Area | Current Customer capability |
|---|---|
| Discover | Browse nearby restaurants, search food, view restaurant and food details, and filter restaurants. |
| Order | Add items and options to a cart, add notes and a promotion code, select a delivery address, and pay by cash or wallet. |
| Follow up | View active, delivered, and cancelled orders; track an eligible order; request cancellation; and review a delivered order. |
| Account | Use favorites, vouchers, notification inbox, wallet, loyalty, referral, addresses, help, and in-app AI chat. |

## Quick start

1. Browse a restaurant and add the chosen food and options to the cart.
2. Sign in or register before continuing to the protected cart and checkout
   steps.
3. Confirm a valid delivery address, wait for delivery pricing, then choose
   cash or wallet.
4. Submit checkout once, wait for the order confirmation, and open **Orders**
   to follow the result.

This is the shortest supported path. Favorites, vouchers, wallet, loyalty,
referral, notifications, and Help are optional account features; none replaces
the delivery-address and pricing checks required at checkout.

## 1. Start, account, and permissions

1. Open Customer. You can browse Home, Search, restaurants, and food details before signing in.
2. Choose **Register** to provide name, email, phone number, and password, or choose **Sign in** with email and password.
3. After a successful sign-in, continue through the welcome, location, and notification onboarding screens. Declining a permission must not create a false location or a false push-success state.

### Permission notes

- Location improves nearby restaurant discovery and delivery context. If Android or iOS does not show a permission prompt, check FoodFlow in device settings instead of assuming permission was granted.
- Notifications are optional. The in-app notification inbox remains available without Firebase push configuration; device push is only attempted after a valid session and a build with the required public Firebase metadata.
- A push tap can open the local notification inbox or an order destination. It does not promise support for arbitrary web or universal links.

## 2. Find food and build the cart

1. On **Home**, browse available restaurants or use **Search**.
2. Open a restaurant to inspect its menu, then open a food item to choose its available options before adding it to the cart.
3. In **Cart**, adjust quantity, remove an item, add an item note, or apply a promotion code when available.
4. Review the cart before checkout. Prices, inventory, promotion eligibility, and the final payment result are confirmed by the server, not by the screen alone.

If a sign-in request is rejected while the cart is local, the app does not silently discard it. Sign in again and review the contents before placing an order.

## 3. Delivery address and checkout

Checkout becomes available only after delivery pricing has loaded and a delivery address is selected. At checkout you can choose **cash** or **wallet**, add a driver note, and use the cart promotion code.

### Checkout checklist

Before submitting, confirm all of the following:

- the restaurant, item options, quantity, and item note are correct;
- a valid delivery address is selected;
- delivery pricing is visible rather than still loading;
- the cash or wallet selection is correct; and
- the promotion code is still shown in the cart when you expect one.

The server can still reject a request for inventory, price, voucher, payment, or
order-state reasons. Read the returned message and correct the affected choice;
do not assume a button press created an order.

### Select the delivery point on the map

When adding a new address, enter its label and detailed text, then tap the map
to place the delivery marker. The point must be inside the supported Vietnam
delivery area. A text-only address cannot be saved because the delivery API also
requires latitude and longitude; this protects order tracking and dispatch from
an invented location.

If the app reports an invalid location, tap a valid point on the map again.
Do not repeatedly submit checkout. An order cannot be placed until a valid
delivery address and delivery price are available.

After confirming checkout, wait for the order confirmation. The cart is cleared and tracking opens only after the API returns an order ID; do not submit the same order from multiple screens while confirmation is pending.

## 4. Track, cancel, and review an order

- Open **Orders** to see active, delivered, and cancelled orders.
- Select an active order to view tracking. When valid delivery and driver coordinates are available, the app can show map and route information. If coordinates or route data are unavailable, it shows that state rather than inventing a route or ETA.
- Choose **Cancel order** only when the order screen offers it. You can select slow delivery, changed mind, wrong order, or other; the server decides whether cancellation or a refund is allowed.
- After delivery, open the review flow to provide food and delivery ratings plus an optional comment.

## 5. Profile, notifications, and help

From **Profile**, Customer links to saved addresses, favorites, vouchers, wallet, loyalty, referral, notification inbox, and Help.

- **Favorites** keeps restaurants or food you want to find again.
- Vouchers and wallet/loyalty balances remain subject to server validation at checkout.
- **Notifications** supports reading items and marking them read. It is the safe fallback for unsupported push destinations.
- **Help** includes in-app AI chat. It returns a validated in-app reply or escalation state; it is not a promise of immediate human support.

### Requesting help effectively

For an order issue, open the affected order first. In Help, include the visible
order state, what you expected, what happened, and the exact error text if one
is shown. Do not share your password or other account credentials in a chat
message. This gives support context without relying on a guessed order.

## Troubleshooting

| What you see | What to do |
|---|---|
| No permission prompt | Check the FoodFlow permission in device settings, then return to the app. |
| No nearby location or route | Check location permission and network. The map intentionally avoids a made-up route or ETA. |
| Address location is required or invalid | Add the address again and tap a valid delivery point on the map before saving. |
| Checkout cannot continue | Confirm a valid address is selected, wait for delivery pricing, then review payment method, inventory, and voucher eligibility. |
| No device push | Check notification permission and device settings. The inbox remains the in-app fallback; Firebase configuration is build-specific. |
| Need order help | Open the affected order, then use Help/AI chat and include the visible order state or error. |

## Visual and release boundary

The [product gallery](./product-gallery.md#customer) contains one privacy-reviewed, test-only Customer discovery still from an Android API 35 emulator using simulated GPS. It is regression evidence from a dirty workspace, not release or production proof. Admin and Restaurant GIFs are retained for their own web flows and are not relabelled as Customer UI; no Customer GIF is stored yet.

For mobile runtime, configuration, and build commands, see the [Customer and Driver mobile guide](./customer-driver-guide.md) and [mobile README](../mobile/README.md).
