# ドキュメント翻訳ポリシー

言語: [English](./documentation-localization.md) · [Tiếng Việt](./documentation-localization.vi.md) · **日本語**

FoodFlow のドキュメントは 3 言語で管理します。

| 言語 | ファイル規則 | 対象 |
|---|---|---|
| English | `*.md` | 既定の source、engineering、deployment operations |
| Vietnamese | `*.vi.md` | Product owner、local operations、Vietnamese contributors |
| Japanese | `*.ja.md` | 日本の stakeholder と reviewer |

## ルール

- 下の翻訳対象リストにある product guide と継続的な operating guide は English、Vietnamese、Japanese を同時に提供します。
- English は commands と code references の正確性を保つ source document です。
- Vietnamese/Japanese files では commands、paths、env var names、endpoint names、code identifiers をそのまま保持します。
- 同じ commit で必須 guide の翻訳を完了できない場合、足りない locale を PR checklist に追加し、その guide を complete としません。
- secrets、env var names、route paths、file paths、commit hashes、package names、CLI flags は翻訳しません。
- 開いている言語は self-link ではなく太字で表します。意図的に英語のみの対象への link は、翻訳済み navigation で `(EN)` と明記します。

## 翻訳対象のドキュメント

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
- Customer（注文者）ガイド: [EN](customer-guide.md), [VI](customer-guide.vi.md), [JA](customer-guide.ja.md)
- Customer / Driver モバイルガイド: [EN](customer-driver-guide.md), [VI](customer-driver-guide.vi.md), [JA](customer-driver-guide.ja.md)
- デザインガイドライン: [EN](design-guidelines.md), [VI](design-guidelines.vi.md), [JA](design-guidelines.ja.md)
- Documentation localization policy: [EN](documentation-localization.md), [VI](documentation-localization.vi.md), [JA](documentation-localization.ja.md)

## 意図的に英語のみとする技術・リリース記録

これらは source snapshot、日付付き audit、または release evidence であるため English canonical を維持します。翻訳済み README では翻訳版があるように見せず `(EN)` を付けます。

- [System architecture](system-architecture.md) と [contributing guide](contributing.md)
- [Branch disposition](branch-disposition.md)、[Batch 4 release report](batch4-release-report.md)、[project changelog](project-changelog.md)
- [Codebase summary](codebase-summary.md) と [OpenAPI schema](openapi.yaml)
