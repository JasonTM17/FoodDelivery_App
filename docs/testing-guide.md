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

## Mobile (Flutter)

```bash
cd mobile
flutter test
```

## Load Testing (k6)

```bash
k6 run tests/load/location-updates.js
```
