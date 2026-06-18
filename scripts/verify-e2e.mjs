#!/usr/bin/env node
/**
 * E2E smoke test: install coding-workflows into temp fixture dirs using local
 * registry files (no network required). Covers .claude-only, neither, and
 * idempotency cases.
 *
 * Run: node scripts/verify-e2e.mjs
 *
 * For a live end-to-end against the real GitHub registry (requires push),
 * run the CLI directly in a scratch project:
 *   cd /tmp/scratch && mkdir .claude && node /path/to/cli/index.mjs coding-workflows
 */
import { mkdtemp, rm, mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REGISTRY_ROOT = join(__dirname, '..')
const LOCAL_SCOPE_DIR = join(REGISTRY_ROOT, 'coding-workflows')

const { installSkills } = await import('../cli/install-skills.mjs')
const { installRules } = await import('../cli/install-rules.mjs')

let passed = 0
let failed = 0

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`)
    passed++
  } else {
    console.error(`  ✗ ${message}`)
    failed++
  }
}

async function fileExists(p) {
  try { await (await import('node:fs/promises')).access(p); return true } catch { return false }
}

// ── Case A: .claude-only ─────────────────────────────────────────────────────
console.log('\nCase A — .claude-only fixture:')
const dirA = await mkdtemp(join(tmpdir(), 'ai-artifacts-e2e-claude-'))
await mkdir(join(dirA, '.claude'))

const targetA = {
  tool: 'claude',
  skillsDir: join(dirA, '.claude', 'skills'),
  ruleFile: join(dirA, 'CLAUDE.md'),
}

const skillResultsA = await installSkills(LOCAL_SCOPE_DIR, targetA)
await installRules('coding-workflows', LOCAL_SCOPE_DIR, targetA)

assert(skillResultsA.length > 0, `skills installed (found: ${skillResultsA.join(', ')})`)
assert(await fileExists(join(targetA.skillsDir, 'commit-message', 'SKILL.md')), 'commit-message skill present')

const claudeMdA = await readFile(targetA.ruleFile, 'utf8')
assert(claudeMdA.includes('<!-- BEGIN registry:coding-workflows -->'), 'CLAUDE.md has BEGIN marker')
assert(claudeMdA.includes('<!-- END registry:coding-workflows -->'), 'CLAUDE.md has END marker')

// ── Idempotency: second run with hand-written content ────────────────────────
console.log('\nIdempotency — second run on Case A:')
await writeFile(targetA.ruleFile, `# My Project Rules\n\nHand-written content.\n\n${claudeMdA}`)

await installRules('coding-workflows', LOCAL_SCOPE_DIR, targetA)
const claudeMdA2 = await readFile(targetA.ruleFile, 'utf8')

const blockCount = (claudeMdA2.match(/<!-- BEGIN registry:coding-workflows -->/g) ?? []).length
assert(blockCount === 1, 'exactly one managed block (no duplicates after re-run)')
assert(claudeMdA2.startsWith('# My Project Rules'), 'hand-written content above block preserved')

// ── Case B: .cursor-only ─────────────────────────────────────────────────────
console.log('\nCase B — .cursor-only fixture:')
const dirB = await mkdtemp(join(tmpdir(), 'ai-artifacts-e2e-cursor-'))
await mkdir(join(dirB, '.cursor'))

const targetB = {
  tool: 'cursor',
  skillsDir: join(dirB, '.cursor', 'skills'),
  ruleFile: join(dirB, 'AGENTS.md'),
}

const skillResultsB = await installSkills(LOCAL_SCOPE_DIR, targetB)
await installRules('coding-workflows', LOCAL_SCOPE_DIR, targetB)

assert(skillResultsB.length > 0, `skills installed (found: ${skillResultsB.join(', ')})`)
assert(await fileExists(join(targetB.skillsDir, 'commit-message', 'SKILL.md')), 'commit-message skill present in .cursor/skills/')
const agentsMd = await readFile(targetB.ruleFile, 'utf8')
assert(agentsMd.includes('<!-- BEGIN registry:coding-workflows -->'), 'AGENTS.md has managed block')

// ── Cleanup ───────────────────────────────────────────────────────────────────
await rm(dirA, { recursive: true, force: true })
await rm(dirB, { recursive: true, force: true })

// ── Result ───────────────────────────────────────────────────────────────────
console.log(`\nResult: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
console.log('All E2E checks passed.')
