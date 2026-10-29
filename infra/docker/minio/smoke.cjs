// Against an explicitly disposable local container, never managed Supabase.
const assert = require('node:assert/strict');
const { Client } = require('../../../backend/node_modules/minio');
const { execFileSync } = require('node:child_process');
const port = Number(process.env.MINIO_SMOKE_PORT || 19900);
const container = process.env.MINIO_SMOKE_CONTAINER;
if (!container?.startsWith('foodflow-minio-source-check-')) throw Error('Disposable container required');
const client = new Client({ endPoint: '127.0.0.1', port, useSSL: false,
  accessKey: 'fixtureadmin', secretKey: 'synthetic-smoke-only-credential' });
const bucket = 'verification';
const key = 'synthetic.txt';
const bytes = Buffer.from('FoodFlow isolated S3 compatibility check');
async function health() {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`http://127.0.0.1:${port}/minio/health/live`)).ok) return; } catch {}
    await new Promise(r => setTimeout(r, 1000));
  }
  throw Error('MinIO not healthy within60s');
}
async function read() {
  const stream = await client.getObject(bucket, key);
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  assert.deepEqual(Buffer.concat(chunks), bytes);
}
(async () => {
  await health();
  await client.makeBucket(bucket);
  await client.putObject(bucket, key, bytes);
  await read();
  const anonymous = await fetch(`http://127.0.0.1:${port}/${bucket}/${key}`);
  assert.equal(anonymous.status, 403);
  execFileSync('docker', ['restart', container], { stdio: 'ignore' });
  await health();
  await read();
  await client.removeObject(bucket, key);
  await client.removeBucket(bucket);
  console.log('PASS health, authenticated S3 CRUD, private403, persisted bytes after restart');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
