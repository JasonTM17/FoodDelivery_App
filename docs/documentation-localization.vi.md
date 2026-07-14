# Chính sách localization tài liệu

Ngôn ngữ: [English](./documentation-localization.md) · **Tiếng Việt** · [日本語](./documentation-localization.ja.md)

Tài liệu FoodFlow được duy trì bằng ba ngôn ngữ:

| Locale | Quy ước file | Đối tượng |
|---|---|---|
| English | `*.md` | Nguồn mặc định, kỹ thuật và vận hành deploy |
| Vietnamese | `*.vi.md` | Product owner, vận hành nội địa, contributor tiếng Việt |
| Japanese | `*.ja.md` | Stakeholder và reviewer tiếng Nhật |

## Quy tắc

- Các guide sản phẩm và vận hành lặp lại trong danh sách tài liệu đã localize phải có English, Vietnamese và Japanese.
- English là source chính để giữ command và code reference chính xác.
- File Vietnamese và Japanese phải giữ nguyên commands, paths, env var names, endpoint names và code identifiers.
- Nếu chưa dịch đủ guide bắt buộc trong cùng commit, thêm locale còn thiếu vào PR checklist và không đánh dấu guide đó complete.
- Không dịch secret, env var names, route paths, file paths, commit hashes, package names hoặc CLI flags.
- Ngôn ngữ đang mở dùng chữ đậm, không self-link. Link tới tài liệu chủ đích chỉ có tiếng Anh phải có nhãn `(EN)` trong navigation đã localize.

## Phạm vi đã localize

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
- Hướng dẫn Khách hàng: [EN](customer-guide.md), [VI](customer-guide.vi.md), [JA](customer-guide.ja.md)
- Customer và Driver mobile guide: [EN](customer-driver-guide.md), [VI](customer-driver-guide.vi.md), [JA](customer-driver-guide.ja.md)
- Design guidelines: [EN](design-guidelines.md), [VI](design-guidelines.vi.md), [JA](design-guidelines.ja.md)
- Documentation localization policy: [EN](documentation-localization.md), [VI](documentation-localization.vi.md), [JA](documentation-localization.ja.md)

## Tài liệu kỹ thuật và release chủ đích chỉ có tiếng Anh

Các tài liệu này là bản English canonical vì là source snapshot, audit có ngày hoặc release evidence. README đã localize gắn nhãn `(EN)` thay vì ngụ ý có bản dịch.

- [System architecture](system-architecture.md) và [contributing guide](contributing.md)
- [Branch disposition](branch-disposition.md), [Batch 4 release report](batch4-release-report.md), [project changelog](project-changelog.md)
- [Codebase summary](codebase-summary.md) và [OpenAPI schema](openapi.yaml)
