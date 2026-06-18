#!/usr/bin/env node

import { detectTargets } from './detect.mjs'
import { fetchScope } from './fetch.mjs'
import { installSkills } from './install-skills.mjs'
import { installRules } from './install-rules.mjs'
import { rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const USAGE = `
Usage: ai-artifacts <scope...> [--dry-run]

Arguments:
  scope     One or more domain folder names from the registry (e.g. coding-workflows)

Options:
  --dry-run  Print intended writes without making changes

Examples:
  ai-artifacts coding-workflows
  ai-artifacts coding-workflows learning --dry-run
`.trim()

function parseArgs(argv) {
  const args = argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const scopes = args.filter(a => !a.startsWith('--'))
  return { scopes, dryRun }
}

async function main() {
  const { scopes, dryRun } = parseArgs(process.argv)

  if (scopes.length === 0) {
    console.error(USAGE)
    process.exit(1)
  }

  if (dryRun) {
    console.log('[dry-run] No files will be written.\n')
  }

  let targets
  try {
    targets = await detectTargets(process.cwd())
  } catch (err) {
    console.error(`Error: ${err.message}`)
    process.exit(1)
  }

  console.log(`Detected tools: ${targets.map(t => t.tool).join(', ')}\n`)

  const failed = []

  for (const scope of scopes) {
    console.log(`Installing scope: ${scope}`)
    const tempDir = join(tmpdir(), `ai-artifacts-${scope}-${Date.now()}`)
    try {
      await fetchScope(scope, tempDir)
    } catch (err) {
      console.error(`  ✗ Failed to fetch scope "${scope}": ${err.message}`)
      failed.push(scope)
      continue
    }

    for (const target of targets) {
      const skillResults = await installSkills(tempDir, target, { dryRun })
      const ruleResult = await installRules(scope, tempDir, target, { dryRun })

      for (const skill of skillResults) {
        console.log(`  ${dryRun ? '[dry-run] would copy' : '✓'} skill "${skill}" → ${target.skillsDir}`)
      }

      if (ruleResult) {
        console.log(`  ${dryRun ? '[dry-run] would inject' : '✓'} rules → ${target.ruleFile} (registry:${scope} block)`)
      }

      if (skillResults.length === 0 && !ruleResult) {
        console.log(`  (no skills or rules found for ${target.tool})`)
      }
    }

    await rm(tempDir, { recursive: true, force: true })
    console.log()
  }

  if (failed.length > 0) {
    console.error(`Failed scopes: ${failed.join(', ')}`)
    process.exit(1)
  }
}

main().catch(err => {
  console.error(`Fatal: ${err.message}`)
  process.exit(1)
})
