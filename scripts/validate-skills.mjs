import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDocument } from 'yaml';

export const WORKFLOW_SKILLS = [
  'add-task-to-backlog', 'auto-finalize', 'auto-implement',
  'auto-plan-implementation', 'auto-plan-task', 'auto-review-implementation',
  'auto-small-task', 'auto-start-task', 'auto-triage-findings', 'autopilot', 'finalize', 'implement',
  'init-workflow', 'plan-implementation', 'plan-task', 'qa-scenarios',
  'research-solution', 'review-implementation', 'review-pr', 'small-task', 'start-task',
  'triage-findings', 'workflow-status',
];

// Shortcut skills are not coordinator stages and do not use the autonomy contract.
export const AUTOPILOT_STAGES = [
  'auto-start-task', 'auto-plan-task', 'auto-plan-implementation',
  'auto-implement', 'auto-review-implementation', 'auto-triage-findings',
  'auto-finalize',
];

export async function validateSkills(skillsRoot, { expectedNames = WORKFLOW_SKILLS } = {}) {
  const errors = [];
  const names = new Set();
  const root = resolve(skillsRoot);
  const entries = (await readdir(root, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() || entry.isSymbolicLink())
    .sort((a, b) => a.name.localeCompare(b.name));
  const directories = entries.map((entry) => entry.name);

  for (const name of expectedNames) {
    if (!directories.includes(name)) errors.push(`Missing skill directory: ${name}`);
  }
  for (const name of directories) {
    if (!expectedNames.includes(name)) errors.push(`Unexpected skill directory: ${name}`);
  }

  for (const entry of entries) {
    const skillDir = join(root, entry.name);
    const label = `${entry.name}/SKILL.md`;
    let source;
    try {
      source = await readFile(join(skillDir, 'SKILL.md'), 'utf8');
    } catch (error) {
      errors.push(`${label}: cannot read skill (${error.code})`);
      continue;
    }
    const frontmatter = source.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    if (!frontmatter) {
      errors.push(`${label}: missing YAML frontmatter`);
      continue;
    }
    const document = parseDocument(frontmatter[1]);
    if (document.errors.length) {
      errors.push(`${label}: invalid YAML (${document.errors[0].message})`);
      continue;
    }
    const metadata = document.toJS();
    const name = metadata?.name;
    const description = metadata?.description;
    if (typeof name !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || name.length > 64) {
      errors.push(`${label}: name must be a lowercase hyphenated identifier (max 64 characters)`);
    } else {
      if (name !== entry.name) errors.push(`${label}: name must match directory ${entry.name}`);
      if (names.has(name)) errors.push(`${label}: duplicate skill name ${name}`);
      names.add(name);
    }
    if (typeof description !== 'string' || !description.trim() || description.length > 1024) {
      errors.push(`${label}: description must be a nonempty string (max 1024 characters)`);
    }

    // Bundled files appear as inline code or Markdown links in the instructions.
    const body = source.slice(frontmatter[0].length);
    const references = new Set();
    for (const match of body.matchAll(/`((?:\.\.\/|\.\/|assets\/|references\/)[^`\s]+)`/g)) {
      references.add(match[1]);
    }
    for (const match of body.matchAll(/\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)) {
      const target = match[1].split('#')[0];
      if (target && !/^[a-z][a-z0-9+.-]*:/i.test(target) && !target.startsWith('/')) {
        references.add(target);
      }
    }
    // Dependencies are mandatory even when an author accidentally removes the link.
    if (AUTOPILOT_STAGES.includes(entry.name)) {
      references.add(`../${entry.name.slice(5)}/SKILL.md`);
      references.add('../autopilot/assets/autonomy-contract.md');
    }
    if (entry.name === 'auto-small-task') {
      references.add('../small-task/SKILL.md');
    }
    if (entry.name === 'autopilot') {
      references.add('assets/autonomy-contract.md');
      for (const stage of AUTOPILOT_STAGES) {
        references.add(`../${stage}/SKILL.md`);
        references.add(`../${stage.slice(5)}/SKILL.md`);
      }
    }
    for (const reference of references) {
      const target = resolve(skillDir, reference);
      const pathFromRoot = relative(root, target);
      if (pathFromRoot === '..' || pathFromRoot.startsWith(`..${sep}`) || isAbsolute(pathFromRoot)) {
        errors.push(`${label}: reference escapes collection: ${reference}`);
        continue;
      }
      try {
        if (!(await stat(target)).isFile()) errors.push(`${label}: reference is not a file: ${reference}`);
      } catch (error) {
        errors.push(`${label}: missing referenced file ${reference} (${error.code})`);
      }
    }
  }
  return { errors, names: [...names].sort() };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const skillsRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../skills');
  try {
    const { errors, names } = await validateSkills(skillsRoot);
    if (errors.length) {
      console.error(errors.join('\n'));
      process.exitCode = 1;
    } else {
      console.log(`Validated ${names.length} dev-workflow skills and their bundled references.`);
    }
  } catch (error) {
    console.error(`Cannot validate collection: ${error.message}`);
    process.exitCode = 1;
  }
}
