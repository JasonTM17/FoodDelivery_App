# FoodFlow Code Standards

## General

- Kebab-case filenames with descriptive names
- Files under 200 lines (split when exceeding)
- No AI references in code or commits
- Vietnamese UI text, English code identifiers

## Backend (NestJS)

```
module/
├── module.module.ts    # NestJS module definition
├── module.controller.ts # HTTP endpoints
├── module.service.ts   # Business logic
├── module.dto.ts       # Zod/class-validator DTOs
└── module.gateway.ts   # WebSocket (if needed)
```

- Use Prisma for 95% of queries, `$queryRaw` for PostGIS
- All endpoints validate input before processing
- RBAC guards on all protected routes
- Error responses in `{ success: false, error: { code, message } }` format

## Frontend (Next.js)

- App Router with per-segment `loading.tsx`, `error.tsx`
- shadcn/ui components for consistency
- TanStack Query for server state
- `use client` only where interactivity needed

## Mobile (Flutter)

- Riverpod for state management
- Every screen handles loading, empty, error states
- Shared widgets in `lib/shared/widgets/`
- API calls through `ApiClient` singleton
- WebSocket through `SocketClient` singleton

## Git

- Conventional Commits: `type(scope): subject`
- Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore
- Subject ≤72 chars, imperative mood
- One logical change per commit
- No `Co-Authored-By` or AI references
