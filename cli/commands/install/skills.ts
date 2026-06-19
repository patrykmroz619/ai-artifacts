import { readdir, cp, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import type { Target } from '../../common/detect.js'

export async function installSkills(
  tempDir: string,
  target: Target,
  { dryRun = false }: { dryRun?: boolean } = {}
): Promise<string[]> {
  const skillsSource = join(tempDir, 'skills')
  if (!existsSync(skillsSource)) return []

  let entries
  try {
    entries = await readdir(skillsSource, { withFileTypes: true })
  } catch {
    return []
  }

  const installed: string[] = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const src = join(skillsSource, entry.name)
    const dest = join(target.skillsDir, entry.name)

    if (!dryRun) {
      await mkdir(target.skillsDir, { recursive: true })
      await cp(src, dest, { recursive: true, force: true })
    }

    installed.push(entry.name)
  }

  return installed
}
