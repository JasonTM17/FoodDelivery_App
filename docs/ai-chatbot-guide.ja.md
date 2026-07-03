# AI Chatbot Guide

言語: [English](./ai-chatbot-guide.md) | [Tiếng Việt](./ai-chatbot-guide.vi.md) | [日本語](./ai-chatbot-guide.ja.md)

FoodFlow は Batch 4 で LLM-first の chatbot path を使います。Runtime は backend AI module が持ち、外部 automation runner や public AI-tool route は不要です。

## Runtime direction

- Provider: backend provider adapter 経由の DeepSeek。Default model は `deepseek-v4-flash`。
- Entry points: `POST /ai/chat` と `POST /ai/stream`。どちらも認証必須です。
- Internal grounding tools は order、driver、restaurant、refund、recommendation、support ticket の real context を取得します。
- Tool call は authenticated `user.sub` に必ず scope します。User-supplied order ID だけを信頼しません。
- Model configuration が不足または失敗した場合は、捏造せず `action: "degraded"` を返します。

## Required configuration

Real values は ignored `.env` files または provider secret stores のみに保存します。

| Variable | Purpose |
|---|---|
| `DEEPSEEK_API_KEY` | Chatbot replies 用 LLM provider key |
| `DEEPSEEK_BASE_URL` | OpenAI-compatible provider URL |
| `DEEPSEEK_MODEL` | Model name、default `deepseek-v4-flash` |
| `DEEPSEEK_TIMEOUT_MS` | Upstream timeout |

Chat、screenshots、logs、tickets、Git history に出た key は production 前に必ず rotate します。

## Product behavior

- Safe static questions には fast-path answers を優先します。
- Order、refund、restaurant、delivery、user-specific claims には tool-grounded answers を使います。
- Clients/tests が context verification を判定できるよう、`grounded` と `toolCalls` metadata を返します。
- Angry、safety、fraud、refund dispute、repeated delivery failure は support に escalate します。
- Refund、delivery ETA、promotion eligibility、restaurant availability、support outcomes、admin notifications を捏造しません。

## Validation

Release 前に実行:

- Backend AI focused unit tests.
- Real test JWT を使った `/ai/chat` seeded AI chatbot E2E scenarios.
- Prompt-injection and no-false-promise checks.
- Order と support-ticket tools の tenant isolation tests.
- Env examples、docs、staged diff の secret scan.
- Configured/degraded states の Admin AI monitor checks.
