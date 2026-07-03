# Hướng dẫn AI chatbot

Ngôn ngữ: [English](./ai-chatbot-guide.md) | [Tiếng Việt](./ai-chatbot-guide.vi.md) | [日本語](./ai-chatbot-guide.ja.md)

FoodFlow dùng hướng LLM-first cho chatbot trong Batch 4. Chatbot thuộc backend AI module, không phụ thuộc workflow engine bên ngoài.

## Hướng runtime

- Provider mặc định: DeepSeek V4 Flash qua backend provider adapter.
- Entry point: backend `/ai/stream` và các AI tool endpoint liên quan.
- Không còn runtime dependency vào workflow engine bên ngoài.
- Thiếu hoặc lỗi cấu hình model phải trả degraded response rõ ràng.
- Tính năng đề xuất phải dùng dữ liệu thật từ order, menu, restaurant, user và support context qua backend tools; không tự bịa business data.

## Cấu hình bắt buộc

Giá trị thật chỉ được lưu trong `.env` ignored hoặc secret store của provider.

| Variable | Mục đích |
|---|---|
| `DEEPSEEK_API_KEY` | LLM provider key cho chatbot |
| `DEEPSEEK_BASE_URL` | Provider URL tương thích OpenAI |
| `DEEPSEEK_MODEL` | Tên model, mặc định `deepseek-v4-flash` |
| `DEEPSEEK_TIMEOUT_MS` | Timeout upstream |
| `AI_SERVICE_JWT_SECRET` | Authorization service-to-service cho tool |

Key từng xuất hiện trong chat, screenshot, log, ticket hoặc Git history phải rotate trước production.

## Hành vi sản phẩm

- Ưu tiên fast-path cho câu hỏi static an toàn.
- Dùng tool-grounded answer cho order, refund, restaurant, delivery hoặc claim theo user.
- Escalate sang support khi confidence thấp, safety policy chặn câu trả lời, hoặc cần human handling.
- Không bịa refund, ETA giao hàng, eligibility promotion, trạng thái nhà hàng hoặc kết quả support.

## Validation

Trước release, chạy:

- Backend AI focused unit tests.
- Seeded AI chatbot E2E scenarios.
- Prompt-injection và no-false-promise checks.
- Secret scan trên env examples và docs.
- Admin AI monitor checks cho configured và degraded states.
