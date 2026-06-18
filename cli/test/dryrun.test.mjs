import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rm } from 'node:fs/promises'
import { installSkills } from '../install-skills.mjs'
import { installRules } from '../install-rules.mjs'

describe('dry-run writes nothing', () => {
  let scopeDir
  let projectDir

  before(async () => {
    // Build a fake fetched scope dir
    scopeDir = await mkdtemp(join(tmpdir(), 'ai-artifacts-test-scope-'))
    await mkdir(join(scopeDir, 'skills', 'test-skill'), { recursive: true })
    await writeFile(join(scopeDir, 'skills', 'test-skill', 'SKILL.md'), '---\nname: test-skill\ndescription: A test skill\n---\n# Test\n')
    await writeFile(join(scopeDir, 'RULES.md'), '# Test rules\n')

    // Build a fake project dir with .claude/
    projectDir = await mkdtemp(join(tmpdir(), 'ai-artifacts-test-project-'))
    await mkdir(join(projectDir, '.claude'))
  })

  after(async () => {
    await rm(scopeDir, { recursive: true, force: true })
    await rm(projectDir, { recursive: true, force: true })
  })

  it('installSkills with dryRun=true creates no files', async () => {
    const target = {
      tool: 'claude',
      skillsDir: join(projectDir, '.claude', 'skills'),
      ruleFile: join(projectDir, 'CLAUDE.md'),
    }

    const results = await installSkills(scopeDir, target, { dryRun: true })

    // Should report what it would do
    assert.deepEqual(results, ['test-skill'])
    // But the skills dir must NOT have been created
    assert.ok(!existsSync(target.skillsDir), 'skills dir should not be created on dry-run')
  })

  it('installRules with dryRun=true creates no files', async () => {
    const target = {
      tool: 'claude',
      skillsDir: join(projectDir, '.claude', 'skills'),
      ruleFile: join(projectDir, 'CLAUDE.md'),
    }

    const result = await installRules('test-scope', scopeDir, target, { dryRun: true })

    // Should return the path it would have written
    assert.ok(result)
    // But the rule file must NOT exist
    assert.ok(!existsSync(target.ruleFile), 'rule file should not be created on dry-run')
  })
})
