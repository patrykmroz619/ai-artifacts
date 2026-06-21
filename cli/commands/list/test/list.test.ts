import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { formatNames, runList } from '../list.js'

describe('formatNames', () => {
  it('joins names one per line', () => {
    assert.equal(formatNames(['apple', 'banana']), 'apple\nbanana')
  })

  it('returns sentinel for empty list', () => {
    assert.equal(formatNames([]), '(none found)')
  })

  it('returns single name with no trailing newline', () => {
    assert.equal(formatNames(['only']), 'only')
  })
})

function captureOutput(fn: () => Promise<unknown>): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    let stdout = ''
    let stderr = ''
    const origLog = console.log
    const origErr = console.error
    console.log = (...args: unknown[]) => { stdout += args.join(' ') + '\n' }
    console.error = (...args: unknown[]) => { stderr += args.join(' ') + '\n' }
    fn().then(() => {
      console.log = origLog
      console.error = origErr
      resolve({ stdout, stderr })
    }).catch(err => {
      console.log = origLog
      console.error = origErr
      reject(err)
    })
  })
}

describe('runList — scopes', () => {
  it('prints scope names on success', async () => {
    const { stdout } = await captureOutput(() =>
      runList({}, {
        listScopes: async () => ['coding-workflows', 'other'],
      })
    )
    assert.ok(stdout.includes('coding-workflows'))
    assert.ok(stdout.includes('other'))
  })

  it('prints "(none found)" when no scopes returned', async () => {
    const { stdout } = await captureOutput(() =>
      runList({}, { listScopes: async () => [] })
    )
    assert.ok(stdout.includes('(none found)'))
  })

  it('returns ok:false and prints offline message on offline error', async () => {
    const { stderr, stdout } = await captureOutput(async () => {
      const result = await runList({}, {
        listScopes: async () => { throw { kind: 'offline', message: 'ENOTFOUND' } },
      })
      assert.equal(result.ok, false)
    })
    assert.ok(stderr.includes('network') || stderr.includes('connection'), `expected connection error, got: ${stderr}`)
    assert.equal(stdout.trim(), '')
  })

  it('returns ok:false and prints rate-limit message on rate-limit error', async () => {
    const { stderr } = await captureOutput(async () => {
      const result = await runList({}, {
        listScopes: async () => { throw { kind: 'rate-limit', message: 'rate limit' } },
      })
      assert.equal(result.ok, false)
    })
    assert.ok(stderr.toLowerCase().includes('rate limit'), `expected rate limit, got: ${stderr}`)
  })
})

describe('runList — skills', () => {
  it('prints skill ids for a scope on success', async () => {
    const { stdout } = await captureOutput(() =>
      runList({ scope: 'coding-workflows' }, {
        listSkills: async (s) => {
          assert.equal(s, 'coding-workflows')
          return ['commit-message', 'pr-description']
        },
      })
    )
    assert.ok(stdout.includes('commit-message'))
    assert.ok(stdout.includes('pr-description'))
  })

  it('returns ok:false and names the bad scope on not-found error', async () => {
    const { stderr } = await captureOutput(async () => {
      const result = await runList({ scope: 'bogus' }, {
        listSkills: async () => { throw { kind: 'not-found', message: 'not found' } },
      })
      assert.equal(result.ok, false)
    })
    assert.ok(stderr.includes('bogus'), `expected scope name in error, got: ${stderr}`)
    assert.ok(stderr.toLowerCase().includes('not found') || stderr.toLowerCase().includes('scope'), `expected not-found message, got: ${stderr}`)
  })

  it('returns ok:false and prints unexpected message on unexpected error', async () => {
    const { stderr } = await captureOutput(async () => {
      const result = await runList({ scope: 'coding-workflows' }, {
        listSkills: async () => { throw { kind: 'unexpected', message: 'HTTP 500: server error' } },
      })
      assert.equal(result.ok, false)
    })
    assert.ok(stderr.includes('HTTP 500') || stderr.includes('server error'), `expected error details, got: ${stderr}`)
  })
})
