# API 契約

言語: [English](./api-contract.md) | [Tiếng Việt](./api-contract.vi.md) | [日本語](./api-contract.ja.md)

この文書は Batch 4 の Web/Admin/Restaurant API 契約を定義します。明示的に version 化または互換 alias がある場合を除き、既存の customer/mobile 契約は変更しません。

## Base path と version policy

- 現在の route は `/api` 配下です。この文書の route 例はその base からの相対 path です。
- Batch 4 は `/v1` prefix を公開していません。Future version prefix は OpenAPI server と migration policy を同時に更新する場合のみ導入します。
- Breaking change は新 version または文書化された互換 alias が必要です。Additive change は current route に残せます。

Breaking change の例:

- request/response field の削除または rename。
- field type の変更。
- optional field を required にする変更。
- endpoint または enum value の削除。
- authentication/authorization 要件の変更。
- pagination semantics の変更。

Breaking change ではない例:

- endpoint の追加。
- optional request/response field の追加。
- enum value の追加。
- validation constraint の緩和。
- `code` を維持したまま人間向け error text を変えること。

## 成功 envelope

Web/Admin/Restaurant の成功 response は次の形です。

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

単一 resource では `meta` は optional です。Collection endpoint は配列を `data` に置き、pagination や aggregate 情報を `meta` に置きます。

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

## Error format

Error は RFC 7807 Problem Details を使い、success envelope では包みません。

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

Client は翻訳済み text ではなく `code` で分岐します。

| Code | 意味 |
|---|---|
| `AUTH_INVALID_CREDENTIALS` | Email または password が間違っています。 |
| `AUTH_ACCOUNT_LOCKED` | Account が一時的に lock されています。 |
| `VALIDATION_INVALID_EMAIL` | Email format が不正です。 |
| `ORDER_CANNOT_CANCEL` | Order flow が進みすぎて cancel できません。 |
| `PAYMENT_INSUFFICIENT_BALANCE` | Wallet balance が不足しています。 |
| `PROMOTION_EXPIRED` | Promotion が期限切れです。 |
| `PROMOTION_LIMIT_REACHED` | Promotion usage cap に達しました。 |
| `DUPLICATE_REQUEST` | Idempotency key が再利用されました。 |
| `NOT_FOUND` | Resource が存在しない、または actor から見えません。 |
| `FORBIDDEN` | Actor に必要な権限がありません。 |

## AI chat

すべての AI route には user access token が必要です。provider key は server 側のみで扱います。

| Method | Route | Contract |
|---|---|---|
| `POST` | `/ai/chat` | message, sessionId?, orderId? を送信します。trim 後 message は 1–4,000 文字、`sessionId` は server UUID、`orderId` は caller 所有 UUID/FoodFlow order code です。role-scoped かつ safety filter 済み live-provider reply、action answered or escalated、`grounded`、任意 tool metadata を返します。 |
| `GET` | `/ai/history?sessionId=<uuid>` | caller 自身の active AI-support session と最大 50 件の保存済み turn を返します。`sessionId` 省略時は最新 session です。 |
| `POST` | `/ai/stream` | 認証済み SSE。`thinking`、完了済みの `response`、任意の `escalated`、`done` を送信します。偽の word token は送信しません。 |

Chat は HTTP 503 と `AI_PROVIDER_NOT_CONFIGURED`、`AI_PROVIDER_UNAVAILABLE`、`AI_CONTEXT_UNAVAILABLE` のいずれかで fail-closed します。不正または不一致の session/order context は 404/400 と `AI_SESSION_NOT_FOUND`、`ORDER_NOT_FOUND`、`SESSION_ORDER_MISMATCH` を返します。Client は正直な unavailable state を表示し、fallback assistant message を描画しません。

## Pagination

Collection endpoint は次を使います。

- `data`: resource 配列。
- `meta.total`: 取得可能な場合の総件数。
- `meta.page`: 1 始まりの page index。
- `meta.limit`: page size。
- `meta.hasMore`: 次 page があるかどうか。

Cursor-based endpoint は `meta` に cursor field を追加できますが、collection は常に `data` に置きます。

## Authentication と refresh

- Batch 4 の Web dashboard は bearer access token を使います。
- Refresh request は現在の access token を使い、古い `Authorization` header で retry してはいけません。
- Web API client は refresh loop を防ぎます。
- Session 期限切れ redirect は現在の locale を維持します。
- Web auth の httpOnly cookie 化は別 scope であり、Batch 4 には含めません。

## Private driver KYC

すべての KYC route は認証済みかつ role-scoped です。Driver document は public media asset ではなく private storage object です。

| Method | Route | Actor | Contract |
|---|---|---|---|
| `POST` | `/driver/kyc/uploads` | Driver | `idCardFront`、`idCardBack`、`driverLicense`、`vehicleRegistration` のいずれか 1 件に signed grant を発行します。JPEG/PNG/WebP、1 KiB–4 MiB の metadata を受け、`{ uploadUrl, objectKey, headers }` を返します。 |
| `POST` | `/driver/kyc` | Driver | License/vehicle 情報と caller 所有の private object key 4 件を送信します。Public/signed URL、重複 key、不正 signature、2 件目の pending submission、retry 上限超過は拒否します。 |
| `GET` | `/driver/kyc/status` | Driver | Caller 自身の verified/status、vehicle/license、accepted terms、latest review、remaining attempts を返します。 |
| `GET` | `/admin/users/{userId}/kyc` | Admin | Valid document に 5 分間の signed read URL を付けて real submission を返します。Raw object key は返しません。 |
| `POST` | `/admin/users/{userId}/kyc/review` | Admin | Pending submission 1 件を atomic に approve/reject します。Reject reason は必須で、review 済み submission は再処理できません。 |

Client は返された exact headers だけで `uploadUrl` に PUT します。FoodFlow API bearer を Storage に転送せず、public URL を導出せず、signed URL を保存せず、`objectKey` を URI に置き換えません。Production は dedicated private `SUPABASE_KYC_BUCKET` を使い、MinIO は explicit local/self-hosted mode のみ同じ contract に従います。

## Managed-production realtime と job drain

| Method | Route | Authentication | Contract |
|---|---|---|---|
| `POST` | `/realtime/token` | User bearer access token | Optional `{ orderId?, restaurantId? }`。`{ provider: "supabase", token, expiresAt, channels }` を返し、TTL は 5 分、channel は explicit private scope のみです。 |
| `GET` | `/jobs/drain?limit=1..100` | `Authorization: Bearer ${CRON_SECRET}` | PostgreSQL outbox の due jobs を Vercel Cron が drain。`{ claimed, completed, failed, retried }`。 |
| `POST` | `/jobs/drain?limit=1..100` | `Authorization: Bearer ${CRON_SECRET}` | Secure worker invocation 用の同一 contract。 |

API は signing 前に order/restaurant ownership を確認します。Cross-tenant は `REALTIME_ORDER_CHANNEL_FORBIDDEN` または `REALTIME_RESTAURANT_CHANNEL_FORBIDDEN`、signing config 不足は `SUPABASE_REALTIME_NOT_CONFIGURED`。Supabase RLS は JWT `realtime_channels` claim に row channel がある場合だけ `realtime_outbox` を読めます。Anon と broad public channel は contract 外です。

## Socket.IO compatibility 認証と room 認可

Socket.IO は local/self-hosted の explicit provider であり、managed production の implicit fallback ではありません。

- Socket.IO の `/events`、`/tracking`、`/notifications`、`/dispatch` namespace は `handshake.auth.token` または `Authorization` header に現在の bearer access token を必要とします。
- Refresh token、期限切れ token、不正な署名、無効化された user は room join 前に拒否されます。
- `/events` の Admin room は database で確認した `admin` role が必要です。
- Restaurant room は要求された tenant に属する active restaurant profile が必要です。
- Order room は admin または注文参加者（customer、担当 driver、active restaurant staff）のみ join できます。
- `/tracking` の位置更新は認証済み `driver` account からのみ受け付けます。
- `driver:location.timestamp` は ISO UTC の実 GPS サンプル取得時刻です。Mobile は reconnect 後に offline-buffered ping を flush するとき、この timestamp を保持し、flush 時刻で置き換えてはいけません。
- `/notifications` は検証済み token から user room を決定し、client が別 user の room を選ぶことはできません。
- `/dispatch` は `driver` account のみ受け付け、`driver:<authenticated-user-id>` のみに join し、認証 user と異なる driver ID の offer response を拒否します。
- Production origin は `CORS_ORIGINS` を使用し、local default は port 3000、3002、3003 を許可します。

## Order tracking REST snapshot

- `POST /driver/location` は driver 専用で、端末が取得した実 GPS timestamp を必須とします。共通 tracking pipeline は stale、future、service area 外、speed 超過、teleport sample を `422 DRIVER_LOCATION_REJECTED` で拒否し、有効な sample だけが presence と tenant-scoped order/admin event を更新します。
- `POST /driver/dispatch/offers/{orderId}/respond` は driver 専用で、`{ offerToken, decision: "accept"|"reject" }` を bearer identity に bind し、短命 token を一度だけ consume します。Offer state は PostgreSQL に保存し、token は SHA-256 hash のみを保持します。Invalid、expired、race は `409` です。
- `GET /orders/{id}/tracking` は order participant scoped です。customer-owned order、assigned driver order、注文の restaurant tenant に属する active restaurant staff、または admin のみが利用できます。認証済み actor がアクセスできる注文について provider cache/database の real telemetry だけを返します。
- `driverLocation`、`etaMinutes`、`routePolyline` は nullable です。Client は null を unavailable data として扱い、straight-line ETA や route geometry を捏造してはいけません。
- `routePhase` は必須 field で、pickup 前は `pickup`、pickup 後は `dropoff` です。Mobile/web client は stale pickup geometry を customer-bound delivery に再利用しないためにこの field を使います。
- Customer mobile と Restaurant web は realtime events を subscribe する前にこの snapshot を hydrate し、その後 realtime `delivery:eta_updated` で planned route を置換または clear します。

## HMAC 規約

### Inbound SePay webhook

| Field | Value |
|---|---|
| Headers | `x-sepay-signature: sha256={hex}`, `x-sepay-timestamp: {unix_seconds}` |
| Algorithm | HMAC-SHA256 |
| Input | `{timestamp}.{raw_request_body}` |
| Secret | `SEPAY_WEBHOOK_SECRET` |
| Replay protection | ±5分を超える timestamp を拒否し、SePay transaction `id` ごとの durable Postgres unique receipt で deduplicate |

Verification flow: signature と timestamp を読み、古い timestamp を拒否し、JSON を再 serialize せず `{timestamp}.{raw_body}` で HMAC を計算して timing-safe comparison を行います。Transaction `id` は database unique constraint を持つ `payment_webhook_receipts` に claim します。入金、受取口座、payment code、正確な VND amount が pending intent と一致した場合だけ payment success を永続化します。有効な delivery には正確に `{"success": true}` を返し、自動計上できない取引は order を release せず `ignored` または `manual_review` として監査します。

### Outbound service webhook

| Field | Value |
|---|---|
| Header | `X-Signature-SHA256` |
| Algorithm | HMAC-SHA256 |
| Input | Raw request body |
| Secret | `WEBHOOK_SECRET` または target-specific secret |

LLM tools や internal service receiver は処理前に signature を検証します。

### API key callback

| Header | Secret |
|---|---|
| `x-api-key` | `SERVICE_API_KEY` または endpoint-specific service key |

## Idempotency

Money movement や重複 operation を起こし得る mutation は次の header を受け取ります。

```http
Idempotency-Key: <UUID v4>
```

Server は 24 時間の replay guard を保持します。重複 request では mutation を二重実行しません。

## OpenAPI source

- Canonical spec: [openapi.yaml](./openapi.yaml)
- Changelog: [openapi/changelog.md](./openapi/changelog.md)
- Web client package: `web/packages/api-client`

Web が利用する Admin/Restaurant endpoint は、完了扱いにする前に OpenAPI に記述します。

## CI gate

OpenAPI workflow は Spectral lint、YAML validity、generated client typecheck、route 変更時の高リスク contract tests を確認します。
