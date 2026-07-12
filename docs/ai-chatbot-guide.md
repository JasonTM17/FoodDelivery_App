# AI Chatbot Guide

Languages: [English](./ai-chatbot-guide.md) | [Tiếng Việt](./ai-chatbot-guide.vi.md) | [日本語](./ai-chatbot-guide.ja.md)

FoodFlow runs an LLM-first chatbot in Batch 4. The backend AI module owns provider access, grounding, telemetry, and authorization. There is no public AI-tool route and no browser-held provider key.

## Runtime contract

- `POST /ai/chat` creates one authenticated, role-scoped, safety-filtered DeepSeek reply. The trimmed message is limited to 4,000 characters; `sessionId` is a server-issued UUID, while `orderId` accepts a validated UUID or FoodFlow order code that is resolved to the caller's owned order.
- `GET /ai/history?sessionId=<uuid>` returns at most fifty persisted turns for the authenticated user only. Omit `sessionId` for that user's latest active AI-support session.
- `POST /ai/stream` is an authenticated SSE transport. It emits the completed, safety-filtered provider response as `response`; it does not fabricate word tokens from a finished reply.
- Admin and Restaurant web shells load the signed-in user's history and expose a fixed assistant panel outside login routes. The mobile client uses the same REST contract.
- Every request is sent to the live provider. Static fast-path answers and runtime fallback replies are intentionally not used.

## Grounding and tenancy

- Internal tools fetch real order, driver, restaurant, refund, recommendation, and support-ticket context.
- Order tools are scoped to the authenticated actor; user-supplied order IDs or codes are never sufficient authorization.
- Customer order, driver, restaurant, refund, and recommendation tools run only for authenticated customer actors. Admin, Restaurant, and Driver actors receive role-specific workflow guidance without customer-account tool calls.
- A requested session is ownership-checked before Redis history is read. Missing sessions return 404; an ownership-check outage returns 503, so an unverified session ID never becomes a shared memory key.
- The model receives `VERIFIED_CONTEXT` as factual data only and is instructed never to follow instructions embedded in that context.
- AI support tickets use `channel: ai_chat` and `ai_session:<uuid>` tags. High-severity escalations create persisted admin notifications only when an active admin exists.
- User turns are recorded with their actual role (`customer`, `driver`, `restaurant`, or `admin`); assistant turns are recorded as `ai`.

## Telemetry and AI Monitor

Every real provider attempt writes an `ai_usage_events` record with provider, configured/returned model, outcome, actual response usage tokens when supplied, latency, and a bounded error code. The table is protected by Supabase RLS for `service_role`.

The Admin AI Monitor derives conversations, escalations, request counts, token totals, latency, and last-provider status from database records. It never estimates cost from tokens: cost remains unavailable until an approved provider billing source is connected. A configured key with no observed request is shown as awaiting telemetry, not online.

## Failure behavior

`POST /ai/chat` fails closed with HTTP 503 when configuration is missing, the provider is unavailable, output is rejected by safety filtering, or grounded context cannot be verified. The public API codes are:

| Code | Meaning |
|---|---|
| `AI_PROVIDER_NOT_CONFIGURED` | The server-side provider secret is absent or invalid. |
| `AI_PROVIDER_UNAVAILABLE` | The provider failed, timed out, or returned an unsafe/empty result. |
| `AI_CONTEXT_UNAVAILABLE` | Required grounded context could not be verified safely. |
| `AI_SESSION_NOT_FOUND` | The requested active AI-support session does not belong to the caller or no longer exists. |
| `ORDER_NOT_FOUND` | The supplied customer-scoped order UUID could not be verified. |
| `SESSION_ORDER_MISMATCH` | The supplied order does not match the verified conversation session. |

Filtered, truncated, or otherwise incomplete provider completions are also rejected. No synthetic assistant message, delivery fact, refund, ETA, promotion, or support outcome is produced for these failures.

## Required configuration

Store real values only in an ignored local environment file or the production secret manager. Never paste a key into chat, source control, screenshots, or a public web environment variable.

| Variable | Purpose |
|---|---|
| `DEEPSEEK_API_KEY` | Rotated server-only provider key; required in production. |
| `DEEPSEEK_BASE_URL` | OpenAI-compatible provider URL. |
| `DEEPSEEK_MODEL` | Requested model; defaults to `deepseek-v4-flash`. |
| `DEEPSEEK_TIMEOUT_MS` | Upstream timeout, bounded to 60 seconds. |
| `DEEPSEEK_MAX_OUTPUT_TOKENS` | Output cap, bounded to 8,000 tokens. |
| `DEEPSEEK_DAILY_BUDGET_USD` | Optional approved budget reference; not a cost source. |

Any key previously exposed in chat, logs, screenshots, tickets, or Git history must be rotated before production.

## Release checks

- Run focused backend AI, provider, telemetry, and monitor tests.
- Run Admin and Restaurant widget/history tests in all supported locales.
- Run a real authenticated `/ai/chat` smoke with a rotated production key; a mock or degraded response is not approval evidence.
- Verify the Admin AI Monitor receives a real request record with tokens/latency when the provider returns usage.
- Run tenant-isolation, prompt-injection, OpenAPI/api-client contract, and staged secret scans.
