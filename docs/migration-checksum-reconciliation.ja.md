# Migration checksum の照合

**状態:** 2026-07-15 に source の照合を準備済み。production rollout はまだ gate 中です。

この runbook は、Supabase production に既に適用されていた三つの Prisma migration checksum をどのように復元したかを記録します。`_prisma_migrations` の row、適用状態、業務データは変更していません。

## 目的

Prisma は適用時に migration の SHA-256 checksum を保存します。後続 migrator が別のファイルを黙って受け入れると、schema/security regression を隠せます。production record と現在の checkout が違ったため、immutable build artifact と Git object から source を復元し、完全一致する限定的な provenance exception にしました。

未知の drift を隠すために `prisma migrate resolve` を使いません。このコマンドは failed migration と baselining 用です（[Prisma migrate resolve](https://docs.prisma.io/docs/cli/migrate/resolve)、[Supabase Prisma guide](https://supabase.com/docs/guides/database/prisma)）。

## 確認済みの三つの record

以下は Railway の `foodflow-api` 経由で read-only query した値です。`finished_at` があり `rolled_back_at` が null の record だけを effective とします。

| Migration | Production checksum | 現在の source checksum | 復元 evidence | Guard |
| --- | --- | --- | --- | --- |
| `20260709143000_add_realtime_outbox` | `3f9705062cd288d93484e62d3afa98e3e5d9190941a9a1d62af8169eafb325a7` | `40baeeddc6f209a7bbd257ba3acf07dad1be43cd34c7212f0457e945c48751c5` | immutable `foodflow-migrate:sha-1f761a65b4a7053858a512bf6eb09a3fd2adbef0` から SQL を復元。内容は一致し、dirty line ending 表現だけが違います。 | この production/source pair だけ許可。 |
| `20260709150000_add_job_outbox` | `72d4edd8a9a2397e604b38438025670f4b35d8beb7008ff0ae33157df58a7bdf` | `1b85653815a9c7a228bf49eedeaff15efffeda76177988727b4f098a259d4606` | 同じ immutable image から復元し、元の comment を戻しました。dirty line ending 表現だけが違います。 | この production/source pair だけ許可。 |
| `20260712143000_add_production_storage_bucket` | `4664ac4299eea854a16316be6a9ed689a3320c1fca2557a4fd00f011368fd8e6` | `a0812428130e34a0204d48b6227a98468105642e6b50dc8713f4a47d709c0d4f` | Git object `c29c069ea180ed6c3107411759b8ceb2150dc8e7` から復元。違いは末尾 blank line 一つだけなので、clean source を保ち exact pair を allow-list。 | この production/source pair だけ許可。 |

Production row は変更されていません。Storage artifact の末尾 blank line は source に持ち込まず、exact-pair exception として記録しました。

## Guard の契約

`backend/src/migrations/migration-checksum-guard.ts` は Supabase Storage や schema mutation より前に実行されます。

1. `_prisma_migrations` から finished かつ未 rollback の record だけを読む。
2. local migration を canonical LF bytes で hash する。
3. exact source checksum を許可する。
4. historical exception は migration name、production checksum、source checksum の三つが静的 entry と一致するときだけ許可する。
5. その他の mismatch は `Applied migration checksum mismatch` で fail-closed する。

`_prisma_migrations` table が存在しない新規 local database だけは skip します。exception list に credential はなく、RLS/authz を弱めません。

## 検証と rollout

`backend/` で `corepack pnpm prisma generate` 後に以下を実行します。

```powershell
corepack pnpm exec jest src/migrations/production-migrate.spec.ts --runInBand
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
```

現在 Railway の migrate/API/worker は guard を含まない以前の image です。guard が production に live だと宣言するには、immutable image の build/scan、one-off migrator の preflight、backup 後の成功ログ、同じ SHA の API/worker rollout が必要です。Full certification は認証済み四 role journey、private Storage/KYC、token refresh/deny、controlled FCM、Android/iOS background location evidence が揃うまで **NO-GO** です。
