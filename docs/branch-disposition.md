# Branch Disposition — Batch 4

## Current disposition

Audited on **2026-07-13** from `D:\Food_Delivery`.

| Scope | Verified state | Disposition |
|---|---|---|
| Remote | `origin/master@3f195a6374589b8433c45cb370dbc79cff00118f` is the only remote branch. | Keep one remote release branch. |
| Current local head | `master@477cb20c7fc82b0f8ca6ff2d409746ecefaf7ad7` is 3 ahead / 0 behind `origin/master`. | Provisional local state only; no release or push approval is implied. |
| `codex/batch4-integration` | Active linked worktree at `D:\Food_Delivery-worktrees\batch4-integration-restored`; branch is an ancestor of `master` with no unique commits (9 behind / 0 ahead of `origin/master`). | Never remove the worktree or local ref without its owner's approval, plus backup/patch checks. |
| `codex/foodflow-production-finalization` | Ancestor of `master`; remote tracking ref is gone and it has no unique commits (6 behind / 0 ahead of `origin/master`). | Cleanup candidate only; require owner approval and the same backup/patch checks. |

## Safety boundary

- Never raw-merge or push either historical branch by name.
- Preserve current commits and external database backups before reference cleanup.
- Re-run `git branch --no-merged master`, `git worktree list --porcelain`, and remote equivalence immediately before removal.
- Branch cleanup is independent of production approval; it does not prove Railway/Vercel health, current-SHA browser E2E, Firebase delivery, or mobile signing.
- The working tree contains untracked `backend/prisma/migrations/20260713070000_add_rag_knowledge_base`; runtime results that include it are dirty-workspace evidence, not final-head release proof until it is adopted.

## Verification commands

```powershell
git fetch --prune origin
git ls-remote --heads origin
git branch --no-merged master
git merge-base --is-ancestor codex/batch4-integration master
git merge-base --is-ancestor codex/foodflow-production-finalization master
git status --short
git rev-list --left-right --count origin/master...master
```

Only a final `0 0` comparison, owner approval, and the required backup/patch checks permit removal of the integration worktree or either historical local ref.
