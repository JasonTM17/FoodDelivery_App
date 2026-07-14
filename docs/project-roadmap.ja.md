# FoodFlow Project Roadmap

## Current objective

Batch 4 を一つの verified production line として完成: code/mobile parity、全 local/remote gate、Supabase + Railway + Vercel deploy、production smoke、verified `master` head から immutable Docker publish。

2026-07-13 status: **integration は `master` に統合済み、hardening 中、production は no-go**。

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
- Intended source を build/seed した後だけ media を recapture し、source commit、Compose/image reference、clean final head または dirty workspace を記録します。

### Mobile release validation

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

## External blockers

- GitHub Actions billing/auth/token exhausted。
- Supabase は linked、33 migrations と最新 checksum、private Broadcast/Storage、Data API boundary、ES256 key を最後に確認済みです。FCM registration revocation の migration 34 は authorized rollout を待っています。Fake seed を実行していないため production business/RAG rows は 0 です。
- Railway topology は pass していますが public API は 404 で、API/worker は Maps/OSRM、DeepSeek、SePay/webhook、SMTP、FCM、Twilio の real provider settings 15 件が不足しています。Production GPS/Broadcast と live FCM send は blocked です。
- Admin/Restaurant production health は 200。`9db6f7e` の clean Restaurant candidate は build と protected health smoke を pass しましたが、Railway API live まで未 promote です。Admin も同じ exact-source flow が必要です。
- 以前貼られた provider key は rotate 必須。

Fake value や validation bypass は禁止です。

## Release sequence

1. Final source freeze + full local gate。
2. 全 GitHub workflows green。
3. Rotated secrets + Railway/Supabase/Vercel preflight。
4. Migrated Supabase の RLS/Realtime/Storage を authorized/cross-tenant identities で再確認。
5. Railway migrator、次に API/worker を deploy し health/readiness/Cron を確認。
6. Verified API alias で Admin/Restaurant。
7. Realtime/map/chatbot/export/payment/notification/tenant smoke。
8. Deploy commit が intended `origin/master` head のままであることを確認し、historical integration branch を再作成/push しません。
9. Docker SHA → immutable `v4.0.0` → manual `latest`。
10. Report、digests、GitHub About/topics/homepage、landing notes 更新。

## Post-release/deferred

Health/Cron/realtime/AI cost/maps/storage/payments monitor、mobile staged rollout、outbox/telemetry retention、worker tag consumer audit、one-branch policy の維持と historical integration worktree/ref の非再作成。

Measured scale 前の Kubernetes/microservices、real writer 前の Parquet、public realtime/RLS bypass、missing branch recreation、local-only evidence deploy は deferred/forbidden です。
