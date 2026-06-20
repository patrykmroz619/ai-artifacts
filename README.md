# AI Artifacts Registry

A shared registry of reusable AI artifacts — skills and coding rules — for use across projects with **Claude Code** and **Cursor IDE**.

## Install

From inside any project that has a `.claude/` and/or `.cursor/` folder, run:

```bash
npx @patryk.mroz/artifacts install <scope>
```

Example — install everything in the `coding-workflows` scope:

```bash
npx @patryk.mroz/artifacts install coding-workflows
```

Install multiple scopes at once:

```bash
npx @patryk.mroz/artifacts install coding-workflows learning
```

Preview what will be written without making changes:

```bash
npx @patryk.mroz/artifacts install coding-workflows --dry-run
```

The CLI detects which AI tools are present in the project and installs artifacts into the right places automatically.

## How it works

The CLI:

1. Detects `.claude/` → installs skills to `.claude/skills/`, injects rules into `CLAUDE.md`
2. Detects `.cursor/` → installs skills to `.cursor/skills/`, injects rules into `AGENTS.md`
3. Both present → installs into both
4. Neither present → exits with an error and actionable guidance

**Artifacts are read-only.** Re-running the command overwrites previously installed artifacts cleanly. It never modifies content outside the managed blocks it owns.

### Rule injection — managed block format

Rules are injected inside clearly marked blocks so reinstalls replace only the registry's span and never your own content:

```
<!-- BEGIN registry:<scope> -->
...RULES.md content...
<!-- END registry:<scope> -->
```

If the block already exists it is replaced in place. If it does not, it is appended. Content outside the blocks is never touched.

## Available scopes

### `coding-workflows`

General-purpose coding skills and standards.

| Type  | ID               | Description                                                   |
| ----- | ---------------- | ------------------------------------------------------------- |
| skill | `commit-message` | Write Conventional Commits messages for staged changes        |
| rules | `RULES.md`       | Comments, scope, change size, security, dependency guidelines |

## Update model

There is no lockfile and no version pinning — the CLI always fetches the latest `main`. To update installed artifacts, re-run the same install command; rule blocks are replaced in place and skill folders are overwritten.

## Detection cases

| `.claude/` | `.cursor/` | Result                                          |
| ---------- | ---------- | ----------------------------------------------- |
| ✓          | —          | Skills → `.claude/skills/`, rules → `CLAUDE.md` |
| —          | ✓          | Skills → `.cursor/skills/`, rules → `AGENTS.md` |
| ✓          | ✓          | Both targets                                    |
| —          | —          | Error: no AI tool folder found                  |
