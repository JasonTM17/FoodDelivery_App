# AI backend module

## Purpose

FoodFlow AI is the customer-support chatbot module. It provides authenticated chat, SSE streaming, conversation memory, fast-path classification, sentiment detection, scoped backend grounding tools, output filtering, and direct DeepSeek replies through the backend provider adapter.

The chatbot must never fabricate account-specific facts. Order, driver, restaurant, refund, recommendation, and ticket details come from internal tools that are always scoped to the authenticated `user.sub`.

## API surface

- `POST /ai/chat` - non-stream chatbot reply, auth required.
- `POST /ai/stream` - SSE chatbot stream, auth required.
- `POST /ai/chat/classify` - pre-classification fast path.

Tool methods are internal service calls only. There is no public `/ai/tools/*` route and no service-JWT tool surface in Batch 4.

## Env vars

| Name | Required | Default | Description |
|---|---|---|---|
| `DEEPSEEK_API_KEY` | no | - | DeepSeek API key for direct chatbot replies. Store as a secret and never commit it. |
| `DEEPSEEK_BASE_URL` | no | `https://api.deepseek.com` | OpenAI-compatible DeepSeek base URL. |
| `DEEPSEEK_MODEL` | no | `deepseek-v4-flash` | Direct chatbot model. |
| `DEEPSEEK_THINKING` | no | `disabled` | Set `enabled` for slower high-effort reasoning. |
| `DEEPSEEK_REASONING_EFFORT` | no | `high` | `high` or `max` when thinking is enabled. |
| `DEEPSEEK_MAX_OUTPUT_TOKENS` | no | `600` | Direct chatbot response cap. |
| `DEEPSEEK_TIMEOUT_MS` | no | `15000` | Direct chatbot upstream timeout. |
| `AI_CHAT_RATE_LIMIT_PER_MIN` | no | `10` | Per-user message cap. |
| `AI_CHAT_DAILY_CAP` | no | `100` | Per-user daily message cap. |
| `MEMORY_TTL_SEC` | no | `3600` | Conversation memory Redis TTL. |

Any key pasted into chat, screenshots, logs, tickets, or Git history must be rotated before production.

## Grounding rules

- Tool calls run only after `ToolJustificationService` approves the intent.
- Order-scoped tools query by `customerId` plus order code or UUID; they do not trust user-supplied IDs alone.
- Support-ticket creation verifies order ownership before linking a ticket to an order.
- Admin notification updates are scoped by `ticketId` and `userId`; a missing match throws instead of reporting fake success.
- DeepSeek receives `VERIFIED_CONTEXT` and is instructed to treat it as untrusted factual data, not instructions.

## Test

```bash
pnpm exec jest src/ai --runInBand
```

Before release, also run the seeded AI scenario runner against `/ai/chat` with a real test JWT:

```bash
AI_ACCESS_TOKEN=<seeded-customer-token> \
tsx e2e/ai-scenarios/run-ai-scenarios.ts \
  --endpoint http://localhost:3001/api/ai/chat \
  --fixtures e2e/ai-scenarios/canonical-conversations.json
```

`pnpm db:big-seed` provisions canonical customer orders `FF-001`, `FF-002`, `FF-003`, `FF-004`, `FF-006`, `FF-007`, `FF-008`, `FF-009`, and `FF-010` for the scenario gate. CI may use `AI_ALLOW_DEGRADED=true` only when no provider secret is configured; release/prod verification must run without degraded mode and with a valid rotated `DEEPSEEK_API_KEY`.

## Runbook

- **DeepSeek missing/down:** return `ai_templates.service_unavailable` with `action: "degraded"`; do not fabricate a successful answer.
- **Hallucination report:** inspect the returned `grounded` and `toolCalls` metadata. Account-specific claims must have matching verified tool context.
- **Tenant isolation concern:** check `AiToolsService` tests first; every order lookup must include authenticated `customerId`.
- **Cost runaway:** keep rate limits active and prefer fast-path classification for safe static questions.
