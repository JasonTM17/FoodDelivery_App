import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const mediaPathPattern = /\.(gif|png|webp)$/i

export function collectManifestMediaPaths(value, paths = new Set()) {
  if (typeof value === 'string' && mediaPathPattern.test(value)) {
    paths.add(value)
  } else if (Array.isArray(value)) {
    value.forEach(item => collectManifestMediaPaths(item, paths))
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach(item => collectManifestMediaPaths(item, paths))
  }
  return paths
}

export async function buildManifestAssetIntegrity(
  manifest,
  { baseDirectory, basePath = 'docs/screenshots' },
) {
  const docsDirectory = path.resolve(baseDirectory, '..')
  const mediaPaths = [...collectManifestMediaPaths(manifest)].sort()
  const files = {}

  for (const mediaPath of mediaPaths) {
    const absolutePath = path.resolve(baseDirectory, mediaPath)
    if (!absolutePath.startsWith(`${docsDirectory}${path.sep}`)) {
      throw new Error(`Manifest media path escapes docs: ${mediaPath}`)
    }
    files[mediaPath] = createHash('sha256')
      .update(await readFile(absolutePath))
      .digest('hex')
      .toUpperCase()
  }

  return { algorithm: 'SHA-256', basePath, files }
}
