import { repoFromPackage } from './repo.js'

export interface RegistryError {
  kind: 'offline' | 'rate-limit' | 'not-found' | 'unexpected'
  message: string
}

export interface RegistryDeps {
  fetchImpl?: typeof fetch
  repo?: string
}

type GithubItem = { name: string; type: string }

export function parseDirNames(items: unknown): string[] {
  if (!Array.isArray(items)) {
    throw Object.assign(new Error('Unexpected response from GitHub contents API'), {
      kind: 'unexpected' as const,
    })
  }
  return (items as GithubItem[])
    .filter(item => item.type === 'dir')
    .map(item => item.name)
    .sort()
}

export function classifyFailure(status?: number, cause?: unknown): RegistryError {
  if (cause instanceof Error && status === undefined) {
    return { kind: 'offline', message: cause.message }
  }
  if (status === 403) {
    return {
      kind: 'rate-limit',
      message: 'GitHub API rate limit reached. Retry later or authenticate.',
    }
  }
  if (status === 404) {
    return { kind: 'not-found', message: 'Resource not found in registry.' }
  }
  return {
    kind: 'unexpected',
    message: `Unexpected error (HTTP ${status ?? 'unknown'}): ${cause instanceof Error ? cause.message : String(cause)}`,
  }
}

async function contentsRequest(
  url: string,
  deps: RegistryDeps
): Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }> {
  const fetchImpl = deps.fetchImpl ?? fetch
  return fetchImpl(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'patryk.mroz/artifacts-cli',
    },
  })
}

export async function listScopes(deps: RegistryDeps = {}): Promise<string[]> {
  const repo = deps.repo ?? repoFromPackage()
  const url = `https://api.github.com/repos/${repo}/contents/artifacts?ref=main`
  let res: Awaited<ReturnType<typeof contentsRequest>>
  try {
    res = await contentsRequest(url, deps)
  } catch (cause) {
    throw classifyFailure(undefined, cause instanceof Error ? cause : new Error(String(cause)))
  }
  if (!res.ok) {
    throw classifyFailure(res.status)
  }
  return parseDirNames(await res.json())
}

export async function listSkills(scope: string, deps: RegistryDeps = {}): Promise<string[]> {
  const repo = deps.repo ?? repoFromPackage()
  const url = `https://api.github.com/repos/${repo}/contents/artifacts/${scope}/skills?ref=main`
  let res: Awaited<ReturnType<typeof contentsRequest>>
  try {
    res = await contentsRequest(url, deps)
  } catch (cause) {
    throw classifyFailure(undefined, cause instanceof Error ? cause : new Error(String(cause)))
  }
  if (!res.ok) {
    const err = classifyFailure(res.status)
    if (res.status === 404) {
      err.message = `Scope "${scope}" not found in registry. Run 'list' to see valid scopes.`
    }
    throw err
  }
  return parseDirNames(await res.json())
}
