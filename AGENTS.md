# Repository guidance

This repository contains 29 dev-workflow agent skills. Consumers install them with
`npx skills add patrykmroz619/ai-artifacts`. There is no custom CLI, artifact scope,
rule injection, build step, or npm publication.

## Layout

- `skills/<name>/SKILL.md`: authoritative instructions, with YAML `name` and
  `description`. Keep the directory name and frontmatter name identical.
- Each skill's `assets/` holds its bundled templates. Resolve these relative to
  the installed skill directory, not the consumer project's working directory.
- `workflow.md`: overview of the workflow and its artifact contracts.
- `scripts/`: collection validation and its tests.

The eight autonomous pipeline stages depend on their corresponding core skill and
`autopilot/assets/autonomy-contract.md`. Keep these references relative.
The full collection is assumed to be installed; runtime dependency preflights are unnecessary.
`autopilot` requires all eight autonomous stages and their core skills.
`auto-small-task` depends only on `small-task`, including its `assets/task.md` template.
It is a direct shortcut, not an autopilot stage, and does not use the autonomy contract.
Shortcut tasks use one `specs/tasks/{task}/task.md`; keep the full pipeline unchanged.

## Checks

```bash
npm ci
npm run validate
npm test
npx skills add ./skills --list
```

The list must contain exactly the 29 skills under `skills/`. Test installations
in a temporary consumer project, not this checkout, so installed copies do not
become part of the source collection. Third-party authoring tools are local
dependencies and must not be committed.

Consumer workflow state remains in `specs/`; the installation migration does not
change those paths, skill names, approval gates, or task statuses.
