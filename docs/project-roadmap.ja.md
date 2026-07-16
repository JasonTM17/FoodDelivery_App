# FoodFlow Project Roadmap

## Current objective

Batch 4 を一つの verified production line として完成: code/mobile parity、全 local/remote gate、Supabase + Railway + Vercel deploy、production smoke、verified `master` head から immutable Docker publish。

2026-07-16 status: **runtime SHA `977d55f19ddc4fecafb8a758d2df034f4b6ff21d` は Railway API/worker/migrator と両 Vercel apps で稼働中です。API health/readiness と両 public web health routes は exact revision を返し、Database、Redis、Supabase Storage は ready、source migrations 42 件すべて active です。Current-revision GPS/private Broadcast/PostGIS smoke は 1,271 ms で pass。Physical device と full current four-role certification は未完了です**。

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

- Customer/Driver の read-only production API auth、private Realtime、cross-role denial は pass し、fixture は削除済みです。Native launcher で session restore/logout と実 UI role flow を引き続き検証します。Live FCM は controlled device/token と real production credential が必要です。
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

- Historical local evidence: clean-volume Docker project `foodflow-batch4-e2e` は当時の migrations を適用し、disposable data を seed、RAG を index、Playwright 204/204 を pass しました。これらの count は 2026-07-14 の bounded evidence であり、current runtime SHA `977d55f19ddc4fecafb8a758d2df034f4b6ff21d` や production approval の結果ではありません。
- Deployed SHA `977d55f` は source migrations 42 件すべて active で、46-row Prisma history に rolled-back audit rows 4 件を保持します。Database、Redis、Supabase Storage は ready です。Checksum audit は exact pinned historical remote/local pairs 3 件で pass し、applied SQL と remote history は書き換えていません。
- 残る extension advisor warnings は解析済み制約です: PostGIS は non-relocatable、pgvector 移動は現在の Prisma/raw-operator search path を壊します。Unsafe schema change で warning を隠しません。
- Railway migrate `e100789f-03c1-445d-9e69-b8a243973a95`、API `a84c63d1-c95e-4a69-a7eb-408e1a7dc9f4`、worker `2e4a41ea-6874-4b01-b549-d457c0a20997` は runtime SHA `977d55f19ddc4fecafb8a758d2df034f4b6ff21d` で成功しています。API health/readiness は exact revision と Database、Redis、Supabase Storage ready を報告し、worker poll は稼働、DeepSeek 不在のため RAG は disabled です。
- Google Maps は optional です。Google Directions と owned OSRM が未設定なら routing は `503 DIRECTIONS_PROVIDER_NOT_CONFIGURED`、process は healthy のままです。FCM/SMTP/Twilio/SePay/DeepSeek/owned routing は未設定または未 smoke です。
- Vercel Admin `dpl_bE5TgrKS9GqKGHSShGHk1pX41Xqs` と Restaurant `dpl_J6sXb2UHV68XKAYBF4KLvqoXAjwz` は SHA `977d55f19ddc4fecafb8a758d2df034f4b6ff21d` の exact deployment で、両 public web health routes は同 revision を返します。4-role Chrome/API journey は historical SHA `17584153` evidence です。Current-revision GPS/private Broadcast/PostGIS smoke は pass しましたが、physical-device/full UI certification の代替ではありません。
- Release baseline `977d55f19ddc4fecafb8a758d2df034f4b6ff21d` は `v0.1.3` tag です。Docker Hub/public GHCR の SHA、`v0.1.3`、`latest` aliases は 4 runtime images すべてで digest が一致し、Docker Publish run `29490699451` と Release run `29490929946` が manifests と 3 assets を検証しました。
- 以前貼られた provider key は rotate 必須。

Fake value や validation bypass は禁止です。

## Release sequence

1. Verified API/worker/Redis baseline を維持し、次回 release は一つの immutable SHA から deploy、health/readiness/worker polling を再確認。
2. Certify 対象 integration のみ sealed store で設定し、Google Maps や provider values を捏造しない。
3. Current-revision Production Customer/Driver/Admin/Restaurant authenticated journeys、token refresh、active-order GPS snapshot/delta/reconnect、configured map/routing、chatbot、export、payment、notification、tenant、controlled-device FCM を smoke。Historical 4-role evidence は current certification と再ラベルせず維持。
4. Admin/Restaurant の exact SHA `977d55f` health baseline を保持し、web deployment または API revision が変わるたび public/authenticated smoke を再実行。
5. Future release では remaining smoke が green の後だけ verified immutable artifact を promote し、未検証 digest を rebuild/retag しない。

## Post-release/deferred

Health/Cron/realtime/AI cost/maps/storage/payments monitor、mobile staged rollout、outbox/telemetry retention、worker tag consumer audit、one-branch policy の維持と historical integration worktree/ref の非再作成。

Measured scale 前の Kubernetes/microservices、real writer 前の Parquet、public realtime/RLS bypass、missing branch recreation、local-only evidence deploy は deferred/forbidden です。
