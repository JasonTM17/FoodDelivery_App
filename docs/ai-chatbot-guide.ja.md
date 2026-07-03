# AI Chatbot Guide

言語: [English](./ai-chatbot-guide.md) | [Tiếng Việt](./ai-chatbot-guide.vi.md) | [日本語](./ai-chatbot-guide.ja.md)

FoodFlow は Batch 4 で LLM-first chatbot path を使います。Chatbot は backend AI module が所有し、外部 workflow engine には依存しません。

## Runtime direction

- Default provider: backend provider adapter 経由の DeepSeek V4 Flash。
- Entry point: backend `/ai/stream` と関連 AI tool endpoints。
- 外部 workflow engine への runtime dependency はありません。
- Model configuration が不足または失敗した場合、明確な degraded response を返します。
- Recommendation features は order、menu、restaurant、user、support context の real data を backend tools 経由で使い、business data を捏造しません。

## Required configuration

Real values は ignored `.env` files または provider secret stores のみに保存します。

| Variable | Purpose |
|---|---|
| `DEEPSEEK_API_KEY` | Chatbot replies 用 LLM provider key |
| `DEEPSEEK_BASE_URL` | OpenAI-compatible provider URL |
| `DEEPSEEK_MODEL` | Model name、default `deepseek-v4-flash` |
| `DEEPSEEK_TIMEOUT_MS` | Upstream timeout |
| `AI_SERVICE_JWT_SECRET` | Service-to-service tool authorization |

Chat、screenshots、logs、tickets、Git history に出た key は production 前に必ず rotate します。

## Product behavior

- Safe static questions には fast-path answers を優先します。
- Order、refund、restaurant、delivery、user-specific claims には tool-grounded answers を使います。
- Confidence が低い場合、safety policy が回答を止める場合、人間対応が必要な場合は support に escalate します。
- Refund、delivery ETA、promotion eligibility、restaurant availability、support outcomes を捏造しません。

## Validation

Release 前に実行:

- Backend AI focused unit tests。
- Seeded AI chatbot E2E scenarios。
- Prompt-injection と no-false-promise checks。
- Env examples と docs の secret scan。
- Configured/degraded states の Admin AI monitor checks。
