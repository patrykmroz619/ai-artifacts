import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import { downloadTemplate } from 'giget'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf8')) as {
  repository?: { url?: string }
}

function repoFromPackage(): string {
  const url = pkg?.repository?.url ?? ''
  const m = url.match(/github\.com[/:]([^/]+\/[^/.]+)/)
  if (!m) throw new Error('Cannot resolve GitHub owner/repo from package.json repository field')
  return m[1].replace(/\.git$/, '')
}

export async function fetchScope(scope: string, destDir: string): Promise<void> {
  const repo = repoFromPackage()
  const source = `gh:${repo}/artifacts/${scope}#main`
  try {
    await downloadTemplate(source, { dir: destDir, force: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('404') || msg.toLowerCase().includes('not found')) {
      throw new Error(`Scope "${scope}" not found in registry (${source})`)
    }
    throw err
  }
}
