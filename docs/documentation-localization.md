# Documentation Localization Policy

Languages: **English** · [Tiếng Việt](./documentation-localization.vi.md) · [日本語](./documentation-localization.ja.md)

FoodFlow documentation is maintained in three languages:

| Locale | File convention | Audience |
|---|---|---|
| English | `*.md` | Default source, engineering and deployment operations |
| Vietnamese | `*.vi.md` | Product owner, local operations, Vietnamese contributors |
| Japanese | `*.ja.md` | Japanese stakeholders and reviewers |

## Rules

- Product and recurring operating guides in the localized-coverage list must ship with English, Vietnamese, and Japanese versions.
- English is the source document for command accuracy and code references.
- Vietnamese and Japanese files should preserve commands, paths, env var names, endpoint names, and code identifiers exactly.
- If a required translation cannot be completed in the same commit, add the missing locale to the PR checklist and do not mark that guide complete.
- Do not translate secrets, env var names, route paths, file paths, commit hashes, package names, or CLI flags.
- The active language is bold text, not a self-link. Links to an intentional English-only target must carry an `(EN)` label in localized navigation.

## Localized coverage

- Project overview: [EN](../README.md), [VI](readme.vi.md), [JA](readme.ja.md)
- Product requirements: [EN](project-overview-pdr.md), [VI](project-overview-pdr.vi.md), [JA](project-overview-pdr.ja.md)
- API contract: [EN](api-contract.md), [VI](api-contract.vi.md), [JA](api-contract.ja.md)
- Code standards: [EN](code-standards.md), [VI](code-standards.vi.md), [JA](code-standards.ja.md)
- Project roadmap: [EN](project-roadmap.md), [VI](project-roadmap.vi.md), [JA](project-roadmap.ja.md)
- Deployment: [EN](deployment-guide.md), [VI](deployment-guide.vi.md), [JA](deployment-guide.ja.md)
- Docker/local: [EN](docker-local-dev-guide.md), [VI](docker-local-dev-guide.vi.md), [JA](docker-local-dev-guide.ja.md)
- Testing: [EN](testing-guide.md), [VI](testing-guide.vi.md), [JA](testing-guide.ja.md)
- AI chatbot: [EN](ai-chatbot-guide.md), [VI](ai-chatbot-guide.vi.md), [JA](ai-chatbot-guide.ja.md)
- Security and secret policy: [EN](security-audit-guide.md), [VI](security-audit-guide.vi.md), [JA](security-audit-guide.ja.md)
- Product gallery: [EN](product-gallery.md), [VI](product-gallery.vi.md), [JA](product-gallery.ja.md)
- Customer guide: [EN](customer-guide.md), [VI](customer-guide.vi.md), [JA](customer-guide.ja.md)
- Customer and Driver mobile guide: [EN](customer-driver-guide.md), [VI](customer-driver-guide.vi.md), [JA](customer-driver-guide.ja.md)
- Design guidelines: [EN](design-guidelines.md), [VI](design-guidelines.vi.md), [JA](design-guidelines.ja.md)
- Documentation localization policy: [EN](documentation-localization.md), [VI](documentation-localization.vi.md), [JA](documentation-localization.ja.md)

## Intentional English-only engineering and release records

These records are canonical in English because they are source snapshots, date-bound audits, or release evidence. Localized README links label them `(EN)` rather than implying a translated counterpart.

- [System architecture](system-architecture.md) and [contributing guide](contributing.md)
- [Branch disposition](branch-disposition.md), [Batch 4 release report](batch4-release-report.md), and [project changelog](project-changelog.md)
- [Codebase summary](codebase-summary.md) and [OpenAPI schema](openapi.yaml)
