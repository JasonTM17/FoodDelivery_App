# FoodFlow Project Roadmap

## Current objective

Batch 4 を一つの verified production line として完成: code/mobile parity、全 local/remote gate、Supabase + Railway + Vercel deploy、production smoke、verified `master` head から immutable Docker publish。

2026-07-14 status: **integration と current-head quality gates は `master` で green、managed deployment は未完了、production は no-go**。

## Completed and incorporated work

- 実在する backend/Admin/Restaurant/mobile/AI/realtime/map/docs/DevOps work の controlled consolidation。
- Branch/worktree cleanup は完了し、`master` のみが残り linked integration worktree はありません。Historical integration branch を再作成しません。
- Critical web screens の fake empty/zero fallback 除去と runtime response validation。
- Restaurant URL-authoritative vi/en/ja locale、accessibility contrast/focus。
- Supabase realtime outbox/RLS/token、Storage adapter、Postgres job outbox/Cron、explicit web provider。
- DeepSeek `deepseek-v4-flash`、session/usage telemetry、fail-closed states。
- Fresh GPS、route phase/provider geometry/ETA、tracking tenant auth、hardcoded map fallback 除去。
- Node 22.13+、pnpm 11.11、frozen install。
- 4 non-root multi-arch images と fail-closed Docker promotion。
- Screenshot/GIF capture tooling と architecture/deploy/testing docs。既存 media は source/runtime reference 付きで recapture されるまで historical です。
- Admin URL locale ownership、overview KPI 翻訳、accessible color token。関連する vi/en/ja browser/axe は historical record であり final head rerun が必要です。
- Mobile managed realtime は scoped Supabase token/channel、authenticated REST GPS/dispatch decision、receive-only outbox を使用し、Socket.IO は local/self-hosted のみです。
- Driver KYC は private signed upload、owner-scoped object key、image validation、one-pending enforcement、Admin signed review、typed vi/en/ja mobile onboarding を実装済みです。

## In progress

### UI/UX/i18n/media

- Fresh `vi/en/ja` context で title、`html lang`、visible/aria text、number/date/currency、cookie isolation を audit。
- Dashboard、approval、promotion、audit/export、staff、benchmark、AI monitor、map/order の responsive/keyboard/axe。
- Stitch/design artifact comparison と visual regression acceptance。
- Current-source local visual evidence: Restaurant mobile Kanban 修正後の CLS は約 0.0037 でした。これは計測済み regression check であり、完全な pixel baseline や production approval ではありません。
- Intended source を build/seed した後だけ media を recapture し、source commit、Compose/image reference、clean final head または dirty workspace を記録します。

### Mobile release validation

- 明示 launcher から Customer と Driver を個別 smoke します: auth と session restore/logout、許可された private realtime と cross-role/cross-tenant denial の証明、role flow。Live FCM は controlled registered device/token と real production credential が必要で、local lifecycle test は provider delivery の証拠ではありません。
- Mobile work は検証可能な branch、commit、patch evidence だけから reconcile します。Missing ref を命名、再作成、推測しません。
- API contract、vi/en/ja、customer/driver、map/GPS、offline/reconnect、realtime denial、KYC、signed release build を再実行。
- Android production signing と authorized macOS runner 上の iOS signing を確認。Local debug keystore は compile evidence のみです。

### Backend/production

- Railway の Redis dependency を audit し、明示 provision または安全に削除。
- Final source head のすべての migration を fresh PostGIS/Supabase で validate。古い固定 count を使わない。
- Supabase RLS/publication/storage/cross-tenant を live test。
- Rotated secrets で DeepSeek、route、SePay、notification、export、storage、Cron smoke。
- Release-relevant mutable Compose image を pin。

### Tests/security

Full backend、full web、Chromium/Firefox、critical-page axe 0、visual/Stitch、tenant、final-head mobile release build、secret/Gitleaks/CodeQL/audit/Trivy/SBOM/actionlint/ShellCheck。

## Current-source evidence and external blockers

- Fresh clean-volume Docker project `foodflow-batch4-e2e` は当時 current の 36 migrations を適用し、restaurants 50、drivers 50、customers 100、historical orders 500、canonical orders 9、reviews 123 を seed、RAG documents 402 件を index し、Playwright 204/204 を 6.6 分で pass しました。後の migration-only fresh database は current 38 migrations と default-address invariant を検証しました。Final clean head の full Docker/Playwright 再実行が必要で、これは local result のみです。
- 日付付き Supabase record は migrations 1–36 と migration 36 の `token,registration_id` primary key を確認しています。Current migrations 37–38 はその record に含まれず、approved migration environment で remote deploy/checksum verification が必要です。Historical zero-step migration failure は rolled back record として保持し、applied SQL は変更していません。
- 残る extension advisor warnings は解析済み制約です: PostGIS は non-relocatable、pgvector 移動は現在の Prisma/raw-operator search path を壊します。Unsafe schema change で warning を隠しません。
- Railway 依存の rollout と verification は必要な real provider configuration/credentials により外部要因で blocked です。Railway API/worker production health を claim してはいけません。Live GPS/Broadcast と controlled-device FCM は未検証であり、local notification/lifecycle test は provider delivery を証明しません。
- Admin/Restaurant production verification は authorized Supabase rollout と verified Railway API/worker に依存します。以前の web evidence を end-to-end production approval として扱ってはいけません。
- Current-head の 4 SHA images は未 publish。Private Admin/Restaurant GHCR packages が repository 未接続のため workflow は 403 です。Semver/`latest` promotion は未承認です。
- 以前貼られた provider key は rotate 必須。

Fake value や validation bypass は禁止です。

## Release sequence

1. Exposed credentials を rotate し、Railway の real settings 15 件を secret store に登録。
2. Approved migration environment で migrations 37–38 を適用し、全 38 の `prisma migrate status` と checksum を確認。Local fresh-database gate から推測しない。
3. 必要な real provider configuration が利用可能になった後、同一 immutable SHA の API/worker を deploy して health/readiness/Cron を確認。
4. Production Customer/Driver auth、private-realtime allow/deny、token refresh、GPS snapshot/delta/reconnect、Storage、map、chatbot、export、payment、notification、tenant、controlled-device FCM を smoke。
5. Verified Railway に対して exact Admin/Restaurant Vercel deployments を再 smoke。
6. Private Admin/Restaurant GHCR packages を repository に接続し Actions write を付与。4 SHA images を rerun、clean pull/scan/runtime smoke。
7. Production smoke green 後のみ `v4.0.0` と `latest` を promote し、report/digests/About を更新。

## Post-release/deferred

Health/Cron/realtime/AI cost/maps/storage/payments monitor、mobile staged rollout、outbox/telemetry retention、worker tag consumer audit、one-branch policy の維持と historical integration worktree/ref の非再作成。

Measured scale 前の Kubernetes/microservices、real writer 前の Parquet、public realtime/RLS bypass、missing branch recreation、local-only evidence deploy は deferred/forbidden です。
