# Branch disposition — Batch 4 integration

Last audited: 2026-07-04 on `codex/batch4-integration` at `3252c6a`.

This record documents the branch state used for Batch 4 salvage decisions. It is intentionally evidence-based: do not delete, force-push, or raw-merge any branch from this table without a fresh backup and a new audit.

## Audit commands

```bash
git fetch --all --prune
git ls-remote --heads origin
git for-each-ref --sort=-committerdate --format="%(committerdate:short) %(refname:short) %(objectname:short) %(subject)" refs/remotes/origin refs/heads
git merge-base --is-ancestor <branch> HEAD
git rev-list --left-right --cherry-pick --count HEAD...<branch>
git diff --stat HEAD...<branch>
git tag -l "backup/*" --format="%(refname:short) %(objectname:short) %(subject)"
```

## Remote heads after cleanup

| Branch | Head at audit | Relationship to `codex/batch4-integration` | Disposition |
|---|---:|---|---|
| `origin/codex/batch4-integration` | `3252c6a` | Active integration branch; `HEAD...branch` cherry counts are `0 0` after push. | Keep and continue focused commits here. |
| `origin/master` | `b675c09` | Ancestor of `codex/batch4-integration`; `HEAD...branch` cherry counts are `340 0`, so the branch contributes no unique patch. | Historical remote baseline; keep until release/PR policy decides otherwise. |

## Local heads after cleanup

| Branch | Head at audit | Relationship to `codex/batch4-integration` | Disposition |
|---|---:|---|---|
| `codex/batch4-integration` | `3252c6a` | Current working branch, tracking `origin/codex/batch4-integration`; local backend, web, Restaurant, Docker/E2E, and mobile gates have current local evidence, while remote GitHub Actions are currently blocked by account token/auth or billing status. | Active. |
| `master` | `4fb2799` | Ancestor of current branch; `HEAD...branch` cherry counts are `110 0`. Checked out in dirty root worktree `D:\Food_Delivery`, so Batch 4 work did not switch, mutate, or delete it. | Local historical/default worktree branch. Do not use as Batch 4 target. |

## Cleaned-up branch refs

| Branch ref | Deleted head | Cleanup evidence | Backup |
|---|---:|---|---|
| `origin/batch4-integration` | `032a6c0` | `merge-base --is-ancestor origin/batch4-integration HEAD` passed; `git log --cherry-pick --right-only HEAD...origin/batch4-integration` returned zero commits; remote branch deleted on 2026-07-04. | Remote tag `backup/batch4-integration-20260704-032a6c0` points to the deleted head. |
| local `batch4-integration` | `032a6c0` | Same head as the deleted remote branch; local branch deleted after the backup tag was pushed. | Remote tag `backup/batch4-integration-20260704-032a6c0` points to the deleted head. |

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

No branch merge is required from the branch refs currently available. `git branch -a --no-merged HEAD` returned zero refs, and every live local/remote branch had `patchUniqueCount=0` against `3252c6a`. Batch 4 integration already contains or supersedes all commits reachable from the live remote/local branch heads listed above. The superseded `batch4-integration` branch was backed up to remote tag `backup/batch4-integration-20260704-032a6c0` before both the remote and local branch refs were deleted. The only live local branch besides `codex/batch4-integration` is `master`, which is checked out in the dirty root worktree `D:\Food_Delivery`; it is not a Batch 4 cleanup candidate. Mobile Violet/Indigo reconciliation remains pending as branch salvage work because no such branch refs are available in `origin` at this audit point. The mobile tree currently present on `codex/batch4-integration` was verified locally on 2026-07-04 with `flutter analyze` and full `flutter test` (143 tests passed) after driver route/navigation and delivery coordinate guard fixes.

Remote CI last fully ran green for `e776f5c`: Gitleaks Secret Scan, Lint, Build Check, SBOM Generation, Trivy Vulnerability Scan, CodeQL Security Scan, CI, E2E Tests, and Integration Smoke Gate all completed successfully. Integration Smoke Gate included AI Scenario Assertions, Playwright E2E, Lighthouse CI mobile/desktop, k6 Load Test, and the final Integration Gate. Run evidence: `28704171253` Gitleaks, `28704171260` Lint, `28704171258` Build Check, `28704171266` SBOM, `28704171279` Trivy, `28704171259` CodeQL, `28704171265` CI, `28704171252` E2E Tests, and `28704171294` Integration Smoke Gate. Mobile-specific CI last ran green for `0fe1895` as part of the dispatch/cancel localization commit.

Remote CI for the current Batch 4 heads after `78bf643`, including `3252c6a`, has not produced fresh green workflow evidence because GitHub Actions access is currently blocked by account token/auth or billing status. Previously observed affected workflows include Mobile CI, CI, Build Check, Lint, Gitleaks, CodeQL, Trivy, SBOM, E2E Tests, and Integration Smoke Gate. Rerun all of them after Actions access is restored before deploying.
