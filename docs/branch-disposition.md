# Branch disposition — Batch 4 integration

Last audited: 2026-07-07. Remote cleanup has been rechecked at `118459e539eecb2dbd61e033431b7f4b5104f0e0`: `git ls-remote --heads origin` returns only `refs/heads/master`. The clean worktree still uses the local branch `codex/batch4-integration` for continuity and tracks `origin/master`; local hardening/docs commits may exist ahead of remote until deployment prerequisites are valid.

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
| `origin/master` | `118459e` | Contains the tested Batch 4 integration work, tracking authorization fix, Restaurant live delivery map, and validation-evidence docs refresh. `git ls-remote --heads origin` returns only `refs/heads/master`. | Keep as the only live remote branch. |

`origin/codex/batch4-integration` was deleted only after `origin/master` and `origin/codex/batch4-integration` both pointed at `3857433` and `git rev-list --left-right --count origin/master...origin/codex/batch4-integration` returned `0 0`.

## Local heads after cleanup

| Branch | Head at audit | Relationship | Disposition |
|---|---:|---|---|
| `codex/batch4-integration` | Tracks `origin/master` | Current clean worktree branch in `D:\Food_Delivery-worktrees\batch4-integration`, now tracking `origin/master` after the remote integration branch was deleted. | Safe local worktree branch for continued Batch 4 work; push future commits explicitly to `master` unless a new review branch is intentionally opened. |
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

- Backend passed frozen install, Prisma validate with explicit test `DATABASE_URL`/`DIRECT_URL`, `pnpm typecheck`, `pnpm lint`, full `pnpm exec jest --runInBand` (110 suites / 802 tests), and `pnpm build` before this hardening refresh. Latest hardening rerun after `17e4661` passed full backend Jest again: 110 suites / 802 tests.
- Web passed frozen install, `pnpm typecheck`, `pnpm lint`, full Vitest (Admin 37 files / 155 tests; Restaurant 31 files / 100 tests), and `pnpm build` before this hardening refresh. Latest hardening rerun after `17e4661` passed web `pnpm typecheck`, `pnpm lint`, and full Vitest again: Admin 37 files / 155 tests; Restaurant 31 files / 100 tests.
- Docker Compose rebuilt Backend/Admin/Restaurant from the current source and all three containers were healthy. Health endpoints returned OK for backend, Admin, and Restaurant.
- Playwright passed Chromium + Firefox together: 70/70 tests. Coverage includes admin dashboard, Restaurant order management, customer order flow, realtime tracking, tenant isolation, visual contract, and the axe serious/critical smoke check. The verified local run used IPv6 loopback URLs because a separate local Node process was listening on `127.0.0.1:3000`.
- Mobile passed `flutter pub get --enforce-lockfile`, `flutter analyze`, full `flutter test` (225 tests), targeted route/heatmap tests, and `flutter build apk --debug` before this hardening refresh. Latest hardening rerun after `17e4661` passed `flutter analyze` and full `flutter test` again: 225 tests.
- OpenAPI/Spectral lint passed via `npx -y @stoplight/spectral-cli lint docs/openapi.yaml --ruleset docs/openapi/.spectral.yaml --fail-severity error`.
- High-confidence tracked-file and staged-diff secret scans returned no live provider token or private key matches. `gitleaks` is not installed in the local PATH, so run Gitleaks again in CI when Actions auth is restored.

## Current conclusion

GitHub should show only one remote branch: `master`. The former remote `codex/batch4-integration` branch was deleted after it was patch-equivalent to `master`.

Batch 4 is not production-deployed yet. Remote GitHub Actions for the current master head have not produced fresh green workflow evidence because the user reported token/auth access issues. The Vercel project `food-delivery-app` now exists and is linked, but its production env list is empty. Supabase CLI is available through `npx supabase`, but project auth and production DB URLs are still missing, so the preflight guard stops before migration/deploy. Rerun Mobile CI, CI, Build Check, Lint, Gitleaks, CodeQL, Trivy, SBOM, E2E Tests, and Integration Smoke Gate after Actions access is restored and before any Supabase or Vercel deployment.
