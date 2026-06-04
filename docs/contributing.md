# Contributing to FoodFlow

## Commit Convention

```
type(scope): subject
```
Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`

Subject ≤72 chars, imperative mood, Vietnamese or English.

## Branch Strategy

- `main` — production, protected
- `feat/*` — feature branches
- `fix/*` — bug fixes

## Pull Request Checklist

1. TypeScript compile passes (`tsc --noEmit`)
2. Tests pass (`pnpm test`)
3. No lint errors (`pnpm lint`)
4. PR description includes what, why, and testing notes

## Code Style

- NestJS modules: controller → service → dto → module
- Flutter: Riverpod providers, screen-level state
- Next.js: App Router, per-segment error/loading boundaries
