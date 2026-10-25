import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { verificationSnapshot } from '../skills/implement/scripts/verification-snapshot.mjs';

function git(cwd, ...args) {
  const result = spawnSync('git', args, {
    cwd, encoding: 'utf8', windowsHide: true,
    env: { ...process.env, GIT_INDEX_FILE: undefined, GIT_DIR: undefined, GIT_WORK_TREE: undefined },
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function put(root, path, contents) {
  const target = join(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
}

function fixture(t, { commit = true } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'workflow-integrity-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  git(root, 'init', '-q');
  git(root, 'config', 'user.name', 'Workflow test');
  git(root, 'config', 'user.email', 'workflow@example.invalid');
  git(root, 'config', 'core.autocrlf', 'false');
  git(root, 'config', 'commit.gpgsign', 'false');
  put(root, 'app.txt', 'original\n');
  put(root, '.gitignore', 'secret.env\n');
  put(root, 'specs/tasks/example/task-plan.md', '**Phase:** planned\n');
  if (commit) {
    git(root, 'add', '.');
    git(root, 'commit', '-qm', 'baseline');
  }
  return root;
}

test('source snapshots change for edits, untracked files, deletions, and runtime configuration', (t) => {
  const cwd = fixture(t);
  const initial = verificationSnapshot({ cwd }).fingerprint;
  put(cwd, 'app.txt', 'changed\n');
  assert.notEqual(verificationSnapshot({ cwd }).fingerprint, initial);
  put(cwd, 'app.txt', 'original\n');
  assert.equal(verificationSnapshot({ cwd }).fingerprint, initial);
  put(cwd, 'new.txt', 'untracked\n');
  assert.notEqual(verificationSnapshot({ cwd }).fingerprint, initial);
  rmSync(join(cwd, 'new.txt'));
  rmSync(join(cwd, 'app.txt'));
  assert.notEqual(verificationSnapshot({ cwd }).fingerprint, initial);
  put(cwd, 'app.txt', 'original\n');
  put(cwd, 'specs/runtime.json', '{"enabled":true}\n');
  assert.notEqual(verificationSnapshot({ cwd }).fingerprint, initial);
});

test('phase, review and QA evidence updates do not invalidate source evidence', (t) => {
  const cwd = fixture(t);
  const initial = verificationSnapshot({ cwd }).fingerprint;
  put(cwd, 'specs/tasks/example/task-plan.md', '**Phase:** committed\n');
  put(cwd, 'specs/tasks/example/review.md', 'F1 fixed; QA retests: 2\n');
  put(cwd, 'specs/qa/example/evidence/run.txt', 'PASS\n');
  put(cwd, 'secret.env', 'must not enter snapshot\n');
  assert.equal(verificationSnapshot({ cwd }).fingerprint, initial);
});

test('archiving a task does not invalidate source evidence', (t) => {
  const cwd = fixture(t);
  const initial = verificationSnapshot({ cwd }).fingerprint;
  mkdirSync(join(cwd, 'specs/archived-tasks'), { recursive: true });
  const source = join(cwd, 'specs/tasks/example');
  const destination = join(cwd, 'specs/archived-tasks/example');
  renameSync(source, destination);
  assert.equal(verificationSnapshot({ cwd }).fingerprint, initial);
  git(cwd, 'add', '-A');
  assert.equal(verificationSnapshot({ cwd, index: true }).fingerprint, initial);
});

test('tracked ignored files remain verification inputs', (t) => {
  const cwd = fixture(t);
  put(cwd, 'secret.env', 'tracked config\n');
  git(cwd, 'add', '-f', 'secret.env');
  git(cwd, 'commit', '-qm', 'tracked input');
  const initial = verificationSnapshot({ cwd }).fingerprint;
  put(cwd, 'secret.env', 'changed tracked config\n');
  assert.notEqual(verificationSnapshot({ cwd }).fingerprint, initial);
});

test('force-added ignored inputs are included before their first commit', (t) => {
  const cwd = fixture(t);
  put(cwd, 'secret.env', 'new tracked input\n');
  git(cwd, 'add', '-f', 'secret.env');
  const candidate = verificationSnapshot({ cwd, index: true }).fingerprint;
  assert.equal(verificationSnapshot({ cwd }).fingerprint, candidate);
  put(cwd, 'secret.env', 'edited since staging\n');
  assert.notEqual(verificationSnapshot({ cwd }).fingerprint, candidate);
});

test('mixed staged and unstaged content yields different candidates and preserves index and files', (t) => {
  const cwd = fixture(t);
  put(cwd, 'app.txt', 'staged unrelated\n');
  git(cwd, 'add', 'app.txt');
  put(cwd, 'app.txt', 'staged unrelated\ntask unstaged\n');
  put(cwd, 'new.txt', 'untracked task\n');
  const originalIndex = readFileSync(join(cwd, '.git/index'));
  const originalStatus = git(cwd, 'status', '--porcelain=v1');
  const originalHead = git(cwd, 'rev-parse', 'HEAD');
  const candidate = verificationSnapshot({ cwd, index: true });
  const working = verificationSnapshot({ cwd });
  assert.notEqual(candidate.fingerprint, working.fingerprint);
  assert.deepEqual(readFileSync(join(cwd, '.git/index')), originalIndex);
  assert.equal(git(cwd, 'status', '--porcelain=v1'), originalStatus);
  assert.equal(git(cwd, 'rev-parse', 'HEAD'), originalHead);
  assert.equal(readFileSync(join(cwd, 'app.txt'), 'utf8'), 'staged unrelated\ntask unstaged\n');
  git(cwd, 'add', 'app.txt', 'new.txt');
  assert.equal(verificationSnapshot({ cwd, index: true }).fingerprint, working.fingerprint);
});

test('committed-ledger amend retains the tested source fingerprint', (t) => {
  const cwd = fixture(t);
  put(cwd, 'app.txt', 'task result\n');
  put(cwd, 'specs/tasks/example/task-plan.md', '**Phase:** reviewed\nState: prepared\n');
  const tested = verificationSnapshot({ cwd }).fingerprint;
  git(cwd, 'add', '.');
  assert.equal(verificationSnapshot({ cwd, index: true }).fingerprint, tested);
  git(cwd, 'commit', '-qm', 'task');
  put(cwd, 'specs/tasks/example/task-plan.md', '**Phase:** committed\nState: committed\n');
  git(cwd, 'add', 'specs/tasks/example/task-plan.md');
  git(cwd, 'commit', '--amend', '--no-edit', '-q');
  assert.equal(verificationSnapshot({ cwd }).fingerprint, tested);
  assert.equal(verificationSnapshot({ cwd, index: true }).fingerprint, tested);
  assert.match(git(cwd, 'show', 'HEAD:specs/tasks/example/task-plan.md'), /Phase:\*\* committed/);
  assert.equal(git(cwd, 'rev-list', '--count', 'HEAD'), '2');
});

test('supports an unborn repository and an empty candidate index', (t) => {
  const cwd = fixture(t, { commit: false });
  const working = verificationSnapshot({ cwd });
  const candidate = verificationSnapshot({ cwd, index: true });
  assert.equal(working.head, null);
  assert.notEqual(working.fingerprint, candidate.fingerprint);
  git(cwd, 'add', '.');
  assert.equal(verificationSnapshot({ cwd, index: true }).fingerprint, working.fingerprint);
});

test('supports linked worktrees without using the main worktree index', (t) => {
  const cwd = fixture(t);
  const linked = join(cwd, 'linked');
  git(cwd, 'worktree', 'add', '-qb', 'verification', linked);
  const mainIndex = readFileSync(join(cwd, '.git/index'));
  const initial = verificationSnapshot({ cwd: linked, index: true });
  put(linked, 'app.txt', 'linked change\n');
  assert.notEqual(verificationSnapshot({ cwd: linked }).fingerprint, initial.fingerprint);
  assert.equal(verificationSnapshot({ cwd: linked, index: true }).fingerprint, initial.fingerprint);
  assert.deepEqual(readFileSync(join(cwd, '.git/index')), mainIndex);
});
