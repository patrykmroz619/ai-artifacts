import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf8')) as {
  repository?: { url?: string }
}

export function repoFromPackage(): string {
  const url = pkg?.repository?.url ?? ''
  const m = url.match(/github\.com[/:]([^/]+\/[^/.]+)/)
  if (!m) throw new Error('Cannot resolve GitHub owner/repo from package.json repository field')
  return m[1].replace(/\.git$/, '')
}
