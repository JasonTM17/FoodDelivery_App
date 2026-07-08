# Branch disposition — Batch 4 integration

Last audited: 2026-07-08. Remote cleanup has been rechecked at `118459e539eecb2dbd61e033431b7f4b5104f0e0`: `git ls-remote --heads origin` returns only `refs/heads/master`. The clean worktree still uses the local branch `codex/batch4-integration` for continuity and tracks `origin/master`; the latest local code audit found it is a fast-forward candidate with 55 local commits ahead of `origin/master` through `188a256` before this docs refresh. Do not delete the local integration branch until those commits and any later docs/evidence commits are pushed to `master` and `git rev-list --left-right --count origin/master...codex/batch4-integration` returns `0 0`.

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

## Remote heads after cleanup

| Branch | Head at audit | Relationship | Disposition |
|---|---:|---|---|
| `origin/master` | `118459e` | Only live remote branch and the intended fast-forward target for the clean integration head. `git ls-remote --heads origin` returns only `refs/heads/master`. | Keep as the only live remote branch; update it only after production env/auth and local/remote gates are valid. |

`origin/codex/batch4-integration` was deleted only after `origin/master` and `origin/codex/batch4-integration` both pointed at `3857433` and `git rev-list --left-right --count origin/master...origin/codex/batch4-integration` returned `0 0`.

## Local heads after cleanup

| Branch | Head at audit | Relationship | Disposition |
|---|---:|---|---|
| `codex/batch4-integration` | `188a256` at code audit | Current clean worktree branch in `D:\Food_Delivery-worktrees\batch4-integration`, tracking `origin/master` after the remote integration branch was deleted. `git rev-list --left-right --count origin/master...HEAD` returned `0 55`, and `origin/master` is an ancestor of HEAD before this docs refresh. | Safe local worktree branch for continued Batch 4 work. The merge-to-single-branch step is `git push origin HEAD:master` only after production env/auth and gates are valid; delete the local branch only after patch-equivalence is rechecked. |
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
- On 2026-07-08 at `188a256`, `docker compose build --progress=plain backend`, `admin`, and `restaurant` passed; `docker compose up -d backend admin restaurant` recreated the current-source app containers after migration; all three app health endpoints returned OK.
- Playwright passed Chromium + Firefox together after the 2026-07-08 current-source Docker refresh: 70/70 tests. Coverage includes admin dashboard, Restaurant order management, customer order flow, realtime tracking, tenant isolation, visual contract, and the axe serious/critical smoke check. The verified local run used IPv6 loopback URLs because a separate local Node process was listening on `127.0.0.1:3000`.
- Earlier backend/web/mobile release evidence remains superseded by the 2026-07-07 `89f0d0e` local release gate above.
- Earlier mobile packaging evidence passed `flutter pub get --enforce-lockfile`, `flutter analyze`, full `flutter test`, targeted route/heatmap tests, and `flutter build apk --debug`; the current `89f0d0e` release gate supersedes the analyze/test portion with 229/229 tests.
- Latest mobile i18n hardening at `d42d2d8` moved order status and shared empty/error/availability labels out of hardcoded model/UI strings into generated vi/en/ja localization, and reran `flutter analyze`, focused i18n tests 16/16, plus full `flutter test` successfully: 226/226 tests.
- Latest mobile nearby/filter contract hardening at `94d4e18` moved customer nearby calls to `lat`/`lng`, fails closed when GPS is missing, uses canonical/real cuisine values instead of UI labels for filtering, localized browse/search/driver-history labels in vi/en/ja, and reran `flutter analyze`, focused nearby+i18n tests 19/19, plus full `flutter test` successfully: 229/229 tests.
- Latest backend dispatch/tracking hardening through `c825ad5` emits customer/restaurant order-facing dispatch events on the `/events` orders gateway, keeps `/dispatch` driver-only, and persists real provider route distance/duration/geometry into `delivery_tasks` by pickup/dropoff phase. Focused route/dispatch rerun passed 5 Jest suites / 60 tests plus backend `pnpm typecheck` and `pnpm lint`.
- Latest Restaurant notifications/reviews hardening at `c461115` and the subsequent docs evidence update at `188a256` validate malformed envelopes and document the current-source build evidence. Focused Restaurant Vitest, typecheck, lint, full Restaurant Vitest, and Restaurant build passed before the 2026-07-08 Docker/E2E refresh.
- Docker publish workflow now targets the live `master` branch at `b507a1a`; YAML parsed successfully and `branches = [master]`.
- OpenAPI/Spectral lint passed via `npx -y @stoplight/spectral-cli lint docs/openapi.yaml --ruleset docs/openapi/.spectral.yaml --fail-severity error`.
- High-confidence tracked-file and staged-diff secret scans returned no live provider token or private key matches. `gitleaks` is not installed in the local PATH, so run Gitleaks again in CI when Actions auth is restored.

## Current conclusion

GitHub should show only one remote branch: `master`. The former remote `codex/batch4-integration` branch was deleted after it was patch-equivalent to `master`. The local `codex/batch4-integration` branch is intentionally retained because it contains unpushed hardening commits; deleting it before `HEAD` reaches `origin/master` would lose that integration line.

Batch 4 is not production-deployed yet. Remote GitHub Actions for the current master head have not produced fresh green workflow evidence because the user reported token/auth access issues. The Vercel project `food-delivery-app` now exists and is linked, but the Admin production env list is missing `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`, `NEXT_PUBLIC_ADMIN_URL`, and `NEXT_PUBLIC_GOOGLE_MAPS_KEY`. Supabase MCP is OAuth logged in for project ref `lvanszgszzfopusboich`, but Supabase CLI deploy still lacks `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `DATABASE_URL`, and `DIRECT_URL`, so the preflight guard stops before migration/deploy. Rerun Mobile CI, CI, Build Check, Lint, Gitleaks, CodeQL, Trivy, SBOM, E2E Tests, and Integration Smoke Gate after Actions access is restored and before any Supabase or Vercel deployment.
