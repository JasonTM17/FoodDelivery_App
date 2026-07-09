# Branch disposition — Batch 4 integration

Last audited: 2026-07-09. A fresh `git fetch --prune origin` found new Dependabot heads in addition to `origin/master@118459e539eecb2dbd61e033431b7f4b5104f0e0`. The clean worktree still uses the local branch `codex/batch4-integration` for continuity and tracks `origin/master`; after controlled Dependabot salvage through `43d577d`, `git status --short --branch` reports `codex/batch4-integration...origin/master [ahead 79]`. Do not delete the local integration branch until those commits and any later docs/evidence commits are pushed to `master` and `git rev-list --left-right --count origin/master...codex/batch4-integration` returns `0 0`.

This record documents the branch state used for Batch 4 salvage and cleanup decisions. It is intentionally evidence-based: do not delete, force-push, or raw-merge any branch from this table without a fresh backup and a new audit.

## Audit commands

```bash
git fetch --all --prune
git ls-remote --heads origin
git branch -vv --all
git rev-list --left-right --count origin/master...<branch>
git merge-base --is-ancestor <base> <head>
git diff --stat <base>...<head>
git tag -l "backup/*" --format="%(refname:short) %(objectname:short) %(subject)"
```

## Current remote heads

| Branch | Head at audit | Relationship | Disposition |
|---|---:|---|---|
| `origin/master` | `118459e` | Intended fast-forward target for the clean integration head. | Keep as the long-lived production branch; update it only after production env/auth and local/remote gates are valid. |
| `origin/dependabot/github_actions/actions/checkout-7` | `b2ba116` | Salvaged into `0b44a54 chore(ci): bump checkout action`; `git cherry -v HEAD origin/dependabot/github_actions/actions/checkout-7` reports the Dependabot commit with `-`, so the patch is equivalent in local HEAD. | Delete only after `0b44a54` reaches `origin/master`; safe cleanup candidate. |
| `origin/dependabot/npm_and_yarn/web/autoprefixer-10.5.2` | `31ad316` | Semantically superseded by the combined web dependency commit `43d577d`, which updates Admin and Restaurant `autoprefixer` to `^10.5.2` with one resolved lockfile. | Delete only after `43d577d` reaches `origin/master`; superseded by controlled combined commit rather than patch-id identical. |
| `origin/dependabot/npm_and_yarn/web/radix-ui/react-accordion-1.2.16` | `672dc53` | Semantically superseded by `43d577d`, which updates `@foodflow/ui` accordion to `^1.2.16` with the shared lockfile. | Delete only after `43d577d` reaches `origin/master`; superseded by controlled combined commit. |
| `origin/dependabot/npm_and_yarn/web/radix-ui/react-dropdown-menu-2.1.20` | `3e04fd5` | Semantically superseded by `43d577d`, which updates Admin and UI dropdown menu to `^2.1.20` with the shared lockfile. | Delete only after `43d577d` reaches `origin/master`; superseded by controlled combined commit. |
| `origin/dependabot/npm_and_yarn/web/radix-ui/react-slot-1.3.0` | `e866a46` | Semantically superseded by `43d577d`, which updates Admin and UI slot to `^1.3.0` with the shared lockfile. | Delete only after `43d577d` reaches `origin/master`; superseded by controlled combined commit. |
| `origin/dependabot/npm_and_yarn/web/radix-ui/react-switch-1.3.3` | `ae40f1a` | Semantically superseded by `43d577d`, which updates Admin and UI switch to `^1.3.3` with the shared lockfile. | Delete only after `43d577d` reaches `origin/master`; superseded by controlled combined commit. |
| `origin/dependabot/npm_and_yarn/web/react-hook-form-7.81.0` | `493c7ac` | Semantically superseded by `43d577d`, which updates Admin `react-hook-form` to `^7.81.0` with the shared lockfile. | Delete only after `43d577d` reaches `origin/master`; superseded by controlled combined commit. |
| `origin/dependabot/docker/backend/node-26-bookworm-slim` | `ccd0dfe` | Runtime major image bump; not merged into production integration because Vercel/local Node/runtime compatibility should be migrated and tested as a dedicated platform update. | Keep pending or close as rejected after a backup/ref is agreed; do not merge into Batch 4 release gate. |
| `origin/dependabot/npm_and_yarn/web/eslint-10.6.0` | `8cd78d4` | ESLint major bump; not merged because current Next lint path and `eslint-config-next@15.5.18` still run on ESLint 8 in the verified gate. | Keep pending for a dedicated lint migration; do not merge into Batch 4 release gate. |
| `origin/dependabot/npm_and_yarn/web/jsdom-29.1.1` | `1c6a819` | jsdom major bump; not merged because the current Vitest/jsdom stack is already green and this requires focused DOM/runtime compatibility review. | Keep pending for a dedicated test-runtime migration; do not merge into Batch 4 release gate. |
| `origin/dependabot/npm_and_yarn/web/multi-b0dfc253ff` | `6371684` | React 19 and `@types/react` major bump without matching `react-dom` migration in the inspected manifest diff; not safe for the Batch 4 release gate. | Keep pending/reject for now; a React 19 migration must update peer/runtime packages and run the full web/E2E suite separately. |
| `origin/dependabot/npm_and_yarn/web/vitest/coverage-v8-4.1.10` | `d2c47fd` | Coverage provider major bump while app Vitest remains `^3.2.6`; not merged because it should be paired with a Vitest 4 migration. | Keep pending for a dedicated Vitest migration; do not merge into Batch 4 release gate. |

`origin/codex/batch4-integration` was deleted only after `origin/master` and `origin/codex/batch4-integration` both pointed at `3857433` and `git rev-list --left-right --count origin/master...origin/codex/batch4-integration` returned `0 0`.

## Local heads after cleanup

| Branch | Head at audit | Relationship | Disposition |
|---|---:|---|---|
| `codex/batch4-integration` | `43d577d` at latest code audit | Current clean worktree branch in `D:\Food_Delivery-worktrees\batch4-integration`, tracking `origin/master` after the remote integration branch was deleted. `git status --short --branch` returned `[ahead 79]` after the controlled Dependabot salvage commits. | Safe local worktree branch for continued Batch 4 work. The merge-to-single-branch step is `git push origin HEAD:master` only after production env/auth and gates are valid; delete the local branch only after patch-equivalence is rechecked. |
| `master` | `4fb2799` | Checked out in dirty root worktree `D:\Food_Delivery`; behind `origin/master` after Batch 4 was merged. | Do not switch, reset, delete, or mutate from the Batch 4 clean worktree. |

## Cleaned-up branch refs

| Branch ref | Deleted head | Cleanup evidence | Backup |
|---|---:|---|---|
| `origin/codex/batch4-integration` | `3857433` | Fast-forwarded into `origin/master`; patch-equivalent to `master` (`0 0`) before deletion on 2026-07-05. | Covered by `origin/master@3857433`; no unique branch-only commits remained at deletion time. |
| `origin/batch4-integration` | `032a6c0` | `merge-base --is-ancestor origin/batch4-integration HEAD` passed; `git log --cherry-pick --right-only HEAD...origin/batch4-integration` returned zero commits; remote branch deleted on 2026-07-04. | Remote tag `backup/batch4-integration-20260704-032a6c0` points to the deleted head. |
| local `batch4-integration` | `032a6c0` | Same head as the deleted remote branch; local branch deleted after the backup tag was pushed. | Remote tag `backup/batch4-integration-20260704-032a6c0` points to the deleted head. |

## Missing branch refs

The current remote head list does not include Violet, Indigo, Amber, Steel, audit, or mobile reconciliation branches. That means there is no live branch ref to raw-merge or cherry-pick from in the current repository state.

When those branches become available again, reconcile them with this workflow:

1. Fetch the branch and record its head SHA here.
2. Compare with `git diff --stat origin/master...origin/<branch>`.
3. Inspect changed files before applying any patch.
4. Salvage hunk-by-hunk into the clean worktree.
5. Run focused tests for each salvaged behavior.
6. Commit with a small conventional commit.
7. Mark the source branch as `patch-equivalent`, `superseded`, `partially salvaged`, or `rejected` with the commit SHA that proves it.

## Latest local evidence for merged Batch 4 worktree

- Full local release gate after `edd906d` passed with deploy preflight intentionally skipped: frozen installs, high-confidence secret scan, backend Prisma validate/typecheck/lint/full Jest (111 suites / 823 tests), web typecheck/lint/full Vitest, OpenAPI Spectral, Docker Compose config, mobile `flutter analyze`, and full `flutter test` 252/252.
- On 2026-07-09 at `7c6d1c2`, `docker compose build backend admin restaurant` passed and produced current-source app images; `docker compose up -d backend admin restaurant` recreated the app containers after migration; all three app health endpoints returned 200 OK.
- Playwright passed Chromium + Firefox together after the 2026-07-09 current-source Docker refresh at `7c6d1c2`: 70/70 tests. Coverage includes admin dashboard, Restaurant order management, customer order flow, realtime tracking, tenant isolation, visual contract, and the axe serious/critical smoke check. The verified local run used IPv6 loopback URLs because a separate local Node process was listening on `127.0.0.1:3000`.
- Latest Admin overview contract hardening at `e1d9ae2` validates KPI and heatmap envelopes before rendering so malformed successful API payloads no longer become fake empty dashboard widgets. Focused Vitest passed 4/4, Admin typecheck/lint passed, full Admin Vitest passed 41 files / 171 tests with a 4GB serial worker run, and Admin build passed 70 localized pages.
- Latest Restaurant tracking geometry hardening at `d0859bc` fails closed on malformed/overflowing backend polylines, filters Restaurant live-tracking route overlays and driver GPS events to Vietnam delivery bounds, and preserves valid `0 min` ETA display. Focused backend Jest passed 15/15, focused Restaurant Vitest passed 7/7, backend typecheck/lint/build passed, Restaurant typecheck/lint/build passed, and the current-source Docker/Playwright refresh above passed after the patch.
- Latest Restaurant promotion scope hardening at `0900842` rejects category/item scoped promotions without explicit category/item targets before overlap checks or DB writes, prevents update requests from deleting an existing scope and replacing it with global scope, and adds a Restaurant menu category selector backed by `/restaurant/menu/categories`. Focused backend Jest passed 13/13, backend typecheck/lint/build passed, focused Restaurant promotion tests passed 14/14, Restaurant typecheck/lint/build passed, and full Restaurant Vitest passed 33 files / 111 tests.
- Latest notification hardening at `7d465ea` reports failed channel fanout honestly, fails closed on settings/locale lookup errors, and rejects missing templates instead of synthesizing notification content. Focused notifications Jest passed 16/16, all notification specs passed 4 suites / 20 tests, and backend typecheck/lint/build passed.
- Latest Restaurant menu editor hardening at `01e3a2e` rejects malformed edit payloads missing editable `options`/`allergens` arrays before rendering the form, preventing accidental save-back of empty arrays. Focused menu editor Vitest passed 3/3, Restaurant typecheck/lint/build passed, and lint had no warnings after the hook dependency fix.
- Latest Admin analytics hardening at `e87c9eb` validates `/admin/kpis` and `/admin/charts` envelopes at runtime so malformed successful responses hit retryable error UI instead of fake empty cards/charts. Focused analytics tests passed 5/5, Admin typecheck/lint/build passed, and full Admin Vitest passed 42 files / 175 tests.
- Earlier backend/web/mobile release evidence remains superseded by the 2026-07-07 `89f0d0e` local release gate above.
- Earlier mobile packaging evidence passed `flutter pub get --enforce-lockfile`, `flutter analyze`, full `flutter test`, targeted route/heatmap tests, and `flutter build apk --debug`; the current `89f0d0e` release gate supersedes the analyze/test portion with 229/229 tests.
- Latest mobile i18n hardening at `d42d2d8` moved order status and shared empty/error/availability labels out of hardcoded model/UI strings into generated vi/en/ja localization, and reran `flutter analyze`, focused i18n tests 16/16, plus full `flutter test` successfully: 226/226 tests.
- Latest mobile nearby/filter contract hardening at `94d4e18` moved customer nearby calls to `lat`/`lng`, fails closed when GPS is missing, uses canonical/real cuisine values instead of UI labels for filtering, localized browse/search/driver-history labels in vi/en/ja, and reran `flutter analyze`, focused nearby+i18n tests 19/19, plus full `flutter test` successfully: 229/229 tests.
- Latest backend dispatch/tracking hardening through `c825ad5` emits customer/restaurant order-facing dispatch events on the `/events` orders gateway, keeps `/dispatch` driver-only, and persists real provider route distance/duration/geometry into `delivery_tasks` by pickup/dropoff phase. Focused route/dispatch rerun passed 5 Jest suites / 60 tests plus backend `pnpm typecheck` and `pnpm lint`.
- Latest Restaurant notifications/reviews hardening at `c461115` and the subsequent docs evidence update at `188a256` validate malformed envelopes and document the current-source build evidence. Focused Restaurant Vitest, typecheck, lint, full Restaurant Vitest, and Restaurant build passed before the 2026-07-08 Docker/E2E refresh.
- Docker publish workflow now targets the live `master` branch at `b507a1a`; YAML parsed successfully and `branches = [master]`.
- OpenAPI/Spectral lint passed via `npx -y @stoplight/spectral-cli lint docs/openapi.yaml --ruleset docs/openapi/.spectral.yaml --fail-severity error`.
- High-confidence tracked-file and staged-diff secret scans returned no live provider token or private key matches. `gitleaks` is not installed in the local PATH, so run Gitleaks again in CI when Actions auth is restored.
- Controlled Dependabot salvage on 2026-07-09:
  - `0b44a54 chore(ci): bump checkout action` salvaged `actions/checkout@7` across GitHub workflows; staged whitespace and high-confidence secret scans passed before commit.
  - `43d577d chore(web): update safe dependabot packages` combined safe web minor/patch bumps (`autoprefixer`, Radix accordion/dropdown/slot/switch, `react-hook-form`) into one lockfile generated by `pnpm`, followed by `pnpm install --frozen-lockfile`, Admin/Restaurant typecheck, lint, full Vitest (Admin 42 files / 175 tests; Restaurant 33 files / 112 tests), and local-env production builds (Admin 70 localized pages; Restaurant 55 localized pages).

## Current conclusion

GitHub currently shows `master` plus new Dependabot branches fetched on 2026-07-09. The former remote `codex/batch4-integration` branch was deleted after it was patch-equivalent to `master`, and no remote Codex integration branch was recreated. The local `codex/batch4-integration` branch is intentionally retained because it contains unpushed hardening commits; deleting it before `HEAD` reaches `origin/master` would lose that integration line.

Batch 4 is not production-deployed yet. Remote GitHub Actions for the current master head have not produced fresh green workflow evidence because the user reported token/auth access issues. Vercel API/Admin/Restaurant project shells exist and are linked, but production preflight still fails safely on missing real env/secrets across the three projects. Supabase MCP is OAuth logged in for project ref `lvanszgszzfopusboich`, but Supabase CLI deploy still lacks `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `DATABASE_URL`, and `DIRECT_URL`, so the preflight guard stops before migration/deploy. Rerun Mobile CI, CI, Build Check, Lint, Gitleaks, CodeQL, Trivy, SBOM, E2E Tests, and Integration Smoke Gate after Actions access is restored and before any Supabase or Vercel deployment.
