# Branch Disposition — Batch 4

## Audited disposition

Audit date: **2026-07-14**. Branch facts below were read at `e505fe06e72b933745aca656f014966134c2c4e0`; pending working-tree changes are outside this topology audit.

| Scope | Verified state | Disposition |
|---|---|---|
| Release ref | `master` and `origin/master` both resolve to `e505fe06e72b933745aca656f014966134c2c4e0`. | Keep `master` as the release ref. Local equivalence is not production approval. |
| Remote refs | `origin/master` is the only remote branch. | No remote branch action. |
| Legacy local ref | `worktree-agent-a62965db0e804d23d` is an obsolete, merged, non-release local ref. Its merge-base with `master` is `51f377d1a517d9adabce72ca5151d223f5e12d33`; `master...legacy` is `19/0`, so `master` is 19 commits ahead and the legacy ref has no unique commits. | Retain it. Do not raw-merge, recreate, push, or delete it without explicit direction. |
| Worktrees and unmerged refs | No linked worktree exists for the legacy ref, and `git branch --no-merged master` is empty. | No cleanup action is authorized. |

## Evidence boundary

- Current source and Supabase production are aligned at 36 checksum-verified migrations; migration 36's `token,registration_id` primary key was verified directly.
- This migration boundary does not turn local branch equivalence into production approval.
- The audit does not prove Railway/API health, provider configuration, controlled live FCM delivery, browser E2E, or release readiness.

## Read-only verification commands

```powershell
$legacy = 'worktree-agent-a62965db0e804d23d'

git rev-parse master
git rev-parse origin/master
git ls-remote --heads origin
git merge-base master $legacy
git rev-list --left-right --count master...$legacy  # expected: 19 0
git rev-list --count "$legacy..master"             # expected: 19
git branch --no-merged master                       # expected: no output
git worktree list --porcelain
git status --short
```

Re-run these checks before requesting a future branch or worktree action. They do not authorize a merge, push, recreation, deletion, or production release.
