# Documentation Localization Policy

FoodFlow documentation is maintained in three languages:

| Locale | File convention | Audience |
|---|---|---|
| English | `*.md` | Default source, engineering and deployment operations |
| Vietnamese | `*.vi.md` | Product owner, local operations, Vietnamese contributors |
| Japanese | `*.ja.md` | Japanese stakeholders and reviewers |

## Rules

- Every new high-level user-facing or operator-facing guide must ship with English, Vietnamese, and Japanese versions.
- English is the source document for command accuracy and code references.
- Vietnamese and Japanese files should preserve commands, paths, env var names, endpoint names, and code identifiers exactly.
- If a translation cannot be completed in the same commit, add the missing locale to the PR checklist and do not mark docs complete.
- Do not translate secrets, env var names, route paths, file paths, commit hashes, package names, or CLI flags.

## Current localized docs

- Project overview: [EN](../README.md), [VI](readme.vi.md), [JA](readme.ja.md)
- Deployment: [EN](deployment-guide.md), [VI](deployment-guide.vi.md), [JA](deployment-guide.ja.md)
- Testing: [EN](testing-guide.md), [VI](testing-guide.vi.md), [JA](testing-guide.ja.md)
