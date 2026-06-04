# Contributing to FoodFlow

Thank you for contributing. This guide covers everything you need to get started.

## Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Project Structure](#project-structure)
3. [Docker Compose Local Development](#docker-compose-local-development)
4. [Running the Backend](#running-the-backend)
5. [Running the Web Dashboards](#running-the-web-dashboards)
6. [Running the Mobile Apps](#running-the-mobile-apps)
7. [Running Tests](#running-tests)
8. [Code Review Process](#code-review-process)
9. [Commit Message Conventions](#commit-message-conventions)
10. [Branch Naming Conventions](#branch-naming-conventions)
11. [How to Add New Features](#how-to-add-new-features)
12. [Pull Request Checklist](#pull-request-checklist)

## Development Environment Setup

### Prerequisites

| Tool | Version | Check Command |
|------|---------|---------------|
| Docker Desktop | Latest | `docker --version` |
| Node.js | 20+ | `node --version` |
| pnpm | 10+ | `pnpm --version` |
| Flutter SDK | 3.12+ | `flutter --version` |
| Git | 2.40+ | `git --version` |

### One-Time Setup

```bash
# 1. Clone the repository
git clone https://github.com/JasonTM17/foodflow.git
cd foodflow

# 2. Copy environment files
cp backend/.env.example backend/.env

# 3. Start infrastructure (PostgreSQL, Redis, MinIO, N8N, Prometheus, Grafana)
docker compose up -d

# 4. Install backend dependencies
cd backend
pnpm install
pnpm prisma generate
pnpm prisma migrate dev --name init
pnpm db:seed
cd ..

# 5. Install web dependencies
cd web
pnpm install
cd ..

# 6. Install mobile dependencies
cd mobile
flutter pub get
cd ..
```

## Project Structure

```
foodflow/
├── backend/               # NestJS API server
│   ├── src/
│   │   ├── auth/          # Authentication (JWT, RBAC, guards)
│   │   ├── orders/        # Order lifecycle & state machine
│   │   ├── dispatch/      # Driver dispatch (BullMQ)
│   │   ├── tracking/      # Realtime GPS (Socket.IO)
│   │   ├── restaurants/   # Restaurant & menu CRUD
│   │   ├── drivers/       # Driver management
│   │   └── admin/         # Admin KPI, audit, support
│   └── prisma/            # Schema, migrations, seeds
├── web/                   # Next.js Turborepo
│   ├── apps/
│   │   ├── admin/         # Admin dashboard (port 3002)
│   │   └── restaurant/    # Restaurant dashboard (port 3003)
│   └── packages/
│       └── ui/            # Shared UI component library
├── mobile/                # Flutter monorepo
│   └── lib/
│       ├── customer/      # Customer app screens
│       ├── driver/        # Driver app screens
│       └── shared/        # Shared models, providers, widgets
├── infra/                 # Infrastructure
│   ├── docker-compose.yml
│   ├── docker-compose.local.yml
│   ├── nginx/             # Reverse proxy config
│   └── n8n/workflows/     # AI assistant workflows
└── docs/                  # Project documentation
```

## Docker Compose Local Development

The project provides two Compose files:

- `docker-compose.yml` — production-style with resource limits, healthchecks, and persistence
- `docker-compose.local.yml` — development overrides with remapped ports and relaxed limits

```bash
# Start all infrastructure services
docker compose up -d

# View logs for a specific service
docker compose logs -f backend

# Restart a service after code changes
docker compose restart backend

# Stop everything
docker compose down
```

Services in the stack:

| Service | Port | Purpose |
|---------|------|---------|
| postgres | 5432 | PostgreSQL + PostGIS |
| redis | 6379 | Cache, session, job queue |
| backend | 3001 | NestJS API server |
| worker | — | BullMQ job processor (2 replicas) |
| minio | 9000/9001 | Object storage (S3-compatible) |
| n8n | 5678 | AI workflow automation |
| bullboard | 3004 | BullMQ queue monitoring |
| prometheus | 9090 | Metrics collection |
| grafana | 3005 | Metrics visualization |
| redis-exporter | 9121 | Redis metrics for Prometheus |
| nginx | 80/443 | Reverse proxy |

## Running the Backend

```bash
cd backend

# Install dependencies and generate Prisma client
pnpm install
pnpm prisma generate

# Run database migrations
pnpm prisma migrate dev --name your_migration_name

# Seed the database
pnpm db:seed        # Small dataset (5 restaurants, 10 customers)
pnpm db:big-seed    # Large dataset (50 restaurants, 100 customers, 500 orders)

# Start in development mode (hot reload)
pnpm start:dev       # http://localhost:3001/api

# Swagger API docs
# Open http://localhost:3001/api/docs

# Type check
pnpm typecheck

# Lint
pnpm lint
```

## Running the Web Dashboards

```bash
cd web

# Install dependencies
pnpm install

# Start both dashboards in development mode
pnpm dev
# Admin:      http://localhost:3002
# Restaurant: http://localhost:3003

# Run type checking across the monorepo
pnpm typecheck

# Lint
pnpm lint

# Build for production
pnpm build
```

## Running the Mobile Apps

```bash
cd mobile

# Install dependencies
flutter pub get

# Run code generation (required if models changed)
flutter pub run build_runner build --delete-conflicting-outputs

# Run customer app
flutter run -t lib/main_customer.dart

# Run driver app
flutter run -t lib/main_driver.dart
```

## Running Tests

### Backend Tests

```bash
cd backend

# Unit tests
pnpm test

# Unit tests with coverage
pnpm test:cov

# E2E tests
pnpm test:e2e
```

### Web Tests

```bash
cd web

# Run tests across all packages (if configured)
pnpm test
```

### Mobile Tests

```bash
cd mobile

# Run Flutter tests
flutter test
```

### Coverage Thresholds

| Stack | Lines | Branches |
|-------|-------|----------|
| Backend (NestJS) | >= 80% | >= 75% |
| Web (Next.js) | >= 80% | >= 70% |
| Mobile (Flutter) | >= 80% | >= 70% |

CI will fail if coverage drops below these thresholds.

## Code Review Process

1. **Create a branch** from `main` (see [Branch Naming Conventions](#branch-naming-conventions))
2. **Implement your changes** following the code standards in `docs/code-standards.md`
3. **Write tests** covering your changes
4. **Self-review**: run `typecheck`, `lint`, and `test` locally
5. **Open a pull request** against `main` with:
   - Description of what and why
   - Testing notes (how to verify)
   - Screenshots/GIFs for UI changes
6. **CI must pass**: build, typecheck, lint, test, Trivy, CodeQL, Gitleaks
7. **Review**: at least one reviewer must approve
8. **Squash merge** into `main` (preferred)

### Code Style

- **Backend**: NestJS modules — controller, service, DTO, module per feature
- **Web**: Next.js App Router with per-segment `error.tsx` and `loading.tsx`
- **Mobile**: Flutter with Riverpod providers, screen-level state

## Commit Message Conventions

All commits follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

**Rules**:
- Subject <= 72 characters, imperative mood, no trailing period
- Scope is optional but encouraged (e.g., `auth`, `dispatch`, `tracking`)
- Breaking changes: append `!` after type/scope or add `BREAKING CHANGE:` footer
- Body (optional): wrap at 100 columns, explain **why** not **what**

**Examples**:
```
feat(dispatch): add driver fallback on timeout
fix(auth): prevent refresh token reuse after rotation
refactor(orders): extract state machine into dedicated service
test(tracking): add WebSocket reconnection coverage
```

## Branch Naming Conventions

```
feat/<description>    # New features
fix/<description>     # Bug fixes
refactor/<description> # Code restructuring
docs/<description>    # Documentation updates
chore/<description>   # Maintenance tasks
```

Use kebab-case for descriptions: `feat/add-driver-earnings-summary`, `fix/order-state-on-cancel`.

## How to Add New Features

### Backend (New Module)

1. Create the module directory under `backend/src/<feature>/`
2. Follow the standard pattern:
   ```
   <feature>/
   ├── <feature>.module.ts
   ├── <feature>.controller.ts
   ├── <feature>.service.ts
   ├── dto/
   │   ├── create-<feature>.dto.ts
   │   └── update-<feature>.dto.ts
   └── <feature>.service.spec.ts
   ```
3. Add Prisma schema changes in `backend/prisma/schema.prisma`
4. Generate migration: `pnpm prisma migrate dev --name add_<feature>`
5. Register the module in `app.module.ts`
6. Add guards (RBAC) on controller endpoints
7. Add Zod/class-validator DTOs for all inputs
8. Write unit and e2e tests

### Web (New Page or Dashboard)

1. Determine if it belongs to an existing app or needs a new one
2. Create route under `web/apps/<app>/app/<route>/`
3. Every route segment must have `error.tsx` and `loading.tsx`
4. Use shared UI components from `@foodflow/ui` package
5. Add `generateMetadata` for SEO on dynamic routes
6. Use shadcn/ui components from `web/packages/ui/src/`

### Mobile (New Screen)

1. Create screen file under `mobile/lib/<role>/screens/`
2. Create or extend provider in `mobile/lib/<role>/providers/` if needed
3. Use shared widgets from `mobile/lib/shared/widgets/`
4. Wire up navigation in the appropriate `GoRouter` configuration

### N8N Workflow (New Automation)

1. Design the workflow in the N8N UI at `http://localhost:5678`
2. Export as JSON and save to `infra/n8n/workflows/`
3. Follow the naming convention: `<trigger>_<action>.json`
4. Document the workflow in the N8N Setup Guide (`docs/n8n-setup-guide.md`)

## Pull Request Checklist

Before opening a PR, verify:

- [ ] TypeScript compile passes (`pnpm typecheck` in both `backend/` and `web/`)
- [ ] All tests pass (`pnpm test`)
- [ ] No lint errors (`pnpm lint`)
- [ ] New code has tests covering happy path and failure cases
- [ ] Input validation on all API routes (`safeParse` or equivalent)
- [ ] No `TODO` or `FIXME` left without a tracking issue
- [ ] Per-segment `error.tsx` and `loading.tsx` exist for new web routes
- [ ] `generateMetadata` present on dynamic web routes
- [ ] PR description includes what, why, and testing notes
- [ ] Breaking changes documented in the PR description
- [ ] Migrations are reversible (down migration exists) if applicable
