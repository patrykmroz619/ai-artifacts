import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { parseDirNames, classifyFailure, listScopes, listSkills } from '../registry.js'

describe('parseDirNames', () => {
  it('returns names of dir-type entries, sorted ascending', () => {
    const items = [
      { name: 'zebra', type: 'dir' },
      { name: 'apple', type: 'dir' },
      { name: 'README.md', type: 'file' },
    ]
    assert.deepEqual(parseDirNames(items), ['apple', 'zebra'])
  })

  it('returns empty array when no dirs present', () => {
    assert.deepEqual(parseDirNames([{ name: 'file.txt', type: 'file' }]), [])
  })

  it('throws a tagged error for non-array input', () => {
    assert.throws(
      () => parseDirNames({ name: 'bad' }),
      (err: unknown) => err instanceof Error && err.message.includes('Unexpected response')
    )
  })
})

describe('classifyFailure', () => {
  it('maps 403 to rate-limit', () => {
    const err = classifyFailure(403)
    assert.equal(err.kind, 'rate-limit')
  })

  it('maps 404 to not-found', () => {
    const err = classifyFailure(404)
    assert.equal(err.kind, 'not-found')
  })

  it('maps a thrown Error (no status) to offline', () => {
    const err = classifyFailure(undefined, new Error('ENOTFOUND'))
    assert.equal(err.kind, 'offline')
  })

  it('maps other status codes to unexpected', () => {
    const err = classifyFailure(500)
    assert.equal(err.kind, 'unexpected')
  })
})

function makeStubFetch(status: number, body: unknown): typeof fetch {
  return () =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    } as Response)
}

function makeThrowingFetch(cause: Error): typeof fetch {
  return () => Promise.reject(cause)
}

const fixtureBody = [
  { name: 'coding-workflows', type: 'dir' },
  { name: 'other-scope', type: 'dir' },
]

describe('listScopes', () => {
  it('returns scope names on 200', async () => {
    const scopes = await listScopes({ fetchImpl: makeStubFetch(200, fixtureBody), repo: 'owner/repo' })
    assert.deepEqual(scopes, ['coding-workflows', 'other-scope'])
  })

  it('throws rate-limit RegistryError on 403', async () => {
    await assert.rejects(
      () => listScopes({ fetchImpl: makeStubFetch(403, {}), repo: 'owner/repo' }),
      (err: unknown) => (err as { kind: string }).kind === 'rate-limit'
    )
  })

  it('throws offline RegistryError on network failure', async () => {
    await assert.rejects(
      () =>
        listScopes({
          fetchImpl: makeThrowingFetch(new Error('ENOTFOUND')),
          repo: 'owner/repo',
        }),
      (err: unknown) => (err as { kind: string }).kind === 'offline'
    )
  })
})

describe('listSkills', () => {
  const skillsBody = [
    { name: 'commit-message', type: 'dir' },
    { name: 'some-other', type: 'dir' },
  ]

  it('returns skill ids on 200', async () => {
    const skills = await listSkills('coding-workflows', {
      fetchImpl: makeStubFetch(200, skillsBody),
      repo: 'owner/repo',
    })
    assert.deepEqual(skills, ['commit-message', 'some-other'])
  })

  it('throws not-found RegistryError with scope name on 404', async () => {
    await assert.rejects(
      () =>
        listSkills('bogus-scope', {
          fetchImpl: makeStubFetch(404, {}),
          repo: 'owner/repo',
        }),
      (err: unknown) => {
        const e = err as { kind: string; message: string }
        return e.kind === 'not-found' && e.message.includes('bogus-scope')
      }
    )
  })

  it('throws rate-limit RegistryError on 403', async () => {
    await assert.rejects(
      () =>
        listSkills('coding-workflows', {
          fetchImpl: makeStubFetch(403, {}),
          repo: 'owner/repo',
        }),
      (err: unknown) => (err as { kind: string }).kind === 'rate-limit'
    )
  })
})
