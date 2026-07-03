# Branch disposition — Batch 4 integration

Last audited: 2026-07-03 on `codex/batch4-integration`.

This record documents the branch state used for Batch 4 salvage decisions. It is intentionally evidence-based: do not delete, force-push, or raw-merge any branch from this table without a fresh backup and a new audit.

## Audit commands

```bash
git fetch --all --prune
git ls-remote --heads origin
git for-each-ref --sort=-committerdate --format="%(committerdate:short) %(refname:short) %(objectname:short) %(subject)" refs/remotes/origin refs/heads
git merge-base --is-ancestor <branch> HEAD
git rev-list --left-right --count HEAD...<branch>
git diff --stat HEAD...<branch>
```

## Remote heads

| Branch | Head at audit | Relationship to `codex/batch4-integration` | Disposition |
|---|---:|---|---|
| `origin/codex/batch4-integration` | `d165abd` | Active integration branch. | Keep and continue focused commits here. |
| `origin/batch4-integration` | `032a6c0` | Ancestor of `codex/batch4-integration`; no files differ with `HEAD...origin/batch4-integration`. | Superseded by `codex/batch4-integration`; do not raw-merge. Safe cleanup only after backup and explicit approval. |
| `origin/master` | `b675c09` | Ancestor of `codex/batch4-integration`; no files differ with `HEAD...origin/master`. | Historical remote baseline; keep until release/PR policy decides otherwise. |

## Local heads

| Branch | Head at audit | Relationship to `codex/batch4-integration` | Disposition |
|---|---:|---|---|
| `codex/batch4-integration` | `d165abd` | Current working branch, tracking `origin/codex/batch4-integration`. | Active. |
| `batch4-integration` | `032a6c0` | Ancestor of current branch; same commit as `origin/batch4-integration`. | Superseded by current branch. |
| `master` | `4fb2799` | Ancestor of current branch; no files differ with `HEAD...master`. | Local historical branch. Do not use as Batch 4 target. |

## Missing branch refs

The current remote head list does not include Violet, Indigo, Amber, Steel, audit, or mobile reconciliation branches. That means there is no live branch ref to raw-merge or cherry-pick from in the current repository state.

When those branches become available again, reconcile them with this workflow:

1. Fetch the branch and record its head SHA here.
2. Compare with `git diff --stat codex/batch4-integration...origin/<branch>`.
3. Inspect changed files before applying any patch.
4. Salvage hunk-by-hunk into `codex/batch4-integration`.
5. Run focused tests for each salvaged behavior.
6. Commit with a small conventional commit.
7. Mark the source branch as `patch-equivalent`, `superseded`, `partially salvaged`, or `rejected` with the commit SHA that proves it.

## Current conclusion

No branch merge is required from the branch refs currently available. Batch 4 integration already contains all commits reachable from the live remote/local branch heads listed above. Mobile Violet/Indigo reconciliation remains pending because no such branch refs are available in `origin` at this audit point.
