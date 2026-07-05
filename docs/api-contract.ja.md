# API 契約

言語: [English](./api-contract.md) | [Tiếng Việt](./api-contract.vi.md) | [日本語](./api-contract.ja.md)

この文書は Batch 4 の Web/Admin/Restaurant API 契約を定義します。明示的に version 化または互換 alias がある場合を除き、既存の customer/mobile 契約は変更しません。

## バージョン方針

- Public な version path は `/v1`, `/v2` などを使います。
- Batch 4 の Web endpoint は、既存 Admin/Restaurant route がある場合に 1 サイクルだけ互換 alias を持てます。
- Breaking change は新 version または文書化された互換 alias が必要です。
- Additive change は同じ version に残せます。

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
  "type": "https://api.foodflow.vn/errors/validation",
  "title": "Validation Error",
  "status": 422,
  "detail": "Email khong dung dinh dang",
  "instance": "/v1/auth/register",
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

## WebSocket 認証とルーム認可

- Socket.IO の `/events`、`/tracking`、`/notifications`、`/dispatch` namespace は `handshake.auth.token` または `Authorization` header に現在の bearer access token を必要とします。
- Refresh token、期限切れ token、不正な署名、無効化された user は room join 前に拒否されます。
- `/events` の Admin room は database で確認した `admin` role が必要です。
- Restaurant room は要求された tenant に属する active restaurant profile が必要です。
- Order room は admin または注文参加者（customer、担当 driver、active restaurant staff）のみ join できます。
- `/tracking` の位置更新は認証済み `driver` account からのみ受け付けます。
- `/notifications` は検証済み token から user room を決定し、client が別 user の room を選ぶことはできません。
- `/dispatch` は `driver` account のみ受け付け、`driver:<authenticated-user-id>` のみに join し、認証 user と異なる driver ID の offer response を拒否します。
- Production origin は `CORS_ORIGINS` を使用し、local default は port 3000、3002、3003 を許可します。

## Order tracking REST snapshot

- `GET /orders/{id}/tracking` は customer-scoped で、認証済み customer 自身の order について Redis/cache/database の real telemetry だけを返します。
- `driverLocation`、`etaMinutes`、`routePolyline` は nullable です。Client は null を unavailable data として扱い、straight-line ETA や route geometry を捏造してはいけません。
- `routePhase` は必須 field で、pickup 前は `pickup`、pickup 後は `dropoff` です。Mobile/web client は stale pickup geometry を customer-bound delivery に再利用しないためにこの field を使います。
- Customer mobile は realtime events を subscribe する前にこの snapshot を hydrate し、その後 realtime `delivery:eta_updated` で planned route を置換または clear します。

## HMAC 規約

### Inbound SePay webhook

| Field | Value |
|---|---|
| Header | `x-sepay-signature` |
| Algorithm | HMAC-SHA256 |
| Input | Raw request body |
| Secret | `SEPAY_WEBHOOK_SECRET` |
| Replay protection | transaction reference ごとの Redis deduplication key、TTL 24h |

Verification flow: header を読み、raw body で HMAC を計算し、timing-safe equality で比較します。不一致なら `WEBHOOK_INVALID_SIGNATURE` で拒否し、処理済み transaction を deduplicate してから payment result を永続化します。

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
