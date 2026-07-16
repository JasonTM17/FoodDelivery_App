# FoodFlow Project Roadmap

## Current objective

Batch 4 を一つの verified production line として完成: code/mobile parity、全 local/remote gate、Supabase + Railway + Vercel deploy、production smoke、verified `master` head から immutable Docker publish。

2026-07-16 status: **runtime SHA `84eeac3a2845868fc3a7fd45f8a73775e834a09d` は Railway API/worker/migrator で稼働中です。Admin Vercel は同じ source から rebuild、Restaurant は free-team daily quota のため直前の healthy deployment を維持します。API health/readiness、public web smoke、Database、Redis、Supabase Storage、42 migrations checksum audit は pass。Physical device と full current four-role certification は未完了です**。

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

- Historical local evidence: clean-volume Docker project `foodflow-batch4-e2e` は当時の migrations を適用し、disposable data を seed、RAG を index、Playwright 204/204 を pass しました。これらの count は 2026-07-14 の bounded evidence であり、current runtime SHA `84eeac3a2845868fc3a7fd45f8a73775e834a09d` や production approval の結果ではありません。
- Deployed SHA `84eeac3` は source migrations 42 件すべて active です。Database、Redis、Supabase Storage と Realtime/Job/Storage provenance audit 42/42 は pass します。

- 残る extension advisor warnings は解析済み制約です: PostGIS は non-relocatable、pgvector 移動は現在の Prisma/raw-operator search path を壊します。Unsafe schema change で warning を隠しません。
- Railway migrate `67331bd5-0a58-4224-bb18-b97b48702eee`、API `a0b5c5d4-1695-4584-9a73-12bcf66b1080`、worker `0e1b7b4a-db42-4a2a-b61f-bbddeb244588` は runtime SHA `84eeac3a2845868fc3a7fd45f8a73775e834a09d` で成功しています。
- Google Maps は optional です。Google Directions と owned OSRM が未設定なら routing は `503 DIRECTIONS_PROVIDER_NOT_CONFIGURED`、process は healthy のままです。FCM/SMTP/Twilio/SePay/DeepSeek/owned routing は未設定または未 smoke です。
- Admin Vercel は SHA `84eeac3` から rebuild 済み、Restaurant は quota reset 待ちです。4-role Chrome/API journey は historical SHA `17584153` evidence です。
- Docker Publish run `29515529360` は Docker Hub/public GHCR に 4 immutable SHA manifests を publish しました。`latest`/semver は未 promotion です。
- 以前貼られた provider key は rotate 必須。

Fake value や validation bypass は禁止です。

## Release sequence

1. Verified API/worker/Redis baseline を維持し、次回 release は一つの immutable SHA から deploy、health/readiness/worker polling を再確認。
2. Certify 対象 integration のみ sealed store で設定し、Google Maps や provider values を捏造しない。
3. Current-revision Production Customer/Driver/Admin/Restaurant authenticated journeys、token refresh、active-order GPS snapshot/delta/reconnect、configured map/routing、chatbot、export、payment、notification、tenant、controlled-device FCM を smoke。Historical 4-role evidence は current certification と再ラベルせず維持。
4. Railway/Admin SHA `84eeac3` baseline を保持し、Vercel quota reset 後に Restaurant を promote して public/authenticated smoke を再実行。
5. Future release では remaining smoke が green の後だけ verified immutable artifact を promote し、未検証 digest を rebuild/retag しない。

## Post-release/deferred

Health/Cron/realtime/AI cost/maps/storage/payments monitor、mobile staged rollout、outbox/telemetry retention、worker tag consumer audit、one-branch policy の維持と historical integration worktree/ref の非再作成。

Measured scale 前の Kubernetes/microservices、real writer 前の Parquet、public realtime/RLS bypass、missing branch recreation、local-only evidence deploy は deferred/forbidden です。
