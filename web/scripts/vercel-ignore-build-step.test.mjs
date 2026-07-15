import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

import { evaluateVercelBuild } from './vercel-ignore-build-step.mjs';

function runGit(repositoryRoot, args) {
  const result = spawnSync('git', args, {
    cwd: repositoryRoot,
    encoding: 'utf8',
    windowsHide: true,
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

function writeFixture(repositoryRoot, relativePath, contents) {
  const target = join(repositoryRoot, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents, 'utf8');
}

function commitFixture(repositoryRoot, message) {
  runGit(repositoryRoot, ['add', '.']);
  runGit(repositoryRoot, ['commit', '-m', message]);
  return runGit(repositoryRoot, ['rev-parse', 'HEAD']);
}

test('build selection is scoped by app and shared web inputs', (context) => {
  const repositoryRoot = mkdtempSync(join(tmpdir(), 'foodflow-vercel-ignore-'));
  context.after(() => rmSync(repositoryRoot, { recursive: true, force: true }));

  runGit(repositoryRoot, ['init']);
  runGit(repositoryRoot, ['config', 'user.email', 'test@foodflow.local']);
  runGit(repositoryRoot, ['config', 'user.name', 'FoodFlow Test']);

  writeFixture(repositoryRoot, 'README.md', 'initial docs\n');
  writeFixture(repositoryRoot, 'web/apps/admin/page.tsx', 'admin v1\n');
  writeFixture(repositoryRoot, 'web/apps/restaurant/page.tsx', 'restaurant v1\n');
  writeFixture(repositoryRoot, 'web/packages/ui/index.ts', 'shared v1\n');
  writeFixture(repositoryRoot, 'web/pnpm-lock.yaml', 'lockfileVersion: 9\n');
  const initialSha = commitFixture(repositoryRoot, 'initial');

  writeFixture(repositoryRoot, 'README.md', 'docs only\n');
  const docsSha = commitFixture(repositoryRoot, 'docs');

  for (const surface of ['admin', 'restaurant']) {
    const result = evaluateVercelBuild({
      surface,
      previousSha: initialSha,
      currentSha: docsSha,
      repositoryRoot,
    });
    assert.equal(result.build, false, `${surface}: ${result.reason}`);
  }

  writeFixture(repositoryRoot, 'web/apps/admin/page.tsx', 'admin v2\n');
  const adminSha = commitFixture(repositoryRoot, 'admin');

  assert.equal(
    evaluateVercelBuild({
      surface: 'admin',
      previousSha: docsSha,
      currentSha: adminSha,
      repositoryRoot,
    }).build,
    true,
  );
  assert.equal(
    evaluateVercelBuild({
      surface: 'restaurant',
      previousSha: docsSha,
      currentSha: adminSha,
      repositoryRoot,
    }).build,
    false,
  );

  writeFixture(repositoryRoot, 'web/packages/ui/index.ts', 'shared v2\n');
  const sharedSha = commitFixture(repositoryRoot, 'shared');

  for (const surface of ['admin', 'restaurant']) {
    assert.equal(
      evaluateVercelBuild({
        surface,
        previousSha: adminSha,
        currentSha: sharedSha,
        repositoryRoot,
      }).build,
      true,
    );
  }

  writeFixture(
    repositoryRoot,
    'web/scripts/vercel-ignore-build-step.mjs',
    'guard v2\n',
  );
  const guardSha = commitFixture(repositoryRoot, 'guard');

  for (const surface of ['admin', 'restaurant']) {
    assert.equal(
      evaluateVercelBuild({
        surface,
        previousSha: sharedSha,
        currentSha: guardSha,
        repositoryRoot,
      }).build,
      true,
    );
  }

  writeFixture(repositoryRoot, '.vercelignore', 'private-artifacts\n');
  const vercelIgnoreSha = commitFixture(repositoryRoot, 'vercel ignore');

  for (const surface of ['admin', 'restaurant']) {
    assert.equal(
      evaluateVercelBuild({
        surface,
        previousSha: guardSha,
        currentSha: vercelIgnoreSha,
        repositoryRoot,
      }).build,
      true,
    );
  }
});

test('uncertain Git state always falls back to a build', () => {
  const repositoryRoot = mkdtempSync(join(tmpdir(), 'foodflow-vercel-ignore-'));

  try {
    runGit(repositoryRoot, ['init']);
    runGit(repositoryRoot, ['config', 'user.email', 'test@foodflow.local']);
    runGit(repositoryRoot, ['config', 'user.name', 'FoodFlow Test']);
    writeFixture(repositoryRoot, 'README.md', 'initial\n');
    const currentSha = commitFixture(repositoryRoot, 'initial');

    const cases = [
      { surface: 'admin', previousSha: undefined, currentSha },
      { surface: 'admin', previousSha: 'not-a-sha', currentSha },
      { surface: 'admin', previousSha: '0'.repeat(40), currentSha },
      { surface: 'admin', previousSha: currentSha, currentSha: 'not-a-sha' },
      { surface: 'unknown', previousSha: currentSha, currentSha },
    ];

    for (const input of cases) {
      assert.equal(
        evaluateVercelBuild({ ...input, repositoryRoot }).build,
        true,
      );
    }
  } finally {
    rmSync(repositoryRoot, { recursive: true, force: true });
  }
});

test('a shallow checkout fetches the previous deployed commit before diffing', (context) => {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'foodflow-vercel-shallow-'));
  const sourceRoot = join(fixtureRoot, 'source');
  const cloneRoot = join(fixtureRoot, 'clone');
  context.after(() => rmSync(fixtureRoot, { recursive: true, force: true }));

  mkdirSync(sourceRoot, { recursive: true });
  runGit(sourceRoot, ['init']);
  runGit(sourceRoot, ['config', 'user.email', 'test@foodflow.local']);
  runGit(sourceRoot, ['config', 'user.name', 'FoodFlow Test']);
  writeFixture(sourceRoot, 'README.md', 'initial\n');
  writeFixture(sourceRoot, 'web/apps/admin/page.tsx', 'admin\n');
  const previousSha = commitFixture(sourceRoot, 'initial');
  writeFixture(sourceRoot, 'README.md', 'docs only\n');
  const currentSha = commitFixture(sourceRoot, 'docs');

  const clone = spawnSync(
    'git',
    ['clone', '--depth=1', pathToFileURL(sourceRoot).href, cloneRoot],
    { encoding: 'utf8', windowsHide: true },
  );
  assert.equal(clone.status, 0, clone.stderr || clone.stdout);
  assert.equal(
    spawnSync('git', ['cat-file', '-e', `${previousSha}^{commit}`], {
      cwd: cloneRoot,
      windowsHide: true,
    }).status,
    128,
  );

  const result = evaluateVercelBuild({
    surface: 'admin',
    previousSha,
    currentSha,
    repositoryRoot: cloneRoot,
  });

  assert.equal(result.build, false, result.reason);
});
