# AI backend module

## Purpose

FoodFlow AI provides authenticated, provider-backed support chat. It includes scoped grounding tools, conversation memory, output filtering, persisted user history, direct DeepSeek requests, and database telemetry for real provider attempts.

The module must never fabricate account-specific facts. Order, driver, restaurant, refund, recommendation, and ticket data come from internal tools scoped to the authenticated actor.

## API surface

- `POST /ai/chat` — one role-scoped, safety-filtered provider reply. Messages are trimmed and limited to 4,000 characters; `sessionId` is a server-issued UUID, while `orderId` accepts a validated UUID or FoodFlow order code that is resolved to an owned order. Provider/context failures return HTTP 503 instead of a fallback answer.
- `GET /ai/history?sessionId=<uuid>` — at most fifty persisted turns for the authenticated user. Invalid session IDs are rejected; omitted IDs select the user's latest active AI-support session.
- `POST /ai/stream` — authenticated SSE that emits a completed `response`, not fabricated word tokens.

Requested sessions are queried by `id + userId + ai_support + active` before Redis memory is read. A missing session returns 404, and a database failure during ownership verification returns 503; an unverified client session ID never becomes a Redis key.

Customer order, driver, restaurant, refund, and food-recommendation tools run only for authenticated customer actors. Admin, Restaurant, and Driver users receive role-specific workflow guidance without customer-account tool calls or invented live data. Tool methods remain internal service calls only; there is no public `/ai/tools/*` route or service-JWT tool surface.

## Provider telemetry

`AiUsageTelemetryService` records real provider attempts in `ai_usage_events`: outcome, returned model, actual token usage when supplied, latency, and a bounded error code. It intentionally never estimates cost. Telemetry persistence is contained so an observability outage cannot change the result of a chat request.

## Env vars

| Name | Required in production | Default | Description |
|---|---|---|---|
| `DEEPSEEK_API_KEY` | yes | — | Rotated DeepSeek key; store only as a server secret. |
| `DEEPSEEK_BASE_URL` | no | `https://api.deepseek.com` | OpenAI-compatible DeepSeek base URL. |
| `DEEPSEEK_MODEL` | no | `deepseek-v4-flash` | Requested direct-chat model. |
| `DEEPSEEK_THINKING` | no | `disabled` | Enables provider thinking mode when approved. |
| `DEEPSEEK_REASONING_EFFORT` | no | `high` | `high` or `max` when thinking is enabled. |
| `DEEPSEEK_MAX_OUTPUT_TOKENS` | no | `600` | Direct-chat response cap. |
| `DEEPSEEK_TIMEOUT_MS` | no | `15000` | Direct-chat upstream timeout. |
| `DEEPSEEK_DAILY_BUDGET_USD` | no | — | Approved budget reference only; not a billing source. |

Any key pasted into chat, screenshots, logs, tickets, or Git history must be rotated before production.

## Grounding rules

- Tool calls run only after `ToolJustificationService` approves the intent.
- Order tools query within authenticated ownership/tenant scope; user input alone never grants access.
- Support-ticket creation verifies order ownership before linking a ticket.
- DeepSeek receives `VERIFIED_CONTEXT` as data, never as instructions.
- Provider/configuration failures surface a 503 code and do not persist an invented assistant response.

## Test

```bash
pnpm exec jest src/ai src/admin/admin-ai-monitor.service.spec.ts --runInBand
```

Before release, run an authenticated `/ai/chat` smoke with a rotated provider key, then verify `ai_usage_events` and the Admin AI Monitor contain the resulting real telemetry.
