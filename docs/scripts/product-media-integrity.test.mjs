import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { buildManifestAssetIntegrity } from './product-media-integrity.mjs'

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url))
const screenshotsDirectory = path.resolve(scriptsDirectory, '../screenshots')

test('all curated media paths match the checked-in integrity manifest', async () => {
  const manifest = JSON.parse(await readFile(
    path.join(screenshotsDirectory, 'manifest.json'),
    'utf8',
  ))
  const actual = await buildManifestAssetIntegrity(manifest, {
    baseDirectory: screenshotsDirectory,
  })

  assert.equal(Object.keys(actual.files).length, 40)
  assert.deepEqual(actual, manifest.assetIntegrity)
})

test('media paths cannot escape the docs directory', async () => {
  await assert.rejects(
    buildManifestAssetIntegrity(
      { files: ['../../outside.png'] },
      { baseDirectory: screenshotsDirectory },
    ),
    /escapes docs/,
  )
})
