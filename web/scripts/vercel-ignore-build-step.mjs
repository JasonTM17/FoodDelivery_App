import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SUPPORTED_SURFACES = new Set(['admin', 'restaurant']);
const FULL_GIT_SHA = /^[0-9a-f]{40}$/i;
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const DEFAULT_REPOSITORY_ROOT = resolve(dirname(SCRIPT_PATH), '..', '..');

const sharedBuildInputs = [
  'package.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  '.npmrc',
  '.nvmrc',
  '.node-version',
  '.vercelignore',
  'web/packages',
  'web/scripts/vercel-ignore-build-step.mjs',
  'web/package.json',
  'web/pnpm-lock.yaml',
  'web/pnpm-workspace.yaml',
  'web/turbo.json',
  'web/.npmrc',
  'web/.nvmrc',
  'web/.node-version',
  'web/.eslintrc.json',
  'web/.prettierrc',
  'web/tsconfig.json',
  'web/tsconfig.base.json',
  'web/vercel.json',
];

function runGit(repositoryRoot, args) {
  return spawnSync('git', args, {
    cwd: repositoryRoot,
    encoding: 'utf8',
    timeout: 15_000,
    windowsHide: true,
  });
}

function gitCommitExists(repositoryRoot, revision) {
  return runGit(repositoryRoot, ['cat-file', '-e', `${revision}^{commit}`]).status === 0;
}

function ensurePreviousCommitExists(repositoryRoot, revision) {
  if (gitCommitExists(repositoryRoot, revision)) {
    return true;
  }

  const fetch = runGit(repositoryRoot, [
    'fetch',
    '--no-tags',
    '--depth=1',
    'origin',
    revision,
  ]);

  return fetch.status === 0 && gitCommitExists(repositoryRoot, revision);
}

/**
 * Vercel interprets exit code 0 as "skip" and 1 as "build". Every uncertain
 * state therefore returns build=true so incomplete Git history cannot suppress
 * a production build.
 */
export function evaluateVercelBuild({
  surface,
  previousSha,
  currentSha = 'HEAD',
  repositoryRoot = DEFAULT_REPOSITORY_ROOT,
}) {
  if (!SUPPORTED_SURFACES.has(surface)) {
    return { build: true, reason: `unsupported surface: ${surface || '<missing>'}` };
  }

  if (!FULL_GIT_SHA.test(previousSha ?? '')) {
    return { build: true, reason: 'previous deployment SHA is missing or invalid' };
  }

  if (currentSha !== 'HEAD' && !FULL_GIT_SHA.test(currentSha)) {
    return { build: true, reason: 'current deployment SHA is invalid' };
  }

  if (!ensurePreviousCommitExists(repositoryRoot, previousSha)) {
    return {
      build: true,
      reason: 'previous deployment commit could not be fetched safely',
    };
  }

  if (!gitCommitExists(repositoryRoot, currentSha)) {
    return { build: true, reason: 'current deployment commit is unavailable' };
  }

  const relevantPaths = [`web/apps/${surface}`, ...sharedBuildInputs];
  const diff = runGit(repositoryRoot, [
    'diff',
    '--quiet',
    `${previousSha}..${currentSha}`,
    '--',
    ...relevantPaths,
  ]);

  if (diff.status === 0) {
    return { build: false, reason: `no ${surface} build inputs changed` };
  }

  if (diff.status === 1) {
    return { build: true, reason: `${surface} build inputs changed` };
  }

  return { build: true, reason: 'Git diff could not be evaluated safely' };
}

function runFromCommandLine() {
  const result = evaluateVercelBuild({
    surface: process.argv[2],
    previousSha: process.env.VERCEL_GIT_PREVIOUS_SHA,
    currentSha: process.env.VERCEL_GIT_COMMIT_SHA || 'HEAD',
  });

  const action = result.build ? 'build' : 'skip';
  console.log(`[vercel-ignore] ${action}: ${result.reason}`);
  process.exitCode = result.build ? 1 : 0;
}

const invokedModule = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : undefined;

if (invokedModule === import.meta.url) {
  runFromCommandLine();
}
