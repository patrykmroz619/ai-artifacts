import { access, constants } from 'node:fs/promises'
import { join } from 'node:path'

export interface Target {
  tool: 'claude' | 'cursor'
  skillsDir: string
  ruleFile: string
}

async function exists(p: string): Promise<boolean> {
  try {
    await access(p, constants.F_OK)
    return true
  } catch {
    return false
  }
}

export async function detectTargets(cwd: string): Promise<Target[]> {
  const targets: Target[] = []

  if (await exists(join(cwd, '.claude'))) {
    targets.push({
      tool: 'claude',
      skillsDir: join(cwd, '.claude', 'skills'),
      ruleFile: join(cwd, 'CLAUDE.md'),
    })
  }

  if (await exists(join(cwd, '.cursor'))) {
    targets.push({
      tool: 'cursor',
      skillsDir: join(cwd, '.cursor', 'skills'),
      ruleFile: join(cwd, 'AGENTS.md'),
    })
  }

  if (targets.length === 0) {
    throw new Error(
      'No tool folder found in the current directory.\n' +
      'Create a .claude/ or .cursor/ folder first, or run inside a project that already has one.'
    )
  }

  return targets
}
