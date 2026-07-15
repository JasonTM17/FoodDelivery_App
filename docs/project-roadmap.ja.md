# FoodFlow Project Roadmap

## Current objective

Batch 4 を一つの verified production line として完成: code/mobile parity、全 local/remote gate、Supabase + Railway + Vercel deploy、production smoke、verified `master` head から immutable Docker publish。

2026-07-15 status: **deployed runtime candidate `f2c02ed76fb6a79671c1c51d10d8b6aef0f55b8b` は backend、CI、registry、Supabase 41 migrations、exact-revision Railway/Vercel health、API-level GPS evidence が green。Full production certification は no-go**。

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

- Verified Railway managed Redis を healthy に保ち readiness を monitor。
- Final source head のすべての migration を fresh PostGIS/Supabase で validate。古い固定 count を使わない。
- Supabase RLS/publication/storage/cross-tenant を live test。
- Rotated secrets で DeepSeek、route、SePay、notification、export、storage、Cron smoke。
- Release-relevant mutable Compose image を pin。

### Tests/security

Full backend、full web、Chromium/Firefox、critical-page axe 0、visual/Stitch、tenant、final-head mobile release build、secret/Gitleaks/CodeQL/audit/Trivy/SBOM/actionlint/ShellCheck。

## Current-source evidence and external blockers

- Fresh clean-volume Docker project `foodflow-batch4-e2e` は当時 current の 36 migrations を適用し、restaurants 50、drivers 50、customers 100、historical orders 500、canonical orders 9、reviews 123 を seed、RAG documents 402 件を index し、Playwright 204/204 を 6.6 分で pass しました。後の migration-only fresh database は current 38 migrations と default-address invariant を検証しました。Final clean head の full Docker/Playwright 再実行が必要で、これは local result のみです。
- current read-only Supabase audit は migrations 1–38、default-address index、UUID default を確認しました。以前の 1–36 record は historical evidence のみです。Historical zero-step migration failure は rolled back record として保持し、applied SQL は変更していません。
- 残る extension advisor warnings は解析済み制約です: PostGIS は non-relocatable、pgvector 移動は現在の Prisma/raw-operator search path を壊します。Unsafe schema change で warning を隠しません。
- Runtime candidate `52f4336` は 144 suites / 1065 tests、typecheck、lint、build、trigger された GitHub workflows、multi-architecture runtime smoke、High/Critical image scans を pass。Railway migrate `a9002614-ed2a-438c-9a4e-7170954052fc`、API `4e51ae50-1218-4c1b-a315-3c31ddf6de5c`、worker `4f818c68-ce66-4aab-ae6e-f8ed708b4f91` は immutable SHA images で成功。API health/readiness は database、Redis、Supabase Storage up、worker poll 稼働、DeepSeek 不在のため RAG は disabled です。
- Google Maps は optional です。Google Directions と owned OSRM が未設定なら routing は `503 DIRECTIONS_PROVIDER_NOT_CONFIGURED`、process は healthy のままです。FCM/SMTP/Twilio/SePay/DeepSeek/owned routing は未設定または未 smoke です。
- Earlier `ed25399` artifact record の Admin/Restaurant deployments は Vercel で READY、health/login は 200 です。Current Railway API に対する exact authenticated re-smoke は未完了です。
- `ed25399` の 4 SHA images は Docker Hub と public GHCR に publish 済みで、各 cross-registry digest は一致します。Packages は repository-linked、Actions write 済みです。Semver/`latest` promotion は未承認です。
- 以前貼られた provider key は rotate 必須。

Fake value や validation bypass は禁止です。

## Release sequence

1. Verified API/worker/Redis baseline を維持し、次回 release は一つの immutable SHA から deploy、health/readiness/worker polling を再確認。
2. Certify 対象 integration のみ sealed store で設定し、Google Maps や provider values を捏造しない。
3. Production Customer/Driver auth、token refresh、GPS snapshot/delta/reconnect、Storage、configured map/routing、chatbot、export、payment、notification、tenant、controlled-device FCM を smoke。
4. Current Railway API に対して exact Admin/Restaurant Vercel deployments を再 smoke。
5. 4 SHA images を clean pull/scan/runtime smoke。
6. Production smoke green 後のみ `v4.0.0` と `latest` を promote し、report/digests/About を更新。

## Post-release/deferred

Health/Cron/realtime/AI cost/maps/storage/payments monitor、mobile staged rollout、outbox/telemetry retention、worker tag consumer audit、one-branch policy の維持と historical integration worktree/ref の非再作成。

Measured scale 前の Kubernetes/microservices、real writer 前の Parquet、public realtime/RLS bypass、missing branch recreation、local-only evidence deploy は deferred/forbidden です。
