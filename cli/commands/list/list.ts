import { listScopes, listSkills, RegistryError } from '../../common/registry.js'

export type ListDeps = {
  listScopes?: () => Promise<string[]>
  listSkills?: (scope: string) => Promise<string[]>
}

export function formatNames(names: string[]): string {
  if (names.length === 0) return '(none found)'
  return names.join('\n')
}

function errorMessage(err: RegistryError, scope?: string): string {
  switch (err.kind) {
    case 'offline':
      return 'Error: Cannot reach GitHub. Check your network connection and try again.'
    case 'rate-limit':
      return 'Error: GitHub API rate limit reached. Retry later.'
    case 'not-found':
      return scope
        ? `Error: Scope "${scope}" not found in registry. Run 'list' to see valid scopes.`
        : 'Error: Registry not found.'
    case 'unexpected':
      return `Error: ${err.message}`
  }
}

export async function runList(
  { scope }: { scope?: string },
  deps: ListDeps = {}
): Promise<{ ok: boolean }> {
  const scopesFn = deps.listScopes ?? listScopes
  const skillsFn = deps.listSkills ?? listSkills

  try {
    const names = scope ? await skillsFn(scope) : await scopesFn()
    console.log(formatNames(names))
    return { ok: true }
  } catch (err) {
    const registryErr = err as RegistryError
    if (registryErr.kind) {
      console.error(errorMessage(registryErr, scope))
      return { ok: false }
    }
    throw err
  }
}
