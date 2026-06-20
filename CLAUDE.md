# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A shared AI artifacts registry — skills and coding rules — distributed via `npx github:patrykmroz619/AI-artifacts install <scope>`. Consumers run that command inside any project with a `.claude/` or `.cursor/` folder; the CLI detects which tool is present and writes artifacts to the right place.

## CLI commands

```bash
npm run build        # compile cli/ → dist/ (production; excludes tests)
npm test             # compile cli/ → dist-test/, then run node:test suites
npm run verify-e2e   # compile cli/ → dist-test/, then run 4-fixture E2E harness
```

Run the CLI locally against a fixture dir:

```bash
node dist/index.js install coding-workflows --dry-run
```

## Architecture

### Registry content (`artifacts/<scope>/`)

All scope folders live under `artifacts/` at the repo root. Each scope folder is the unit of installation:

- `artifacts/<scope>/RULES.md` — injected verbatim as a managed block into `CLAUDE.md` / `AGENTS.md` of the consumer project. The block is delimited `<!-- BEGIN registry:<scope> --> … <!-- END registry:<scope> -->` so reinstalls replace only that span.
- `artifacts/<scope>/skills/<skill-id>/SKILL.md` — copied to `.claude/skills/<id>/` or `.cursor/skills/<id>/` depending on detected tool.

### CLI source (`cli/`)

TypeScript source compiled to `dist/` (production) or `dist-test/` (tests). Layout:

```
cli/
  index.ts                       # citty root command; subCommands: { install }
  common/
    detect.ts                    # detectTargets() — returns Target[] for .claude/.cursor
    fetch.ts                     # fetchScope() — downloads scope via giget
  commands/install/
    command.ts                   # thin citty CommandDef adapter
    install.ts                   # orchestration logic (no citty dependency)
    skills.ts                    # installSkills action
    rules.ts                     # injectBlock (correctness-critical) + installRules
    test/                        # node:test suites for this command (compiled to dist-test)
```

Two tsconfigs control what goes where:

- `tsconfig.json` — prod build; `rootDir: "cli"`, `outDir: "dist"`, excludes `**/tests/**` and `*.test.ts`/`*.e2e.ts`
- `tsconfig.test.json` — test build; same root, `outDir: "dist-test"`, includes everything

### Detection logic

`detectTargets(cwd)` checks for `.claude/` and `.cursor/` in the CWD. It returns one `Target` per found folder, or throws an actionable error if neither exists. This determines where skills and rules are written.

### Managed-block rule injection

`injectBlock` in `cli/commands/install/rules.ts` is the correctness-critical function. It replaces an existing `<!-- BEGIN registry:<scope> -->…<!-- END registry:<scope> -->` block in place, or appends one if absent. Content outside the block is never touched. Unit tests for this function must pass unchanged after any refactor.

## Distribution

`npx github:patrykmroz619/AI-artifacts install <scope>` works because:

1. npm runs `npm install` (including devDependencies) for git installs
2. The `prepare` script (`npm run build`) compiles `cli/` → `dist/`
3. The `bin` entry points to `dist/index.js`

`dist/` and `dist-test/` are gitignored and never committed.
