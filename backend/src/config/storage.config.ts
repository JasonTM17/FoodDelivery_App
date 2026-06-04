import { registerAs } from '@nestjs/config'

export const storageConfig = registerAs('storage', () => ({
  minio: {
    endpoint: process.env.MINIO_ENDPOINT ?? 'localhost',
    port: parseInt(process.env.MINIO_PORT ?? '9000', 10),
    accessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
    bucket: process.env.MINIO_BUCKET ?? 'foodflow',
    publicUrl: process.env.MINIO_PUBLIC_URL ?? 'http://localhost:9000',
  },
}))
