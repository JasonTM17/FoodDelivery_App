# users — Backend Service

## Purpose

User profile, address book, preferred locale, FCM tokens, notification preferences. Single source of truth for user identity (created by auth signup, owned by users service after). Gọi bởi: customer/driver mobile (profile + addresses), admin (suspend/activate/list), notifications (lookup preferredLocale + tokens), all auth flows.

## API surface

- `GET /users/me` — Current user profile
- `PATCH /users/me` — Update name, phone, preferredLocale
- `GET /users/addresses` — List user addresses
- `POST /users/addresses` — Create address
- `PUT|PATCH /users/addresses/:id` — Update + setDefault
- `DELETE /users/addresses/:id` — Delete an owned address
- `POST /notifications/fcm-token` — Register device token (notifications module)
- `DELETE /notifications/fcm-token` — Remove an owned device registration (notifications module)
- `GET /admin/users` — Admin list with filters
- `PATCH /admin/users/:id/status` — Suspend/activate

## Env vars

| Name | Default | Description |
|---|---|---|
| `USER_ADDRESS_LIMIT` | `10` | Max addresses per user |
| `USER_DEFAULT_LOCALE` | `vi` | Fallback locale on signup |

## Test

```bash
npx jest users
```

## Runbook

- **Suspended user:** Sets `User.status = 'suspended'`, JWT validation rejects. Refresh tokens revoked.
- **Address geocoding fail:** Reject address saves without valid Vietnam delivery coordinates; clients must provide a geocoded `latitude`/`longitude` pair instead of saving Null Island or placeholder data.
- **Locale change:** `PATCH /users/me { preferredLocale }` propagates next request via `User.preferredLocale` field; in-flight BullMQ jobs use stale locale until next event.
