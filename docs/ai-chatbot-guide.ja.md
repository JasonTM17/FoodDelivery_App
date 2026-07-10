# AI Chatbot Guide

言語: [English](./ai-chatbot-guide.md) | [Tiếng Việt](./ai-chatbot-guide.vi.md) | [日本語](./ai-chatbot-guide.ja.md)

FoodFlow は Batch 4 で LLM-first のチャットボットを運用します。バックエンド AI モジュールがプロバイダー、grounding、telemetry、認可を所有します。公開 AI-tool route はなく、ブラウザーにプロバイダーキーを渡しません。

## Runtime contract

- `POST /ai/chat` は認証済みユーザーの role に限定した safety filter 済み DeepSeek 応答を一件作成します。trim 後の message は最大 4,000 文字です。`sessionId` は server 発行 UUID、`orderId` は検証済み UUID または FoodFlow order code で、caller 所有 order に resolve されます。
- `GET /ai/history?sessionId=<uuid>` は認証済みユーザー自身の保存済みターンを最大 50 件返します。`sessionId` を省略すると、そのユーザーの最新 active AI-support session を返します。
- `POST /ai/stream` は認証済み SSE transport です。完全に filter 済みの `response` を送信し、完成済み回答を偽の word token に分割しません。
- Admin と Restaurant web はサインイン済みユーザーの履歴を読み込み、ログイン画面以外で固定アシスタントパネルを表示します。Mobile も同じ REST contract を使用します。
- すべての要求は実際の provider を呼びます。static fast-path や runtime fallback reply は使用しません。

## Grounding とテナント分離

- 内部 tool は order、driver、restaurant、refund、recommendation、support ticket の実際の context を取得します。
- order tool は必ず認証済み actor に scope され、ユーザー入力の order ID/code だけでは認可されません。
- order、driver、restaurant、refund、recommendation tool は認証済み customer actor にのみ実行され、常にその customer ID を受け取ります。Admin、Restaurant、Driver actor には role 別 workflow guidance を返し、customer account tool は実行しません。
- 要求 session は Redis history 読み込み前に ownership を検証します。存在しない session は 404、ownership 検証中の database 障害は 503 となり、未検証 session ID が共有 memory key になることはありません。
- Model は `VERIFIED_CONTEXT` を事実データとして扱い、context 内の命令には従いません。
- AI ticket は `channel: ai_chat` と `ai_session:<uuid>` tag を使用します。高重要度 escalation は active admin が存在する場合のみ notification を保存します。
- User turn は実際の role (`customer`、`driver`、`restaurant`、`admin`) で、assistant turn は `ai` として保存されます。

## Telemetry と AI Monitor

実際の provider 呼び出しごとに、provider、設定/返却 model、outcome、provider が返した実トークン usage、latency、制限済み error code を `ai_usage_events` に保存します。テーブルは `service_role` 用の Supabase RLS で保護されます。

Admin AI Monitor は database の会話、escalation、request、token、latency、最新 provider 状態から表示します。FoodFlow は token から cost を推定しません。承認済み billing source 接続前は cost を unavailable とします。key が設定済みでも実 request がない場合は online ではなく telemetry 待機として表示します。

## 失敗時の動作

`POST /ai/chat` は設定不足、provider 障害、安全 filter 拒否、grounded context 未検証の場合に HTTP 503 で fail-closed します。

| Code | 意味 |
|---|---|
| `AI_PROVIDER_NOT_CONFIGURED` | server-side provider secret が不足または無効です。 |
| `AI_PROVIDER_UNAVAILABLE` | provider error、timeout、空/安全でない結果です。 |
| `AI_CONTEXT_UNAVAILABLE` | 必要な grounded context を安全に検証できません。 |
| `AI_SESSION_NOT_FOUND` | 要求された active AI-support session が caller に属さないか、存在しません。 |
| `ORDER_NOT_FOUND` | 現在の customer に属する order UUID を検証できません。 |
| `SESSION_ORDER_MISMATCH` | 指定 order が検証済み session と一致しません。 |

filter、切断、未完了の provider completion も拒否されます。これらの失敗で assistant の偽回答、refund、ETA、promotion、support 結果は生成されません。

## 必須設定

実値は ignore 済み local env または production secret manager のみに保存します。chat、source control、screenshot、web の public env に key を貼り付けません。

| Variable | Purpose |
|---|---|
| `DEEPSEEK_API_KEY` | rotate 済み server-only provider key。production では必須。 |
| `DEEPSEEK_BASE_URL` | OpenAI-compatible provider URL。 |
| `DEEPSEEK_MODEL` | 要求 model。default は `deepseek-v4-flash`。 |
| `DEEPSEEK_TIMEOUT_MS` | upstream timeout。最大 60 秒。 |
| `DEEPSEEK_MAX_OUTPUT_TOKENS` | output cap。最大 8,000 token。 |
| `DEEPSEEK_DAILY_BUDGET_USD` | 承認済み budget 参照。cost source ではありません。 |

chat、log、screenshot、ticket、Git history に露出した key は production 前に rotate が必要です。

## Release checks

- backend AI/provider/telemetry/monitor test を実行します。
- Admin と Restaurant の widget/history test を対応 locale で実行します。
- rotate 済み production key で認証済み `/ai/chat` smoke を実行します。mock または degraded response は承認証跡になりません。
- provider が usage を返す場合、AI Monitor に実 request の token/latency が記録されることを確認します。
- tenant isolation、prompt-injection、OpenAPI/api-client contract、staged secret scan を実行します。
