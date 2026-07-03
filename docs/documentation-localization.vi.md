# Chính sách localization tài liệu

Ngôn ngữ: [English](./documentation-localization.md) | [Tiếng Việt](./documentation-localization.vi.md) | [日本語](./documentation-localization.ja.md)

Tài liệu FoodFlow được duy trì bằng ba ngôn ngữ:

| Locale | Quy ước file | Đối tượng |
|---|---|---|
| English | `*.md` | Nguồn mặc định, kỹ thuật và vận hành deploy |
| Vietnamese | `*.vi.md` | Product owner, vận hành nội địa, contributor tiếng Việt |
| Japanese | `*.ja.md` | Stakeholder và reviewer tiếng Nhật |

## Quy tắc

- Mỗi guide high-level cho người dùng hoặc vận hành phải có English, Vietnamese và Japanese.
- English là source chính để giữ command và code reference chính xác.
- File Vietnamese và Japanese phải giữ nguyên commands, paths, env var names, endpoint names và code identifiers.
- Nếu chưa dịch đủ trong cùng commit, thêm locale còn thiếu vào PR checklist và không đánh dấu docs complete.
- Không dịch secret, env var names, route paths, file paths, commit hashes, package names hoặc CLI flags.

## Docs hiện đã localize

- Project overview: [EN](../README.md), [VI](readme.vi.md), [JA](readme.ja.md)
- API contract: [EN](api-contract.md), [VI](api-contract.vi.md), [JA](api-contract.ja.md)
- Code standards: [EN](code-standards.md), [VI](code-standards.vi.md), [JA](code-standards.ja.md)
- Project roadmap: [EN](project-roadmap.md), [VI](project-roadmap.vi.md), [JA](project-roadmap.ja.md)
- Deployment: [EN](deployment-guide.md), [VI](deployment-guide.vi.md), [JA](deployment-guide.ja.md)
- Testing: [EN](testing-guide.md), [VI](testing-guide.vi.md), [JA](testing-guide.ja.md)
- AI chatbot: [EN](ai-chatbot-guide.md), [VI](ai-chatbot-guide.vi.md), [JA](ai-chatbot-guide.ja.md)
- Documentation localization policy: [EN](documentation-localization.md), [VI](documentation-localization.vi.md), [JA](documentation-localization.ja.md)
