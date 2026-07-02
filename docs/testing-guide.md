# FoodFlow Testing Guide

## Backend (NestJS + Jest)

### Run tests
```bash
cd backend
pnpm test              # Unit tests
pnpm test -- --coverage # With coverage
pnpm test:e2e          # E2E tests
```

### Coverage targets
| Module | Line | Branch |
|--------|------|--------|
| Auth | ≥90% | ≥85% |
| Orders (state machine) | 100% | 100% |
| Dispatch | ≥80% | ≥75% |
| Tracking | ≥80% | ≥75% |
| Overall | ≥80% | ≥70% |

### Test structure
```
src/
├── auth/auth.service.spec.ts         # Unit: login, register
├── orders/order-state-machine.spec.ts # Unit: all transitions
├── dispatch/dispatch.service.spec.ts  # Unit: GEOSEARCH, sorting
├── tracking/tracking.service.spec.ts  # Unit: ETA, GPS
└── cart/cart.service.spec.ts         # Unit: cart operations
```

## Web (Next.js + Playwright)

```bash
cd web
pnpm test:e2e
```

### Batch 4 local E2E baseline

The Batch 4 web/backend gate runs Playwright against real local services:

- Backend API: `http://localhost:3001/api`
- Admin web: `http://localhost:3000`
- Restaurant web: `http://localhost:3002`
- Database/Redis/MinIO from Docker Compose seed data

Useful focused commands:

```bash
cd web
pnpm test:e2e -- --project=chromium tests/batch4-contract.spec.ts
pnpm test:e2e -- --project=chromium
pnpm test:e2e -- --project=firefox
```

Before running Firefox locally, install browsers once:

```bash
cd web
pnpm test:e2e:install
```

Verified Batch 4 coverage includes API contract checks, login/RBAC, localized admin navigation, customer cart-to-order checkout, order tracking, restaurant order status transitions, and realtime fallback behavior.

## Mobile (Flutter)

```bash
cd mobile
flutter test
```

## Load Testing (k6)

```bash
k6 run tests/load/location-updates.js
```
