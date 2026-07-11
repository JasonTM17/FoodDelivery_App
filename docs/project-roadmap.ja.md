# FoodFlow Project Roadmap

## Current objective

Batch 4 を一つの verified production line として完成: code/mobile parity、全 local/remote gate、Supabase + Vercel deploy、production smoke、integration `HEAD` の `master` fast-forward、immutable Docker publish。

2026-07-11 status: **hardening in progress; production no-go**。

## Completed on local integration

- 実在する backend/Admin/Restaurant/mobile/AI/realtime/map/docs/DevOps work の controlled consolidation。
- Remote branch は `master` のみ。Local integration は final fast-forward まで保持。
- Critical web screens の fake empty/zero fallback 除去と runtime response validation。
- Restaurant URL-authoritative vi/en/ja locale、accessibility contrast/focus。
- Supabase realtime outbox/RLS/token、Storage adapter、Postgres job outbox/Cron、explicit web provider。
- DeepSeek `deepseek-v4-flash`、session/usage telemetry、fail-closed states。
- Fresh GPS、route phase/provider geometry/ETA、tracking tenant auth、hardcoded map fallback 除去。
- Node 22.13+、pnpm 11.11、frozen install。
- 4 non-root multi-arch images と fail-closed Docker promotion。
- Current-source screenshot/GIF pipeline と architecture/deploy/testing docs。
- Admin URL locale ownership、overview KPI 翻訳、accessible color token、accepted media recapture を完了。Targeted vi/en/ja Chromium/Firefox locale + axe は pass。
- Mobile managed realtime は scoped Supabase token/channel、authenticated REST GPS/dispatch decision、receive-only outbox を使用し、Socket.IO は local/self-hosted のみです。
- Driver KYC は private signed upload、owner-scoped object key、image validation、one-pending enforcement、Admin signed review、typed vi/en/ja mobile onboarding を実装済みです。

## In progress

### UI/UX/i18n/media

- Fresh `vi/en/ja` context で title、`html lang`、visible/aria text、number/date/currency、cookie isolation を audit。
- Dashboard、approval、promotion、audit/export、staff、benchmark、AI monitor、map/order の responsive/keyboard/axe。
- Stitch/design artifact comparison と visual regression acceptance。

### Mobile release validation

- Violet/Indigo は実在 ref のみ reconcile。Missing branch を作らない。
- API contract、vi/en/ja、customer/driver、map/GPS、offline/reconnect、realtime denial、KYC、signed release build を再実行。
- Android production signing と authorized macOS runner 上の iOS signing を確認。Local debug keystore は compile evidence のみです。

### Backend/production

- Vercel の残存 Redis dependency を audit し、明示 provision または安全に削除。
- 24 migrations を fresh PostGIS/Supabase で validate。
- Supabase RLS/publication/storage/cross-tenant を live test。
- Rotated secrets で DeepSeek、route、SePay、notification、export、storage、Cron smoke。
- Release-relevant mutable Compose image を pin。

### Tests/security

Full backend、full web、Chromium/Firefox、critical-page axe 0、visual/Stitch、tenant、final-head mobile release build、secret/Gitleaks/CodeQL/audit/Trivy/SBOM/actionlint/ShellCheck。

## External blockers

- GitHub Actions billing/auth/token exhausted。
- Supabase CLI access token/production database URLs missing。
- Vercel API は database、Supabase KYC/service、Maps/routing、DeepSeek、SePay、SMTP、FCM、Twilio env が不足。Admin/Restaurant は Supabase anon key が不足。
- 以前貼られた provider key は rotate 必須。

Fake value や validation bypass は禁止です。

## Release sequence

1. Final source freeze + full local gate。
2. 全 GitHub workflows green。
3. Rotated secrets + provider preflight。
4. Supabase migrations/RLS/Realtime/Storage。
5. Vercel API health/readiness/Cron。
6. Verified API alias で Admin/Restaurant。
7. Realtime/map/chatbot/export/payment/notification/tenant smoke。
8. `HEAD` を直接 `origin/master` へ push、one branch/`0 0` verify。
9. Docker SHA → immutable `v4.0.0` → manual `latest`。
10. Report、digests、GitHub About/topics/homepage、landing notes 更新。

## Post-release/deferred

Health/Cron/realtime/AI cost/maps/storage/payments monitor、mobile staged rollout、outbox/telemetry retention、worker tag consumer audit、`HEAD == origin/master` 後の local cleanup。

Measured scale 前の Kubernetes/microservices、real writer 前の Parquet、public realtime/RLS bypass、missing branch recreation、local-only evidence deploy は deferred/forbidden です。
