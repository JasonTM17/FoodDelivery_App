# Documentation Localization Policy

言語: [English](./documentation-localization.md) | [Tiếng Việt](./documentation-localization.vi.md) | [日本語](./documentation-localization.ja.md)

FoodFlow documentation は 3 言語で管理します。

| Locale | File convention | Audience |
|---|---|---|
| English | `*.md` | Default source、engineering、deployment operations |
| Vietnamese | `*.vi.md` | Product owner、local operations、Vietnamese contributors |
| Japanese | `*.ja.md` | Japanese stakeholders and reviewers |

## Rules

- High-level user-facing または operator-facing guide は English、Vietnamese、Japanese を同時に提供します。
- English は commands と code references の正確性を保つ source document です。
- Vietnamese/Japanese files では commands、paths、env var names、endpoint names、code identifiers をそのまま保持します。
- 同じ commit で翻訳を完了できない場合、足りない locale を PR checklist に追加し、docs complete としません。
- Secrets、env var names、route paths、file paths、commit hashes、package names、CLI flags は翻訳しません。

## Current localized docs

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
- Documentation localization policy: [EN](documentation-localization.md), [VI](documentation-localization.vi.md), [JA](documentation-localization.ja.md)
