# Branch Consolidation Report: 2026-10-30 Release

## Overview

This document records the consolidation of 10 outstanding branches into `master` via `release/consolidate-containers` in accordance with the 2026-10-30 release plan.

All original branch histories have been merged via true merge commits (`--no-ff`), preserving the exact commit ancestry while upholding the invariants of `master` (no downgrade of modern dependencies, no breaking of migration checksums, no security bypasses).

## Consolidated Branch Ledger

| # | Branch | Original HEAD SHA | Merge Commit | Resolution Strategy & Rationale |
|---|---|---|---|---|
| 1 | `archive/checksum-reconciliation-v2` | `bf86fa8ff51167ce9ed47c88f729720221d2a698` | `7c017368` | History integrated. Maintained master's hardened SQL checksum guard, migration provenance, and schema definitions. |
| 2 | `dependabot/docker/backend/node-25-bookworm-slim` | `98880c07190e7f10ea64e6822a7aa960b766f07f` | `111e9006` | History integrated. Retained Node 22 LTS for production stability and distroless runtime compatibility; Node 25 deferred. |
| 3 | `dependabot/docker/backend/distroless/nodejs22-debian13-...` | `c31e6560ec73682d9965714dbc8f24b7e1bbb2e3` | `1574750a` | History integrated. Retained Debian 12 bookworm LTS distroless base image; Debian 13 experimental digest deferred. |
| 4 | `dependabot/github_actions/actions/checkout-7.0.1` | `81a69bad796b129d05ef7a876056b978162ffd87` | `2b17be9b` | Applied pinned action updates while preserving custom security/cache workflows. |
| 5 | `dependabot/github_actions/docker/login-action-4.6.0` | `abf029e58636ce4ef26f2830aa9ea967283cfdea` | `362438f8` | Applied pinned action update without modifying credentials or permission scoping. |
| 6 | `dependabot/github_actions/github/codeql-action/analyze-4.37.3` | `3c2fa48938b013238a20bc83b886636ec70ecbde` | `61339235` | Applied pinned CodeQL action update. |
| 7 | `dependabot/github_actions/github/codeql-action/init-4.37.3` | `a6a8c60d3147fc45359b80a1cd5b5ba2bbbb591b` | `5f67fa14` | Applied pinned CodeQL action update. |
| 8 | `dependabot/github_actions/github/codeql-action/upload-sarif-4.37.3` | `da57d0775353653331decda7f1f338d497e1437c` | `edc47940` | Applied pinned CodeQL action update. |
| 9 | `dependabot/npm_and_yarn/backend/backend-compatible-updates-22272115f2` | `98d0f2f99b9576aa3d2dd0a53cab2464e1a23772` | `6519cbc0` | Retained master's modern dependencies (NestJS 11.2.8, Prisma 6.19.3, Zod 4.6.7). Resolved CVE-2026-118664 via `decode-uri-component@0.5.1` and dual-module patch. Regenerated `backend/pnpm-lock.yaml`. |
| 10 | `dependabot/npm_and_yarn/web/web-compatible-updates-b88bf02da5` | `c48e2b14af3e241bc660866871e3623b34a3dcca` | `c82dbece` | Retained master's modern dependencies (Next.js 15.5.26, Tailwind, modern auth/showcase). Updated Radix UI and tooling. Added `"root": true` to app ESLint configs. Regenerated `web/pnpm-lock.yaml`. |

## Dependency Resolution Details

### Backend Workspace
- **Superseded Updates:** Dependabot proposed older versions of `@nestjs/*`, `prisma`, and `@types/node` which were already updated to newer, secure versions on `master`.
- **Vulnerability Remediation (CVE-2026-118664):**
  - Dependency: `decode-uri-component` (< 0.5.1 vulnerable to DoS/ReDoS).
  - Fix: Specified `decode-uri-component: ^0.5.1` in `backend/pnpm-workspace.yaml` overrides.
  - Compatibility patch: Because `0.5.1` was published as ESM-only, breaking CommonJS Jest unit tests and `query-string@7.1.3` callers, dual CJS/ESM exports were introduced via `pnpm patch` to preserve zero-runtime-breakage across Jest and NestJS runtime.

### Web Workspace
- **Monorepo ESLint Isolation:** Added `"root": true` to `apps/customer/.eslintrc.json` and `apps/driver/.eslintrc.json` to prevent duplicate plugin resolution conflicts with the root `.eslintrc.json`.
- **Lockfile Integrity:** Fully regenerated and validated using `corepack pnpm install --frozen-lockfile`.

## Verification Evidence

All quality gates passed cleanly:
- **Backend:**
  - `corepack pnpm typecheck` -> PASS (0 errors)
  - `corepack pnpm lint` -> PASS (0 errors)
  - `corepack pnpm build` -> PASS (0 errors)
  - `corepack pnpm test` -> PASS (100% tests passing)
- **Web:**
  - `corepack pnpm typecheck` -> PASS (0 errors)
  - `corepack pnpm lint` -> PASS (0 errors)
  - `corepack pnpm test` -> PASS (44 test files, 145 tests passed)
  - `corepack pnpm build` -> PASS (All 4 applications: admin, customer, driver, restaurant built successfully)
- **Ancestry:**
  - `git merge-base --is-ancestor <sha> HEAD` evaluated to TRUE for all 10 source branch heads.
