# Hướng dẫn AI chatbot

Ngôn ngữ: [English](./ai-chatbot-guide.md) | [Tiếng Việt](./ai-chatbot-guide.vi.md) | [日本語](./ai-chatbot-guide.ja.md)

FoodFlow dùng chatbot LLM-first trong Batch 4. Backend AI module quản lý provider, grounding, telemetry và phân quyền. Không có public AI-tool route và không đưa provider key xuống trình duyệt.

## Contract runtime

- `POST /ai/chat` tạo một phản hồi DeepSeek theo đúng role và đã qua safety filter cho người dùng xác thực. Message sau khi trim tối đa 4.000 ký tự; `sessionId` là UUID do server cấp, còn `orderId` nhận UUID hoặc mã đơn FoodFlow hợp lệ rồi resolve về order thuộc caller.
- `GET /ai/history?sessionId=<uuid>` chỉ trả tối đa 50 lượt chat đã lưu của đúng người dùng đã đăng nhập. Bỏ `sessionId` để lấy session AI-support active gần nhất của người dùng đó.
- `POST /ai/stream` là SSE có xác thực. Endpoint phát `response` đã được filter đầy đủ, không tự tách một câu trả lời hoàn chỉnh thành token giả.
- Admin và Restaurant web tải lịch sử của user đã đăng nhập và hiển thị panel trợ lý cố định ngoài các trang login. Mobile dùng cùng REST contract.
- Mọi yêu cầu đều gọi provider thật. Không dùng fast-path static hoặc fallback reply khi runtime.

## Grounding và tenant isolation

- Tool nội bộ lấy context thật về order, tài xế, nhà hàng, refund, gợi ý món và support ticket.
- Tool theo đơn luôn scope theo actor đã xác thực; order ID/code do user nhập không đủ để cấp quyền.
- Tool order, driver, restaurant, refund và recommendation chỉ chạy cho actor customer đã xác thực và luôn nhận đúng customer ID. Actor Admin, Restaurant và Driver nhận hướng dẫn workflow theo role, không gọi tool tài khoản khách hàng.
- Session được yêu cầu phải qua kiểm tra ownership trước khi đọc Redis history. Session không tồn tại trả 404; lỗi database khi xác minh trả 503, vì vậy session ID chưa xác minh không bao giờ trở thành memory key dùng chung.
- Model nhận `VERIFIED_CONTEXT` như dữ liệu thực tế, không được làm theo chỉ dẫn nhúng trong context.
- Ticket do AI tạo dùng `channel: ai_chat` và tag `ai_session:<uuid>`. Escalation mức cao chỉ tạo notification khi có admin active.
- User turn được ghi đúng role (`customer`, `driver`, `restaurant`, hoặc `admin`); assistant turn được ghi là `ai`.

## Telemetry và AI Monitor

Mỗi lần gọi provider thật ghi một `ai_usage_events` gồm provider, model cấu hình/trả về, outcome, token usage thật nếu provider cung cấp, latency và error code đã giới hạn. Bảng được bảo vệ bằng Supabase RLS cho `service_role`.

AI Monitor Admin lấy conversation, escalation, request, token, latency và trạng thái provider gần nhất từ database. FoodFlow không ước lượng chi phí từ token; cost chỉ có khi đã kết nối nguồn billing được duyệt. Key đã cấu hình nhưng chưa có request thật được hiển thị là đang chờ telemetry, không phải online.

## Hành vi khi lỗi

`POST /ai/chat` fail-closed với HTTP 503 khi thiếu cấu hình, provider lỗi, output bị safety filter chặn hoặc context grounded không xác minh được. Mã public:

| Code | Ý nghĩa |
|---|---|
| `AI_PROVIDER_NOT_CONFIGURED` | Thiếu hoặc không hợp lệ secret provider phía server. |
| `AI_PROVIDER_UNAVAILABLE` | Provider lỗi, timeout hoặc trả kết quả rỗng/không an toàn. |
| `AI_CONTEXT_UNAVAILABLE` | Không thể xác minh context cần thiết một cách an toàn. |
| `AI_SESSION_NOT_FOUND` | Session AI-support active không thuộc caller hoặc không còn tồn tại. |
| `ORDER_NOT_FOUND` | Không xác minh được order UUID thuộc customer hiện tại. |
| `SESSION_ORDER_MISMATCH` | Order được gửi không khớp với session đã xác minh. |

Completion bị filter, bị cắt hoặc chưa hoàn tất cũng bị từ chối. Khi đó hệ thống không tạo câu trả lời assistant giả, refund, ETA, promotion, hay kết quả support giả.

## Cấu hình bắt buộc

Giá trị thật chỉ lưu trong env local đã ignore hoặc secret manager production. Không dán key vào chat, source control, screenshot hoặc biến môi trường public của web.

| Biến | Mục đích |
|---|---|
| `DEEPSEEK_API_KEY` | Key provider đã rotate, chỉ ở server; bắt buộc trong production. |
| `DEEPSEEK_BASE_URL` | URL provider tương thích OpenAI. |
| `DEEPSEEK_MODEL` | Model yêu cầu, mặc định `deepseek-v4-flash`. |
| `DEEPSEEK_TIMEOUT_MS` | Timeout upstream, giới hạn tối đa 60 giây. |
| `DEEPSEEK_MAX_OUTPUT_TOKENS` | Giới hạn output, tối đa 8.000 token. |
| `DEEPSEEK_DAILY_BUDGET_USD` | Tham chiếu ngân sách được duyệt, không phải nguồn chi phí. |

Mọi key từng lộ trong chat, log, screenshot, ticket hoặc Git history phải được rotate trước production.

## Kiểm tra release

- Chạy test backend AI/provider/telemetry/monitor.
- Chạy test widget/history Admin và Restaurant ở các locale hỗ trợ.
- Chạy smoke `/ai/chat` đã xác thực với key production đã rotate; mock hoặc degraded response không phải bằng chứng duyệt release.
- Xác minh AI Monitor nhận request thật có token/latency khi provider trả usage.
- Chạy tenant isolation, prompt-injection, OpenAPI/api-client contract và staged secret scan.
