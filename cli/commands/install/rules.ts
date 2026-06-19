import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import type { Target } from '../../common/detect.js'

const BEGIN = (scope: string) => `<!-- BEGIN registry:${scope} -->`
const END = (scope: string) => `<!-- END registry:${scope} -->`

export function injectBlock(existing: string, scope: string, content: string): string {
  const begin = BEGIN(scope)
  const end = END(scope)
  const block = `${begin}\n${content.trim()}\n${end}`

  const beginIdx = existing.indexOf(begin)
  const endIdx = existing.indexOf(end)

  if (beginIdx !== -1 && endIdx !== -1 && endIdx > beginIdx) {
    return existing.slice(0, beginIdx) + block + existing.slice(endIdx + end.length)
  }

  if (existing.length === 0) return block + '\n'
  const sep = existing.endsWith('\n') ? '\n' : '\n\n'
  return existing + sep + block + '\n'
}

export async function installRules(
  scope: string,
  tempDir: string,
  target: Target,
  { dryRun = false }: { dryRun?: boolean } = {}
): Promise<string | null> {
  const rulesSource = join(tempDir, 'RULES.md')
  if (!existsSync(rulesSource)) return null

  const content = await readFile(rulesSource, 'utf8')

  let existing = ''
  if (existsSync(target.ruleFile)) {
    existing = await readFile(target.ruleFile, 'utf8')
  }

  const updated = injectBlock(existing, scope, content)

  if (!dryRun) {
    await writeFile(target.ruleFile, updated, 'utf8')
  }

  return target.ruleFile
}
