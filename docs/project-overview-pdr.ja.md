# FoodFlow プロジェクト概要・製品要件

Languages: [English](./project-overview-pdr.md) | [Tiếng Việt](./project-overview-pdr.vi.md) | [日本語](./project-overview-pdr.ja.md)

## 目的

FoodFlow は、顧客の注文、Restaurant の注文・メニュー運用、Driver の配送、Admin の marketplace 運用を支援します。multi-tenant のため、Restaurant staff、realtime event、tracking、export、Admin 操作は必ず認可済み actor の範囲に限定します。

## プロダクト面

| 面 | 主な利用者 | 責務 |
|---|---|---|
| NestJS API / worker | 全 client・運用 | Auth、RBAC、tenant check、durable job、integration、audit |
| Admin dashboard | Marketplace 運用者 | KPI、support、review、audit、driver、user、restaurant |
| Restaurant dashboard | Restaurant staff | Order、menu、staff、promotion、revenue、review、営業時間 |
| Customer app | 顧客 | Browse、cart、checkout、order tracking、support |
| Driver app | Driver | KYC、GPS availability、dispatch、配送状態、earnings |

Managed production は Supabase（PostgreSQL/PostGIS、Realtime、Storage）、Railway（API、worker、migrator、Redis）、Vercel（Admin、Restaurant）を使用します。Docker Compose は local/self-hosted 専用の別 topology です。

## 主要要件

- Order、payment、dispatch、notification、export、audit は永続化された実データを使います。provider 不足/障害を成功として偽装しません。
- API は保護 operation ごとに identity、role、tenant/ownership を確認します。realtime claim は short-lived private です。
- Driver availability は GPS ベースです。canonical command 成功前に pause/offline を成功表示せず、logout は subscription を解除して旧 session が新 session を更新しないようにします。
- Notification は durable job です。FCM は `FCM_PROJECT_ID` と ADC/workload identity または secret-managed `FCM_SERVICE_ACCOUNT_JSON` による Firebase Admin SDK/HTTP v1 を使用します。provider request は retry し、恒久 invalid token は stale にします。
- Admin/Restaurant は responsive、keyboard 操作、skip link、visible focus、reduced motion、locale 保持を満たします。
- User-facing copy は `vi`、`en`、`ja` を用意します。

## 今回の hardening の受入基準

1. Backend は legacy FCM server key を使わず、provider failure と invalid token を test します。
2. Driver の login/logout、availability、dispatch、realtime が stale async による別 session 更新や失敗した offline の成功表示を起こしません。
3. Restaurant sidebar/drawer は responsive / accessible で、locale、focus、motion preference を守ります。
4. Docs は Railway/Supabase/Vercel、FCM、test 範囲、release blocker、deploy 順序を事実に基づいて記し、未完了 check を production approval としません。

## Release の境界

Repo だけでは外部 secret の検証や deploy はできません。release 前に rotated secret、final head の full gate、新しい remote CI、制御 token による live FCM、現 deployment の認証済み browser smoke が必要です。
