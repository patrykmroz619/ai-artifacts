import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Workflow bookkeeping must not invalidate the source checks it describes.
export const EXCLUDED_PATHS = ['specs/tasks', 'specs/qa', 'specs/reviews', 'specs/research'];

export function verificationSnapshot({ cwd = process.cwd(), index = false } = {}) {
  function git(args, env = process.env, allowFailure = false) {
    const result = spawnSync('git', args, { cwd, env, encoding: 'utf8', windowsHide: true });
    if (result.error) throw result.error;
    if (result.status !== 0) {
      if (allowFailure) return null;
      throw new Error(`git ${args[0]} failed: ${result.stderr.trim()}`);
    }
    return result.stdout.trim();
  }

  cwd = git(['rev-parse', '--show-toplevel']);
  const head = git(['rev-parse', '--verify', 'HEAD'], process.env, true);
  const temporary = mkdtempSync(join(tmpdir(), 'workflow-snapshot-'));
  const indexPath = join(temporary, 'index');
  const env = { ...process.env, GIT_INDEX_FILE: indexPath };
  try {
    const originalIndex = git(['rev-parse', '--path-format=absolute', '--git-path', 'index']);
    try {
      copyFileSync(originalIndex, indexPath);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      git(!index && head ? ['read-tree', head] : ['read-tree', '--empty'], env);
    }
    if (!index) {
      git(['add', '--all', '--', '.', ...EXCLUDED_PATHS.map((path) => `:(top,exclude)${path}`)], env);
    }
    git(['rm', '-r', '--cached', '--ignore-unmatch', '-f', '--', ...EXCLUDED_PATHS], env);
    return {
      algorithm: 'git-tree-v1',
      fingerprint: git(['write-tree'], env),
      head,
      source: index ? 'index' : 'working-tree',
      excludedPaths: EXCLUDED_PATHS,
    };
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== '--index') || args.length > 1) {
    console.error('Usage: node verification-snapshot.mjs [--index]');
    process.exitCode = 1;
  } else {
    try {
      console.log(JSON.stringify(verificationSnapshot({ index: args.includes('--index') }), null, 2));
    } catch (error) {
      console.error(`Cannot snapshot verification inputs: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
