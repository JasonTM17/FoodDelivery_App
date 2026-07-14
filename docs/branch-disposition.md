# Branch Disposition — Batch 4

## Audited disposition

Audit date: **2026-07-14**. Local branch facts below were read at `eb598c7b7da40f122901a866e35050f3a2e98c1c`; pending working-tree changes are outside this topology audit.

| Scope | Verified state | Disposition |
|---|---|---|
| Release ref | Local `HEAD`, `master`, and cached `origin/master` resolve to `eb598c7b7da40f122901a866e35050f3a2e98c1c`. | Keep `master` as the release ref. Local equivalence is not production approval. |
| Remote refs | On 2026-07-14, external `git ls-remote --heads origin` returned exactly `eb598c7b7da40f122901a866e35050f3a2e98c1c` at `refs/heads/master`. | This dated observation is not a current local proof; no remote branch action is authorized. |
| Legacy local ref | `worktree-agent-a62965db0e804d23d` is an obsolete, merged, non-release local ref. Its merge-base with `master` is `51f377d1a517d9adabce72ca5151d223f5e12d33`; `master...legacy` is `24/0`, so `master` is 24 commits ahead and the legacy ref has no unique commits. | Retain it. Do not raw-merge, recreate, push, or delete it without explicit direction. |
| Worktrees and unmerged refs | The only linked worktree is already at merged commit `e4a9155c97b9247ce6933fe59dbe0355a52f6f5c`; `git branch --no-merged master` is empty. | No cleanup action is authorized. |

## Evidence boundary

- Separate external provider evidence recorded on 2026-07-14 reported 36 checksum-verified Supabase migrations and migration 36's `token,registration_id` primary key. This local branch audit does not re-verify that provider state.
- This migration boundary does not turn local branch equivalence into production approval.
- The audit does not prove Railway/API health, provider configuration, controlled live FCM delivery, browser E2E, or release readiness.

## Read-only verification commands

```powershell
$legacy = 'worktree-agent-a62965db0e804d23d'

git rev-parse master
git rev-parse origin/master
git ls-remote --heads origin
git merge-base master $legacy
git rev-list --left-right --count master...$legacy  # expected: 24 0
git rev-list --count "$legacy..master"             # expected: 24
git branch --no-merged master                       # expected: no output
git worktree list --porcelain
git status --short
```

Re-run these checks before requesting a future branch or worktree action. They do not authorize a merge, push, recreation, deletion, or production release.
