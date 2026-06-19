import { rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { detectTargets } from '../../common/detect.js'
import { fetchScope } from '../../common/fetch.js'
import { installSkills } from './skills.js'
import { installRules } from './rules.js'

export async function runInstall(opts: {
  scopes: string[]
  dryRun: boolean
}): Promise<{ failed: string[] }> {
  const { scopes, dryRun } = opts

  if (dryRun) {
    console.log('[dry-run] No files will be written.\n')
  }

  let targets
  try {
    targets = await detectTargets(process.cwd())
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`Error: ${msg}`)
    process.exit(1)
  }

  console.log(`Detected tools: ${targets.map(t => t.tool).join(', ')}\n`)

  const failed: string[] = []

  for (const scope of scopes) {
    console.log(`Installing scope: ${scope}`)
    const tempDir = join(tmpdir(), `ai-artifacts-${scope}-${Date.now()}`)
    try {
      await fetchScope(scope, tempDir)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`  ✗ Failed to fetch scope "${scope}": ${msg}`)
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

  return { failed }
}
