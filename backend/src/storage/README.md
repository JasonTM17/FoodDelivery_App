# storage — Backend Service

## Purpose

MinIO S3-compatible object storage abstraction. Direct upload via FormData validates size, allowed image MIME type, and image magic bytes before upload. Generates public CDN URLs for served images.

## API surface

- `POST /storage/upload` — Direct multipart upload (auth-required)
- `POST /storage/presigned-url` — Generate presigned PUT URL for client-side upload
- `GET /storage/files/:key` — Public read (CDN-cached)

## Env vars

| Name | Required | Default | Description |
|---|---|---|---|
| `MINIO_ENDPOINT` | yes | — | MinIO server host |
| `MINIO_PORT` | no | `9000` | API port |
| `MINIO_ACCESS_KEY` | yes | — | Service credentials |
| `MINIO_SECRET_KEY` | yes | — | Service credentials |
| `MINIO_BUCKET` | yes | `foodflow` | Default bucket |
| `MINIO_PUBLIC_URL` | yes | — | CDN base URL for served files |
| `STORAGE_MAX_UPLOAD_MB` | no | `5` | Max single file size, capped at 50 MB |

## Test

```bash
npx jest storage
```

## Runbook

- **MIME mismatch:** Server validates magic bytes against declared MIME. Rejects spoof attempts with 400.
- **Bucket policy drift:** Apply via `pnpm scripts:storage-init` — sets read-only public, write-only via service account.
- **Orphan files:** Cleanup cron lists files với key not referenced by any DB row, deletes after 30-day TTL.
- **Presigned URL leak:** TTL `5 min` mặc định; if customer device clock skew, regenerate.
