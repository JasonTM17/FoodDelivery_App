# Hợp đồng API

Ngôn ngữ: [English](./api-contract.md) | [Tiếng Việt](./api-contract.vi.md) | [日本語](./api-contract.ja.md)

Tài liệu này mô tả hợp đồng API cho web Admin và Restaurant trong Batch 4. Batch 4 không đổi hợp đồng customer/mobile cũ trừ khi endpoint được version hoặc có alias tương thích rõ ràng.

## Base path và chính sách version

- Route hiện tại nằm dưới `/api`; ví dụ trong tài liệu là relative với base này.
- Batch 4 không expose prefix `/v1`. Chỉ thêm version prefix tương lai khi OpenAPI server và migration policy được cập nhật cùng lúc.
- Breaking change cần version mới hoặc alias tương thích được ghi rõ; additive change có thể giữ route hiện tại.

Breaking change gồm xóa/đổi tên field, đổi kiểu field, biến optional thành required, xóa endpoint/enum, đổi auth/authz, hoặc đổi ngữ nghĩa pagination.

Không phải breaking change: thêm endpoint, thêm field optional, thêm enum value, nới validation, hoặc đổi câu chữ lỗi trong khi giữ nguyên `code`.

## Envelope thành công

Response thành công cho web/admin/restaurant dùng một dạng:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

`meta` là optional cho response một resource. Endpoint collection đặt danh sách trong `data` và thông tin trang/tổng hợp trong `meta`.

```json
{
  "success": true,
  "data": [],
  "meta": {
    "total": 0,
    "page": 1,
    "limit": 20,
    "hasMore": false
  }
}
```

## Dạng lỗi

Lỗi dùng RFC 7807 Problem Details và không bọc trong success envelope.

```json
{
  "type": "about:blank",
  "title": "Validation Error",
  "status": 422,
  "detail": "Email khong dung dinh dang",
  "instance": "/api/auth/register",
  "code": "VALIDATION_INVALID_EMAIL"
}
```

Client phải rẽ nhánh theo `code`, không dựa vào text đã dịch.

| Code | Ý nghĩa |
|---|---|
| `AUTH_INVALID_CREDENTIALS` | Sai email hoặc mật khẩu. |
| `AUTH_ACCOUNT_LOCKED` | Tài khoản bị khóa tạm thời. |
| `VALIDATION_INVALID_EMAIL` | Email sai định dạng. |
| `ORDER_CANNOT_CANCEL` | Đơn đã đi quá xa trong luồng để hủy. |
| `PAYMENT_INSUFFICIENT_BALANCE` | Số dư ví không đủ. |
| `PROMOTION_EXPIRED` | Khuyến mãi đã hết hạn. |
| `PROMOTION_LIMIT_REACHED` | Khuyến mãi đã hết lượt dùng. |
| `DUPLICATE_REQUEST` | Dùng lại idempotency key. |
| `NOT_FOUND` | Resource không tồn tại hoặc không hiển thị với actor. |
| `FORBIDDEN` | Actor thiếu quyền. |

## AI chat

Mọi route AI đều cần access token của user. Provider key chỉ tồn tại ở server.

| Method | Route | Contract |
|---|---|---|
| `POST` | `/ai/chat` | Gửi message, sessionId?, orderId?; message sau trim dài 1–4.000 ký tự, `sessionId` là UUID từ server và `orderId` là UUID/mã đơn FoodFlow thuộc caller. Trả lời live-provider theo role, đã qua safety filter với action answered or escalated, `grounded` và metadata tool nếu có. |
| `GET` | `/ai/history?sessionId=<uuid>` | Trả session AI-support active của chính caller và tối đa 50 turn đã lưu. Bỏ `sessionId` để lấy session gần nhất. |
| `POST` | `/ai/stream` | SSE có xác thực; phát `thinking`, một `response` hoàn chỉnh, `escalated` nếu có và `done`. Không phát word token giả. |

Chat fail-closed với HTTP 503 và một trong `AI_PROVIDER_NOT_CONFIGURED`, `AI_PROVIDER_UNAVAILABLE` hoặc `AI_CONTEXT_UNAVAILABLE`. Session/order không hợp lệ hoặc không khớp trả `AI_SESSION_NOT_FOUND`, `ORDER_NOT_FOUND` hoặc `SESSION_ORDER_MISMATCH` cùng status 404/400. Client phải hiển thị trạng thái không khả dụng trung thực, không render fallback assistant message.

## Pagination

Endpoint collection dùng:

- `data`: mảng resource.
- `meta.total`: tổng số resource khớp khi có thể tính.
- `meta.page`: số trang bắt đầu từ 1.
- `meta.limit`: kích thước trang.
- `meta.hasMore`: còn trang tiếp theo hay không.

Endpoint cursor-based có thể thêm cursor vào `meta`, nhưng collection vẫn nằm trong `data`.

## Auth và refresh

- Web dashboard dùng bearer access token trong Batch 4.
- Request refresh phải dùng access token hiện tại và không retry với header `Authorization` cũ.
- Web API client chặn vòng lặp refresh.
- Khi hết phiên, redirect phải giữ locale hiện tại.
- Chuyển web auth sang httpOnly cookie là hạng mục riêng, không thuộc Batch 4.

## KYC tài xế private

Mọi route KYC đều có xác thực và scope theo role. Tài liệu tài xế là object storage private, không phải public media asset.

| Method | Route | Actor | Contract |
|---|---|---|---|
| `POST` | `/driver/kyc/uploads` | Driver | Xin một signed grant cho `idCardFront`, `idCardBack`, `driverLicense` hoặc `vehicleRegistration`; metadata chỉ nhận JPEG/PNG/WebP từ 1 KiB đến 4 MiB và trả `{ uploadUrl, objectKey, headers }`. |
| `POST` | `/driver/kyc` | Driver | Gửi thông tin bằng lái/xe và đúng bốn private object key thuộc caller. Public/signed URL, key trùng, signature sai, submission pending thứ hai hoặc hết lượt retry đều bị từ chối. |
| `GET` | `/driver/kyc/status` | Driver | Trả verified/status, thông tin xe/bằng lái, terms đã nhận, review gần nhất và số lượt còn lại của chính caller. |
| `GET` | `/admin/users/{userId}/kyc` | Admin | Trả submission thật cùng signed read URL hết hạn sau 5 phút khi tài liệu hợp lệ; không bao giờ trả raw object key. |
| `POST` | `/admin/users/{userId}/kyc/review` | Admin | Approve/reject atomically một pending submission; reject bắt buộc có lý do và không review lại submission đã xử lý. |

Client PUT vào `uploadUrl` chỉ với đúng header được trả về. Không forward bearer token FoodFlow sang storage, không suy ra public URL, không lưu signed URL và không thay `objectKey` bằng URI. Production dùng riêng private `SUPABASE_KYC_BUCKET`; MinIO chỉ theo cùng contract ở local/self-hosted explicit.

## Realtime production và job drain

| Method | Route | Xác thực | Contract |
|---|---|---|---|
| `POST` | `/realtime/token` | Bearer access token của user | Body optional `{ orderId?, restaurantId? }`; trả `{ provider: "supabase", token, expiresAt, channels }`, TTL 5 phút và chỉ gồm private scope explicit. |
| `GET` | `/jobs/drain?limit=1..100` | `Authorization: Bearer ${CRON_SECRET}` | Vercel Cron drain job đến hạn trong PostgreSQL outbox; trả `{ claimed, completed, failed, retried }`. |
| `POST` | `/jobs/drain?limit=1..100` | `Authorization: Bearer ${CRON_SECRET}` | Cùng contract cho secure worker invocation. |

API kiểm tra ownership order/restaurant trước khi ký. Cross-tenant trả `REALTIME_ORDER_CHANNEL_FORBIDDEN` hoặc `REALTIME_RESTAURANT_CHANNEL_FORBIDDEN`; thiếu signing config trả `SUPABASE_REALTIME_NOT_CONFIGURED`. Supabase RLS chỉ cho đọc row `realtime_outbox` khi `channel` nằm trong claim `realtime_channels`; anon và broad public channel không thuộc contract.

## Xác thực Socket.IO compatibility và phân quyền phòng

Socket.IO là provider explicit cho local/self-hosted, không phải fallback implicit của managed production.

- Các namespace Socket.IO `/events`, `/tracking`, `/notifications` và `/dispatch` yêu cầu bearer access token hiện tại trong `handshake.auth.token` hoặc header `Authorization`.
- Refresh token, token hết hạn, chữ ký sai và user đã bị vô hiệu hóa đều bị từ chối trước khi join phòng.
- Phòng Admin trên `/events` yêu cầu role `admin` được đọc lại từ database.
- Phòng nhà hàng yêu cầu restaurant profile đang active và thuộc đúng tenant được yêu cầu.
- Phòng đơn hàng chỉ cho admin hoặc người tham gia đơn: khách hàng, tài xế được gán, hoặc nhân viên nhà hàng đang active.
- `/tracking` chỉ nhận cập nhật vị trí từ tài khoản `driver` đã xác thực.
- `driver:location.timestamp` là thời điểm GPS thật được thiết bị ghi nhận theo ISO UTC. Mobile phải giữ nguyên timestamp này khi flush các ping đã buffer offline sau khi reconnect, không thay bằng thời điểm flush.
- `/notifications` suy ra phòng user từ token đã verify; client không được tự chọn phòng của user khác.
- `/dispatch` chỉ nhận tài khoản `driver`, chỉ join `driver:<authenticated-user-id>` và từ chối phản hồi offer có driver ID khác user đã xác thực.
- Production origin lấy từ `CORS_ORIGINS`; mặc định local hỗ trợ các port 3000, 3002 và 3003.

## Snapshot REST tracking đơn hàng

- `POST /driver/location` chỉ dành cho driver và bắt buộc timestamp GPS thật từ thiết bị. Pipeline tracking dùng chung trả `422 DRIVER_LOCATION_REJECTED` cho sample stale, tương lai, ngoài vùng phục vụ, vượt tốc hoặc teleport; sample hợp lệ cập nhật presence và phát event order/admin đúng tenant.
- `POST /driver/dispatch/offers/{orderId}/respond` chỉ dành cho driver, nhận `{ offerToken, decision: "accept"|"reject" }`, bind với bearer identity và chỉ consume token ngắn hạn một lần. Offer state nằm trong PostgreSQL, chỉ lưu SHA-256 token hash; offer sai/hết hạn/race trả `409`.
- `GET /orders/{id}/tracking` scope theo order participant: customer sở hữu đơn, driver được gán, staff nhà hàng active đúng tenant của đơn, hoặc admin. Endpoint chỉ trả telemetry thật từ provider cache/database cho đơn mà actor đã xác thực được phép truy cập.
- `driverLocation`, `etaMinutes` và `routePolyline` có thể null; client phải xem null là dữ liệu chưa khả dụng, không tự bịa ETA đường thẳng hoặc route geometry.
- `routePhase` là field bắt buộc, giá trị `pickup` trước khi lấy món và `dropoff` sau khi lấy món. Mobile/web client phải dùng field này để tránh tái sử dụng geometry pickup stale cho chặng giao tới khách.
- Customer mobile và Restaurant web hydrate snapshot này trước khi subscribe realtime events, sau đó cho realtime `delivery:eta_updated` thay thế hoặc xoá planned route.

## Quy ước HMAC

### Webhook SePay inbound

| Field | Giá trị |
|---|---|
| Header | `x-sepay-signature` |
| Algorithm | HMAC-SHA256 |
| Input | Raw request body |
| Secret | `SEPAY_WEBHOOK_SECRET` |
| Replay protection | Redis deduplication key theo transaction reference, TTL 24h |

Luồng verify: đọc header, tính HMAC trên raw body, so sánh timing-safe, reject bằng `WEBHOOK_INVALID_SIGNATURE` nếu sai, deduplicate transaction đã xử lý, rồi persist kết quả thanh toán.

### Webhook service outbound

| Field | Giá trị |
|---|---|
| Header | `X-Signature-SHA256` |
| Algorithm | HMAC-SHA256 |
| Input | Raw request body |
| Secret | `WEBHOOK_SECRET` hoặc secret riêng theo target |

LLM tools và service receiver nội bộ khác phải verify chữ ký trước khi xử lý.

### Callback API key

| Header | Secret |
|---|---|
| `x-api-key` | `SERVICE_API_KEY` hoặc service key riêng theo endpoint |

## Idempotency

Mutation có thể tạo giao dịch tiền hoặc công việc vận hành trùng lặp nhận header:

```http
Idempotency-Key: <UUID v4>
```

Server giữ replay guard 24 giờ. Request trùng không chạy mutation lần hai.

## Nguồn OpenAPI

- Spec chuẩn: [openapi.yaml](./openapi.yaml)
- Changelog: [openapi/changelog.md](./openapi/changelog.md)
- Web client package: `web/packages/api-client`

OpenAPI phải mô tả endpoint Admin và Restaurant mà web dùng trước khi coi endpoint đó hoàn tất.

## CI gate

Workflow OpenAPI kiểm Spectral lint, YAML hợp lệ, typecheck generated client, và contract tests cho hành vi rủi ro cao khi route thay đổi.
