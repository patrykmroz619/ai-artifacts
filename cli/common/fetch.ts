import { downloadTemplate } from 'giget'
import { repoFromPackage } from './repo.js'

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
