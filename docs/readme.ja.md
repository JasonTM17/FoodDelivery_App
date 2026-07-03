# FoodFlow - リアルタイムフードデリバリープラットフォーム

Documentation languages: [English](../README.md) | [Tiếng Việt](readme.vi.md) | [日本語](readme.ja.md)

FoodFlow は、NestJS バックエンド、Next.js の Admin/Restaurant ダッシュボード、Flutter モバイルアプリ、PostgreSQL/PostGIS、Redis、Socket.IO、SePay、Google/OSRM ルーティング、AI サポートチャットを含むマルチクライアント型のフードデリバリープラットフォームです。

FoodFlow は runtime で外部 workflow automation runner を使用しません。AI チャットとフード推薦は backend LLM adapter を通り、model provider が利用できない場合は明示的な degraded response を返します。

## アプリケーション

| サーフェス | パス | Runtime | デフォルト URL |
|---|---|---|---|
| Backend API | `backend/` | NestJS, Prisma, Socket.IO | `http://localhost:3001/api` |
| Admin dashboard | `web/apps/admin/` | Next.js 14, React 18, next-intl | `http://localhost:3000` |
| Restaurant dashboard | `web/apps/restaurant/` | Next.js 14, React 18, next-intl | `http://localhost:3002` |
| Customer/driver apps | `mobile/` | Flutter | Device/emulator |
| Infrastructure | `infra/`, `docker-compose*.yml` | PostgreSQL/PostGIS, Redis, MinIO | Local containers |

## 主な機能

- 注文、ウォレット/COD/SePay 支払い、リアルタイム追跡、AI サポート。
- ドライバーの稼働状態、GPS、配車、ルート案内、収益確認。
- レストランの注文カンバン、メニュー、カテゴリ、レビュー、売上、プロモーション、スタッフ、インサイト。
- Admin の KPI、ライブドライバーマップ、店舗、ユーザー、注文、プロモーション、サポート、監査ログ、エクスポート、設定。
- Web contract: success は `{ success: true, data, meta? }`、error は RFC 7807。
- Web route は `/:locale/...`、対応ロケールは `vi`, `en`, `ja`。

## ローカル起動

```bash
docker compose up -d postgres redis minio

cd backend
pnpm install --frozen-lockfile
pnpm prisma generate
pnpm prisma migrate dev
pnpm db:seed
pnpm start:dev

cd ../web
pnpm install --frozen-lockfile
pnpm dev

cd ../mobile
flutter pub get
flutter run -t lib/main_customer.dart
flutter run -t lib/main_driver.dart
```

## シークレットとセキュリティ

- `.env`、トークン、秘密鍵、DB 認証情報、service-role key を commit しないこと。
- チャット、ログ、スクリーンショット、チケット、git history に出たキーは production 前に必ず rotate すること。
- `DATABASE_URL`, `DIRECT_URL`, `DEEPSEEK_API_KEY`, `SEPAY_API_KEY`, `SEPAY_WEBHOOK_SECRET`, JWT secrets, Supabase/Vercel tokens は secret manager または ignored local env に置くこと。
- Google Maps browser key は HTTP referrer で制限し、backend Maps key は server-side のみで使うこと。
- SePay intent には `SEPAY_API_KEY` と `SEPAY_ACCOUNT_NUMBER` が必要です。QR/ref が欠けた response は reject します。

## テストゲート

```bash
cd backend
pnpm prisma validate
pnpm typecheck
pnpm lint
pnpm test
pnpm build

cd ../web
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e -- --project=chromium
pnpm test:e2e -- --project=firefox

cd ../mobile
flutter analyze
flutter test
```

Batch 4 の完了には、backend、web、Playwright Chromium/Firefox、axe、visual regression、tenant isolation、frozen install、secret scan がすべて green である必要があります。

## デプロイ

1. テスト済み PR で merge する。
2. rotate 済み secret で Supabase database/realtime を provision する。backend Prisma は runtime に pooled `DATABASE_URL`、migration に direct/session `DIRECT_URL` を使う。
3. build と E2E が通った後、Admin/Restaurant を Vercel に deploy する。
4. backend は migration、Redis、storage、SePay webhook、production CORS、health checks を有効にして deploy する。
5. production health、realtime、map、chatbot、export、notification、tenant isolation を確認する。
6. keep-alive/monitor は health endpoint が安定してから有効にする。

## ドキュメント

- [API contract](api-contract.md)
- [API reference](api-reference.md)
- [Architecture](system-architecture.md)
- [Deployment guide](deployment-guide.md)
- [Testing guide](testing-guide.md)
- [Security audit guide](security-audit-guide.ja.md)
- [Documentation localization policy](documentation-localization.md)
- [Design guidelines](design-guidelines.ja.md)
- [i18n guide](i18n-guide.md)
- [Roadmap](project-roadmap.md)

## ブランチ方針

- `batch4-integration` を clean integration branch として使う。新しい作業ブランチでは古い `codex/` prefix を使わない。
- 古い routes、runtime mock、誤った package manager、誤った generated mobile client を含む stale branch は raw-merge しない。
- 必要な変更だけを hunk-by-hunk で salvage し、focused test と小さな conventional commit を付ける。
- Mobile reconciliation は web/backend Batch 4 が安定した後に分離して行う。

## License

MIT。詳細は [LICENSE](../LICENSE) を参照してください。
