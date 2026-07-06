# Hướng dẫn AI chatbot

Ngôn ngữ: [English](./ai-chatbot-guide.md) | [Tiếng Việt](./ai-chatbot-guide.vi.md) | [日本語](./ai-chatbot-guide.ja.md)

FoodFlow dùng hướng LLM-first cho chatbot trong Batch 4. Backend AI module sở hữu runtime; không cần automation runner bên ngoài và không mở public AI-tool route.

## Hướng runtime

- Provider: DeepSeek qua backend provider adapter, model mặc định `deepseek-v4-flash`.
- Entry point: `POST /ai/chat` và `POST /ai/stream`, đều cần đăng nhập.
- Chat trên mobile customer gọi trực tiếp `POST /ai/chat`; chat hỗ trợ chung không gửi `orderId`, còn chat theo đơn chỉ gửi order code hoặc UUID hợp lệ để backend grounding.
- Tool nội bộ lấy dữ liệu thật về order, tài xế, nhà hàng, refund, gợi ý món và support ticket.
- Tool call luôn scope theo `user.sub` đã xác thực; không tin riêng order ID do user nhập.
- Chat turn được persist best-effort vào `ChatSession`/`ChatMessage` cho Admin monitor thật; order link chỉ lưu sau khi check customer-scoped ownership.
- Support ticket do AI tạo dùng `channel: ai_chat` và tag `ai_session:<uuid>` để attribution escalation không phải đoán.
- Escalation AI mức cao tạo notification đã persist cho các admin đang active. Nếu không có admin active, tool trả `notified: false` với `notifiedAdminCount: 0` thay vì báo thành công giả.
- Thiếu hoặc lỗi cấu hình model trả `action: "degraded"` thay vì bịa câu trả lời thành công.

## Cấu hình bắt buộc

Giá trị thật chỉ lưu trong `.env` bị ignore hoặc secret store của provider.

| Biến | Mục đích |
|---|---|
| `DEEPSEEK_API_KEY` | Key LLM provider cho chatbot |
| `DEEPSEEK_BASE_URL` | Provider URL tương thích OpenAI |
| `DEEPSEEK_MODEL` | Tên model, mặc định `deepseek-v4-flash` |
| `DEEPSEEK_TIMEOUT_MS` | Timeout upstream |

Key từng xuất hiện trong chat, screenshot, log, ticket hoặc Git history phải rotate trước production.

## Hành vi sản phẩm

- Ưu tiên fast-path cho câu hỏi static an toàn.
- Dùng tool-grounded answer cho order, refund, restaurant, delivery hoặc claim theo user.
- Gợi ý món kết hợp lịch sử đặt hàng của user đã xác thực với món đang khả dụng từ nhà hàng đang mở/đã duyệt; nếu rỗng phải nói chưa có gợi ý xác minh được, không bịa món.
- Trả metadata `grounded` và `toolCalls` để client/test biết context tài khoản đã được xác minh chưa.
- Escalate sang support cho trường hợp khách bực tức, safety, fraud, refund dispute hoặc lỗi giao hàng lặp lại.
- Không bịa refund, ETA giao hàng, promotion eligibility, trạng thái nhà hàng, kết quả support hoặc admin notification.

## Validation

Trước release, chạy:

- Backend AI focused unit tests.
- Seeded AI chatbot E2E scenarios qua `/ai/chat` với test JWT thật.
- Prompt-injection và no-false-promise checks.
- Tenant isolation tests cho order và support-ticket tools.
- Secret scan trên env examples, docs và staged diff.
- Admin AI monitor checks cho online, not-configured và degraded states; conversation counts, escalations và resolution rate lấy từ DB thật, còn cost/token latency giữ null cho tới khi có usage telemetry source thật.
