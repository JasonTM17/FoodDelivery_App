# Branch Disposition — Batch 4

## Audit snapshot

Last audited: **2026-07-10** from `D:\Food_Delivery-worktrees\batch4-integration-restored` after `git fetch --prune origin`.

| Scope | Ref | Commit | Decision |
|---|---|---|---|
| Remote | `origin/master` | `df945dd2c572e690a3c9e7aa31130c517ef83880` | Keep as the only long-lived remote branch. |
| Local integration | `codex/batch4-integration` | `e74a5b4` before this docs update | Keep until its verified `HEAD` is pushed directly to `master`. |
| Local root | `master` | `df945dd` | Do not touch; the root worktree contains user-owned dirty files. |
| Backup tag | `backup/batch4-integration-20260704-032a6c0` | preserved tag | Keep until release and cleanup evidence are complete. |
| Release tag | `v0.1.0` | historical | Keep as historical; it is not Batch 4. |

GitHub connector branch search and `git ls-remote --heads origin` both returned exactly one remote head: `master`. No remote `codex/batch4-integration`, Dependabot, Violet, Indigo, or other feature head exists at this snapshot.

Before the current docs edits:

```text
origin/master...codex/batch4-integration = 0 behind / 99 ahead
```

The integration line is therefore a fast-forward candidate, not a merge-commit candidate.

## Audit commands

```bash
git fetch --prune origin
git ls-remote --heads origin
git branch -vv
git worktree list --porcelain
git rev-list --left-right --count origin/master...codex/batch4-integration
git log --left-right --cherry-pick --oneline origin/master...codex/batch4-integration
git status --short --branch
```

Run the same commands immediately before push and cleanup. Remote UI screenshots are not sufficient evidence because they may be stale.

## Salvage and merge policy

- Never raw-merge a stale feature branch into Batch 4.
- First preserve a backup ref, inspect commits/files, and compare patch equivalence.
- Salvage one bounded cluster at a time with focused tests and a conventional commit.
- Reject changes that restore mock/fallback/random business data, stale generated API clients, unsafe secrets, or obsolete package-manager/runtime choices.
- Do not delete a branch merely because it was “merged”; confirm its unique patch set is present or intentionally superseded.
- Missing remote Violet/Indigo refs cannot be reconstructed or claimed as merged. Mobile reconciliation must proceed from code that actually exists in the current history.

## Why the local branch still exists

Deleting local `codex/batch4-integration` now would discard unpushed release work. Pushing it by name would recreate a second remote branch, violating the requested single-branch repository state. The safe release operation is a direct fast-forward from the verified integration `HEAD` to `origin/master`.

No branch mutation may touch the dirty root `D:\Food_Delivery`. The root is only relevant because it currently holds local `master`; its user-owned dirty files must remain intact.

## Final push procedure

Only after every release gate and production preflight is green:

```bash
git fetch --prune origin
git rev-list --left-right --count origin/master...HEAD   # must be 0 <ahead>
git merge-base --is-ancestor origin/master HEAD
git status --short                                # must be empty
git push origin HEAD:master
git fetch --prune origin
git rev-list --left-right --count origin/master...HEAD   # must be 0 0
git ls-remote --heads origin                       # must show only master
```

Then, without switching or cleaning the dirty root:

1. Detach/remove the clean integration worktree after confirming `HEAD == origin/master`.
2. Delete local `codex/batch4-integration` only when no worktree uses it.
3. Retain the backup tag until the release report, Docker digests, and production health evidence are archived.
4. Remove obsolete Docker Hub artifacts separately; deleting a Git branch does not delete registry tags.

## Current conclusion

Remote branch cleanup is already complete: only `master` remains. Final local cleanup and push are intentionally pending because production secrets/preflights, current-head remote CI, mobile Supabase realtime parity, and final full test gates are not yet complete.
