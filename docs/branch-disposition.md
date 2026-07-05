# Branch disposition — Batch 4 integration

Last audited: 2026-07-05 after `codex/batch4-integration` was fast-forwarded into `master` at `3857433`.

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
| `origin/master` | `3857433` | Contains the tested Batch 4 integration work. `git ls-remote --heads origin` returns only `refs/heads/master`. | Keep as the only live remote branch. |

`origin/codex/batch4-integration` was deleted only after `origin/master` and `origin/codex/batch4-integration` both pointed at `3857433` and `git rev-list --left-right --count origin/master...origin/codex/batch4-integration` returned `0 0`.

## Local heads after cleanup

| Branch | Head at audit | Relationship | Disposition |
|---|---:|---|---|
| `codex/batch4-integration` | `3857433` | Current clean worktree branch in `D:\Food_Delivery-worktrees\batch4-integration`, now tracking `origin/master` after the remote integration branch was deleted. | Safe local worktree branch for continued Batch 4 work; push future commits explicitly to `master` unless a new review branch is intentionally opened. |
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

- Backend passed `pnpm typecheck`, `pnpm lint`, `pnpm build`, and full `pnpm test` (107 suites / 760 tests).
- Web passed `pnpm typecheck`, `pnpm lint`, `pnpm test` (Admin 35 files / 144 tests; Restaurant 28 files / 83 tests), and `pnpm build`.
- Playwright passed Chromium + Firefox together: 70/70 tests. Coverage includes admin dashboard, Restaurant order management, customer order flow, realtime tracking, tenant isolation, visual contract, and the axe serious/critical smoke check.
- Docker Compose rebuilt the backend with the dispatch/map fixes; backend, Admin, and Restaurant health endpoints returned 200.
- Dispatch/map fixes at `fe80e5f` enqueue restaurant coordinates and attempt metadata, handle legacy malformed jobs without requeue loops, parse ioredis `GEOSEARCH WITHDIST` tuple rows correctly, and retry order-code collisions before payment side effects.
- Route/ETA follow-up prevents speed-based fabricated ETA on `driver:assigned`; ETA remains `null` until the tracking layer has Google/OSRM route data.
- E2E localization fixes at `3857433` route Admin and Restaurant tests through `/:locale` URLs and assert localized Vietnamese/Japanese/English UI text.
- High-confidence tracked-file secret scan returned no private keys or provider token patterns, and no tracked dotenv/key/credential files exist outside `.env.example` files.

## Current conclusion

GitHub should show only one remote branch: `master`. The former remote `codex/batch4-integration` branch was deleted after it was patch-equivalent to `master`.

Batch 4 is not production-deployed yet. Remote GitHub Actions for the current master head have not produced fresh green workflow evidence because the user reported token/auth access issues. Rerun Mobile CI, CI, Build Check, Lint, Gitleaks, CodeQL, Trivy, SBOM, E2E Tests, and Integration Smoke Gate after Actions access is restored and before any Supabase or Vercel deployment.
