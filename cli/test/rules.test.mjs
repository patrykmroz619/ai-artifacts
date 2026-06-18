import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { injectBlock } from '../install-rules.mjs'

describe('injectBlock', () => {
  it('appends a new block to an empty file', () => {
    const result = injectBlock('', 'coding-workflows', 'Rule A\nRule B')
    assert.ok(result.includes('<!-- BEGIN registry:coding-workflows -->'))
    assert.ok(result.includes('Rule A\nRule B'))
    assert.ok(result.includes('<!-- END registry:coding-workflows -->'))
  })

  it('appends a new block after existing content', () => {
    const existing = '# My Rules\n\nSome hand-written rule.\n'
    const result = injectBlock(existing, 'coding-workflows', 'Registry rule')
    assert.ok(result.startsWith('# My Rules'))
    assert.ok(result.includes('Some hand-written rule.'))
    assert.ok(result.includes('<!-- BEGIN registry:coding-workflows -->'))
    assert.ok(result.includes('Registry rule'))
  })

  it('replaces an existing block without duplicating it', () => {
    const existing = [
      '# My Rules',
      '',
      '<!-- BEGIN registry:coding-workflows -->',
      'Old rule',
      '<!-- END registry:coding-workflows -->',
      '',
      'Hand-written content.',
      '',
    ].join('\n')

    const result = injectBlock(existing, 'coding-workflows', 'New rule')
    assert.ok(result.includes('New rule'))
    assert.ok(!result.includes('Old rule'))
    const matches = result.match(/<!-- BEGIN registry:coding-workflows -->/g) ?? []
    assert.equal(matches.length, 1)
  })

  it('preserves content before and after an existing block', () => {
    const before = '# My Rules\n\nContent before.\n\n'
    const after = '\n\nContent after.\n'
    const existing =
      before +
      '<!-- BEGIN registry:coding-workflows -->\nOld\n<!-- END registry:coding-workflows -->' +
      after

    const result = injectBlock(existing, 'coding-workflows', 'New')
    assert.ok(result.includes('Content before.'))
    assert.ok(result.includes('Content after.'))
    assert.ok(result.includes('New'))
    assert.ok(!result.includes('Old'))
  })

  it('handles multiple scopes independently', () => {
    const existing = '<!-- BEGIN registry:scope-a -->\nA\n<!-- END registry:scope-a -->\n'
    const result = injectBlock(existing, 'scope-b', 'B')
    assert.ok(result.includes('<!-- BEGIN registry:scope-a -->'))
    assert.ok(result.includes('<!-- BEGIN registry:scope-b -->'))
    assert.ok(result.includes('A'))
    assert.ok(result.includes('B'))
  })
})
