import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import { downloadTemplate } from 'giget'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'))

function repoFromPackage() {
  const url = pkg?.repository?.url ?? ''
  const m = url.match(/github\.com[/:]([^/]+\/[^/.]+)/)
  if (!m) throw new Error('Cannot resolve GitHub owner/repo from package.json repository field')
  return m[1].replace(/\.git$/, '')
}

export async function fetchScope(scope, destDir) {
  const repo = repoFromPackage()
  const source = `gh:${repo}/${scope}#main`
  try {
    await downloadTemplate(source, { dir: destDir, force: true })
  } catch (err) {
    if (err.message?.includes('404') || err.message?.toLowerCase().includes('not found')) {
      throw new Error(`Scope "${scope}" not found in registry (${source})`)
    }
    throw err
  }
}
