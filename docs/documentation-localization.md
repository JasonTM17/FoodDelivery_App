# Documentation Localization Policy

Languages: [English](./documentation-localization.md) | [Tiếng Việt](./documentation-localization.vi.md) | [日本語](./documentation-localization.ja.md)

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
- API contract: [EN](api-contract.md), [VI](api-contract.vi.md), [JA](api-contract.ja.md)
- Code standards: [EN](code-standards.md), [VI](code-standards.vi.md), [JA](code-standards.ja.md)
- Project roadmap: [EN](project-roadmap.md), [VI](project-roadmap.vi.md), [JA](project-roadmap.ja.md)
- Deployment: [EN](deployment-guide.md), [VI](deployment-guide.vi.md), [JA](deployment-guide.ja.md)
- Docker/local: [EN](docker-local-dev-guide.md), [VI](docker-local-dev-guide.vi.md), [JA](docker-local-dev-guide.ja.md)
- Testing: [EN](testing-guide.md), [VI](testing-guide.vi.md), [JA](testing-guide.ja.md)
- AI chatbot: [EN](ai-chatbot-guide.md), [VI](ai-chatbot-guide.vi.md), [JA](ai-chatbot-guide.ja.md)
- Security and secret policy: [EN](security-audit-guide.md), [VI](security-audit-guide.vi.md), [JA](security-audit-guide.ja.md)
- Product gallery: [EN](product-gallery.md), [VI](product-gallery.vi.md), [JA](product-gallery.ja.md)
- Documentation localization policy: [EN](documentation-localization.md), [VI](documentation-localization.vi.md), [JA](documentation-localization.ja.md)
