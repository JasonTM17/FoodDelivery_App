# Branch disposition

## Current policy

`master` is the only long-lived release branch. All other branches are temporary and must follow this lifecycle:

1. keep the change focused;
2. pass CI, security, build, and relevant test gates;
3. merge through a pull request;
4. delete the source branch after merge.

Dependabot groups compatible minor and patch updates to keep review volume manageable. Runtime and tooling major versions are intentionally excluded from routine batches because they require a dedicated migration, compatibility review, and complete regression gate. Security updates remain enabled.

## 2026-07-16 consolidation

The consolidation into `master` uses one reviewed integration branch instead of merging a queue of overlapping or failing branches independently.

| Disposition | Pull requests | Reason |
| --- | --- | --- |
| Integrated with original history | #81, #82, #83 | Production-role smoke hardening, pinned backend runtime image, and current `setup-node` action passed their focused checks. |
| Consolidated as compatible updates | #84, #86, #87, #88, #90, #91, #92, #98, #101, #103 | Patch/minor framework and tooling updates were applied together so the lockfiles and peer dependencies are verified as one coherent state. |
| Deferred to migration work | #85, #89, #93, #94, #96, #97, #99, #100, #102 | These change a major runtime, framework, lint, type, or build-tool contract and are not safe routine maintenance. |
| Deferred by supply-chain policy | #95 | The proposed Supabase release did not meet the repository minimum-release-age gate at audit time. |

After the integration pull request lands, superseded pull requests are closed with their disposition recorded and all temporary remote branches are deleted. The final branch audit must show only `refs/heads/master` and no open pull requests.

## Follow-up engineering work

The consolidation is safe for the reviewed path, but these items remain explicit follow-up work rather than hidden assumptions:

- run the production-role migration off-peak and monitor lock waits because the foreign-key/index rollout is transactional;
- provide a disposable PostgreSQL target in CI if destructive fixture integration coverage is promoted from opt-in to a required gate;
- add process-level coverage for signal interruption, lease reacquisition, and capability-drain recovery;
- define retention/archival for completed `production_role_smoke_runs` tombstones;
- keep user deletion flows on the deactivation path unless a future GDPR/admin-delete design explicitly handles the new `ON DELETE RESTRICT` constraints.

## Verification

Run the following commands against the live remote rather than relying on cached local refs:

```powershell
git ls-remote --heads origin
gh pr list --repo JasonTM17/FoodDelivery_App --state open
gh run list --repo JasonTM17/FoodDelivery_App --branch master --limit 20
```

Branch ancestry and local test results are necessary evidence, but they do not replace the protected-branch checks on the final `master` commit.
