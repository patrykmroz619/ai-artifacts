import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { AUTOPILOT_STAGES, validateSkills } from './validate-skills.mjs';

async function fixture(t, files) {
  const root = await mkdtemp(join(tmpdir(), 'workflow-validation-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const [path, contents] of Object.entries(files)) {
    const target = join(root, path);
    await mkdir(join(target, '..'), { recursive: true });
    await writeFile(target, contents);
  }
  return root;
}

const skill = (name, body = '') => `---\nname: ${name}\ndescription: Use when testing the workflow.\n---\n${body}\n`;

test('accepts valid frontmatter and bundled assets', async (t) => {
  const root = await fixture(t, {
    'example/SKILL.md': skill('example', 'Read `assets/template.md` and [notes](references/notes.md).'),
    'example/assets/template.md': '# Template',
    'example/references/notes.md': '# Notes',
  });
  assert.deepEqual(await validateSkills(root, { expectedNames: ['example'] }), { errors: [], names: ['example'] });
});

test('rejects malformed YAML and missing descriptions', async (t) => {
  const root = await fixture(t, {
    'broken/SKILL.md': '---\nname: [broken\n---\n',
    'empty/SKILL.md': '---\nname: empty\n---\n',
  });
  const { errors } = await validateSkills(root, { expectedNames: ['broken', 'empty'] });
  assert.ok(errors.some((error) => error.includes('invalid YAML')));
  assert.ok(errors.some((error) => error.includes('description must be')));
});

test('validates installed skill directories reached through symlinks or junctions', async (t) => {
  const root = await fixture(t, { 'source/example/SKILL.md': skill('example') });
  const collection = join(root, 'skills');
  await mkdir(collection);
  await symlink(join(root, 'source/example'), join(collection, 'example'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.deepEqual(await validateSkills(collection, { expectedNames: ['example'] }), { errors: [], names: ['example'] });
});

test('rejects missing frontmatter and SKILL.md', async (t) => {
  const root = await fixture(t, {
    'plain/SKILL.md': '# Instructions',
    'absent/assets/template.md': '# Template',
  });
  const { errors } = await validateSkills(root, { expectedNames: ['plain', 'absent'] });
  assert.ok(errors.some((error) => error.includes('missing YAML frontmatter')));
  assert.ok(errors.some((error) => error.includes('cannot read skill')));
});

test('rejects duplicate names and directory mismatches', async (t) => {
  const root = await fixture(t, {
    'example/SKILL.md': skill('example'),
    'other/SKILL.md': skill('example'),
  });
  const { errors } = await validateSkills(root, { expectedNames: ['example', 'other'] });
  assert.ok(errors.some((error) => error.includes('duplicate skill name')));
  assert.ok(errors.some((error) => error.includes('name must match directory')));
});

test('rejects missing assets and linked reference files', async (t) => {
  const root = await fixture(t, {
    'example/SKILL.md': skill('example', 'Read `assets/missing.md` and [notes](references/missing.md).'),
  });
  const { errors } = await validateSkills(root, { expectedNames: ['example'] });
  assert.equal(errors.filter((error) => error.includes('missing referenced file')).length, 2);
});

test('requires autonomous companions even without explicit links', async (t) => {
  const root = await fixture(t, { 'auto-implement/SKILL.md': skill('auto-implement') });
  const { errors } = await validateSkills(root, { expectedNames: ['auto-implement'] });
  assert.ok(errors.some((error) => error.includes('../implement/SKILL.md')));
  assert.ok(errors.some((error) => error.includes('../autopilot/assets/autonomy-contract.md')));
});

test('requires the autonomous shortcut core even without an explicit link', async (t) => {
  const root = await fixture(t, { 'auto-small-task/SKILL.md': skill('auto-small-task') });
  const { errors } = await validateSkills(root, { expectedNames: ['auto-small-task'] });
  assert.equal(errors.length, 1);
  assert.ok(errors[0].includes('../small-task/SKILL.md'));
});

test('accepts shortcut companions without the autopilot contract', async (t) => {
  const root = await fixture(t, {
    'auto-small-task/SKILL.md': skill('auto-small-task'),
    'small-task/SKILL.md': skill('small-task'),
  });
  const { errors } = await validateSkills(root, { expectedNames: ['auto-small-task', 'small-task'] });
  assert.deepEqual(errors, []);
});

test('autopilot requires exactly its eight stages and their core companions', async (t) => {
  const root = await fixture(t, {
    'autopilot/SKILL.md': skill('autopilot'),
    'autopilot/assets/autonomy-contract.md': '# Contract',
  });
  const { errors } = await validateSkills(root, { expectedNames: ['autopilot'] });
  assert.equal(AUTOPILOT_STAGES.length, 8);
  assert.equal(errors.length, 16);
  for (const stage of AUTOPILOT_STAGES) {
    assert.ok(errors.some((error) => error.includes(`../${stage}/SKILL.md`)));
    assert.ok(errors.some((error) => error.includes(`../${stage.slice(5)}/SKILL.md`)));
  }
  assert.ok(errors.every((error) => !error.includes('small-task')));
});

test('accepts a complete autopilot pipeline without either shortcut', async (t) => {
  const files = {
    'autopilot/SKILL.md': skill('autopilot'),
    'autopilot/assets/autonomy-contract.md': '# Contract',
  };
  const expectedNames = ['autopilot'];
  for (const stage of AUTOPILOT_STAGES) {
    const core = stage.slice(5);
    files[`${stage}/SKILL.md`] = skill(stage);
    files[`${core}/SKILL.md`] = skill(core);
    expectedNames.push(stage, core);
  }
  const root = await fixture(t, files);
  assert.deepEqual((await validateSkills(root, { expectedNames })).errors, []);
});

test('rejects references outside the collection', async (t) => {
  const root = await fixture(t, { 'example/SKILL.md': skill('example', 'Read `../../outside.md`.') });
  const { errors } = await validateSkills(root, { expectedNames: ['example'] });
  assert.ok(errors.some((error) => error.includes('reference escapes collection')));
});

test('detects missing and unexpected skills', async (t) => {
  const root = await fixture(t, { 'other/SKILL.md': skill('other') });
  const { errors } = await validateSkills(root, { expectedNames: ['example'] });
  assert.ok(errors.some((error) => error.includes('Missing skill directory: example')));
  assert.ok(errors.some((error) => error.includes('Unexpected skill directory: other')));
});

test('validates the actual 26-skill collection', async () => {
  const root = new URL('../skills/', import.meta.url);
  const { errors, names } = await validateSkills(fileURLToPath(root));
  assert.deepEqual(errors, []);
  assert.equal(names.length, 26);
});
