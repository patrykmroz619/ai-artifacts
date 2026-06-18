# Shared AI Artifacts Registry — Implementation Plan

## Overview

Turn this repository into a **shared registry of read-only AI artifacts** (skills + `CLAUDE.md`/`AGENTS.md` rules) organized by domain folders, and build a thin **`npx` copy-CLI** that a developer runs from inside any target project to pull one or more domain-folder scopes from the registry on GitHub `main` and install them into whichever AI-tool folders that project already has (`.claude/` and/or `.cursor/`).

This is v1. The frame brief (`frame.md`, HIGH confidence) deliberately narrowed scope to sidestep the hard cross-tool compatibility break points (Cursor `.mdc` glob rules, hooks, global-scope install). What remains is a small, well-bounded build: a folder convention + a fetch-and-write CLI.

## Current State Analysis

- **Greenfield repo.** Root contains only `CLAUDE.md`, `requirements.md`, `README.md` (15 bytes), the `context/` scaffold, and `.claude/` (10xDevs lesson scaffolding). No `package.json`, no source, no tooling.
- **The frame brief locked the v1 shape** (`frame.md` "Locked Decisions"): artifacts are read-only (reinstall overwrites), Claude Code **and** Cursor supported day one, project-scope only (no global), v1 artifact types = **skills + `AGENTS.md`/`CLAUDE.md` rules only**, install model = per-scope fetch CLI (not `git clone`, not the Claude native marketplace).
- **Verified tool paths (current docs, 2026-06-18):**
  - Claude Code skills: `.claude/skills/<id>/SKILL.md`. Plain rules: root `CLAUDE.md`.
  - Cursor skills: loaded from `.cursor/skills/<id>/SKILL.md` (also `.agents/skills/`); we target `.cursor/skills/`. Plain rules: root `AGENTS.md` (cursor.com/docs/rules, cursor.com/docs/skills).
  - `SKILL.md` is a **shared standard** — the same skill folder works in both tools unmodified. No transpiler needed at this scope.
- **`giget` (`/unjs/giget`)** supports subdirectory clone + force overwrite: `downloadTemplate("gh:owner/repo/<subdir>#main", { dir, force: true })`. This is the exact primitive for "fetch one scope folder, overwrite on reinstall."

### Key Discoveries:

- Cursor reads project skills from `.cursor/skills/` (cursor.com/docs/skills "Skill directories") — so the user's `.cursor`-folder detection heuristic is valid for skills.
- Cursor plain project rules are a root `AGENTS.md` file; Claude Code's are a root `CLAUDE.md` file. Both are plain markdown, so **one canonical rule body injects into both** via identical managed-block markers.
- `giget` force-overwrites the target dir, which directly implements the locked **read-only / reinstall-overwrites** update model.
- The registry's own `.claude/` and `CLAUDE.md` are 10xDevs lesson material, **not** registry seed content — do not migrate them (frame seed-content decision rejected this option).

## Desired End State

A developer on either laptop, inside any project that has a `.claude/` and/or `.cursor/` folder, runs:

```
npx <registry-cli> coding-workflows
```

…and every skill and rule in the registry's `coding-workflows/` domain folder is installed into the detected tool folder(s): skills copied to `.claude/skills/` and/or `.cursor/skills/`, rules injected into root `CLAUDE.md` and/or `AGENTS.md` inside replaceable managed blocks. Re-running the command overwrites cleanly without disturbing the project's own skills or hand-written rule content. Passing multiple scopes (`npx <cli> coding-workflows learning`) installs each. Running in a project with neither tool folder errors with actionable guidance.

**Verification:** in a scratch project, the four detection cases (`.claude` only, `.cursor` only, both, neither) behave as specified, and a second run is idempotent.

## What We're NOT Doing

- **No global / per-device install** (no chezmoi, no `~/.claude` or `~/.cursor` writes). Project-scope only.
- **No artifact types beyond skills + plain rules** — no slash commands, hooks, subagents, MCP configs, or Cursor `.mdc` glob rules.
- **No transpiler / format compilation** — v1 uses formats already shared by both tools.
- **No `git clone` of the whole registry**, and **no Claude native marketplace** as the install UX.
- **No version pinning, no `--ref`, no lockfile** — always fetch latest `main` (locked decision).
- **No per-artifact selection within a scope** — a domain folder is the atomic install unit (locked decision).
- **No `list`/discovery command in v1** — availability is documented in the README only.
- **No interactive prompts** — the CLI is non-interactive; missing tool folders error rather than prompt.
- **No auto-creation of `.claude`/`.cursor` folders** — if neither exists, error.
- **No migration of the repo's existing 10xDevs `.claude/` content** into the registry.

## Implementation Approach

Two artifacts ship: (1) the **registry content + conventions** (domain folders, marker contract, seed skill + seed rule, README), and (2) the **CLI** (a small Node package, runnable via `npx`, that wraps `giget` for fetch and does the detect-and-write logic). The CLI lives in this same repo so the registry is self-distributing.

The CLI's flow per invocation:
1. Parse one or more scope names (positional args) + flags.
2. Detect target tool folders: presence of `.claude/` → Claude target; `.cursor/` → Cursor target. If neither, error.
3. For each scope: `giget`-fetch `gh:<owner>/<repo>/<scope>#main` into a temp dir with `force: true`.
4. Read the fetched scope's `skills/*` and `rules/*`.
5. Write skills: copy each `skills/<id>/` folder into each detected tool's skills dir (overwrite).
6. Write rules: for each `rules/<id>.md`, inject its body into each detected tool's root rule file (`CLAUDE.md` / `AGENTS.md`) inside a managed block keyed by artifact id (replace if the block exists, append if not).
7. Print a summary of what was written where.

## Critical Implementation Details

- **Managed-block marker contract (load-bearing).** Injected rules are wrapped so reinstall replaces only the registry's span and never the project's own content:
  ```
  <!-- BEGIN registry:<scope> -->
  ...RULES.md content...
  <!-- END registry:<scope> -->
  ```
  One block per scope. Injection logic: if a block with the same `BEGIN/END` scope key exists, replace everything between (inclusive); otherwise append the block (preceded by a blank line) to the end of the file. If the rule file does not exist and the tool is detected, create it containing just the block.
- **Scope-vs-artifact arg parsing.** Positional args are scope (domain-folder) names only — there is no single-artifact selection in v1. Multiple positionals = multiple scopes. This keeps parsing unambiguous.
- **Force overwrite is intentional, not a bug.** `giget` `force: true` and skill-folder overwrite implement the read-only/reinstall model. Skills are replaced wholesale; only rules use markers (because rule files are shared with the project's own content, skill folders are not).
- **`giget` subdir + ref form** is `gh:<owner>/<repo>/<scope>#main`. The owner/repo must be configurable (a constant resolved from the registry's own `package.json` repository field or a hardcoded constant) so the published CLI points at the right GitHub repo.

## Phase 1: Registry Structure & Conventions + Seed Content

### Overview

Establish the on-disk registry layout, document the conventions (including the managed-block marker contract and the list of available scopes, since there is no `list` command), and author one genuine skill + one genuine rule inside one domain folder to prove the artifact shape the CLI will consume.

### Changes Required:

#### 1. Domain-folder registry layout

**File**: `coding-workflows/` (new domain folder at repo root) with `skills/` and `rules/` subfolders.

**Intent**: Define the canonical registry structure — domain folders at the repo root, each holding a `skills/` dir (folders containing `SKILL.md`) and a `rules/` dir (flat `.md` files). This is the structure the CLI fetches and walks.

**Contract**: Registry layout invariant:
```
<scope>/                     # e.g. coding-workflows/
  RULES.md                   # single rules file; injected as one block into CLAUDE.md / AGENTS.md
  skills/
    <skill-id>/
      SKILL.md               # shared-standard skill, valid in both tools
```
A scope MAY have only `skills/` or only `RULES.md`. The CLI handles whichever are present.

#### 2. Seed skill (one real skill)

**File**: `coding-workflows/skills/<skill-id>/SKILL.md`

**Intent**: Author one genuinely useful, general-purpose skill (not 10xDevs-specific) so the install pipeline can be validated against real content and the repo has an immediate working demo.

**Contract**: Valid `SKILL.md` with YAML frontmatter (`name`, `description`) per the shared skill standard, so it loads in both Claude Code and Cursor unmodified.

#### 3. Seed rule (one real rule file)

**File**: `coding-workflows/RULES.md`

**Intent**: Author one general-purpose rules file whose entire content will be injected as a single managed block into `CLAUDE.md`/`AGENTS.md`.

**Contract**: Plain markdown, no surrounding markers in the source file (the CLI adds the managed-block markers at install time). Content must read correctly when embedded inside a larger rules file.

#### 4. Registry README + conventions doc

**File**: `README.md` (repo root, currently 15 bytes — replace)

**Intent**: Document what the registry is, the available scopes and their artifacts (this is the only discovery mechanism in v1), the install command, the read-only/reinstall model, and the contributor convention for adding artifacts (including the managed-block marker contract and the SKILL.md format requirement).

**Contract**: Must include: the `npx <cli> <scope>` usage, the list of current scopes (`coding-workflows` with its seed skill + rule), the four-case detection behavior, and the marker format. Acts as the human-facing index since there is no `list` command.

### Success Criteria:

#### Automated Verification:

- Registry layout exists: `coding-workflows/skills/<id>/SKILL.md` and `coding-workflows/rules/<id>.md` are present.
- Seed `SKILL.md` has valid YAML frontmatter with `name` and `description` (parse check).
- README contains the install command and the marker-format documentation (grep for `npx` and `BEGIN registry:`).

#### Manual Verification:

- Seed skill content is genuinely useful and general-purpose (not 10xDevs/course-specific).
- Seed rule reads correctly when imagined inside a larger `CLAUDE.md`.
- README is understandable to someone landing on the GitHub repo cold.

**Implementation Note**: After completing this phase and all automated verification passes, pause for manual confirmation before proceeding.

---

## Phase 2: The `npx` Copy-CLI

### Overview

Build the Node CLI that parses scopes, detects tool folders, fetches scopes from GitHub `main` via `giget`, copies skills, and injects rules via managed-block markers. This is the core of the change.

### Changes Required:

#### 1. CLI package scaffold

**File**: `package.json` (new), CLI entry (e.g. `cli/index.mjs` or `src/cli.ts`)

**Intent**: Create a Node package with a `bin` entry so the tool is runnable via `npx`. Add `giget` as a dependency. Keep the runtime Node-native (ESM), no build step required unless TypeScript is chosen.

**Contract**: `package.json` declares `bin: { "<cli-name>": "<entry>" }`, `type: "module"`, `dependencies: { giget: "^<latest>" }`, and a `repository` field (or a hardcoded constant) identifying `<owner>/<repo>` for giget's fetch source. Entry file has a `#!/usr/bin/env node` shebang.

#### 2. Argument parsing

**File**: CLI entry

**Intent**: Parse one or more positional scope names. No single-artifact selection. Support a `--dry-run` flag (print intended writes without writing) to make verification safe.

**Contract**: `<cli> <scope...> [--dry-run]`. Zero scopes → print usage and exit non-zero. Each positional is treated as a domain-folder name to fetch.

#### 3. Tool-folder detection

**File**: detection module (e.g. `cli/detect.mjs`)

**Intent**: Decide install targets from the current working directory. `.claude/` present → Claude target (`.claude/skills/`, `CLAUDE.md`). `.cursor/` present → Cursor target (`.cursor/skills/`, `AGENTS.md`). Both → both. Neither → error.

**Contract**: Returns a list of target descriptors `{ tool, skillsDir, ruleFile }`. If empty, the caller aborts with: a message naming that no `.claude/` or `.cursor/` was found in the cwd and suggesting the user create one (or run inside the right project). Exit non-zero.

#### 4. Scope fetch via giget

**File**: fetch module (e.g. `cli/fetch.mjs`)

**Intent**: Download a single scope folder from the registry on `main` into a temp directory, overwriting any prior temp contents.

**Contract**: `downloadTemplate("gh:<owner>/<repo>/<scope>#main", { dir: <tempScopeDir>, force: true })`. Owner/repo from the package constant. On a 404 / missing scope, surface a clear "scope not found in registry" error and continue to the next scope (or exit, but report which scopes failed).

#### 5. Skill installer

**File**: skill-install module (e.g. `cli/install-skills.mjs`)

**Intent**: Copy each `skills/<skill-id>/` folder from the fetched scope into each detected target's skills dir, overwriting any existing folder of the same id (read-only/reinstall model).

**Contract**: For every `<tempScopeDir>/skills/<id>/`, recursively copy to `<target.skillsDir>/<id>/`, replacing the destination folder entirely. Create the skills dir if absent. Skip silently if the scope has no `skills/`.

#### 6. Rule installer (managed-block injection)

**File**: rule-install module (e.g. `cli/install-rules.mjs`)

**Intent**: Inject the scope's `RULES.md` body into each detected target's root rule file inside a managed block keyed by `registry:<scope>`, replacing an existing block or appending a new one.

**Contract**: Implements the marker contract from Critical Implementation Details. Replace-if-present-else-append semantics keyed on the exact `<!-- BEGIN registry:<scope> -->` / `<!-- END registry:<scope> -->` pair. Create the rule file with just the block if it does not exist. Never modify content outside marked blocks. Skip silently if the scope has no `RULES.md`. This is the one piece worth a small unit test for the replace-vs-append and "preserve surrounding content" cases.

#### 7. Orchestration + summary output

**File**: CLI entry

**Intent**: Tie the steps together: detect once, then for each scope fetch → install skills → install rules; collect and print a summary of every file/block written and where. Honor `--dry-run`.

**Contract**: Exit zero only if all requested scopes installed to all detected targets. Summary lists, per scope, the skills copied and rules injected per tool. `--dry-run` prints the same summary prefixed as planned writes, touching nothing.

### Success Criteria:

#### Automated Verification:

- Package installs / resolves `giget`: `npm install` succeeds.
- CLI runs without args and exits non-zero with usage text.
- Rule-injection unit test passes: replace-existing-block, append-new-block, and preserve-surrounding-content cases.
- `--dry-run` against a fixture project writes nothing (no filesystem diff).
- Lint/type check passes (if TypeScript chosen): `npm run lint` / `npm run typecheck`.

#### Manual Verification:

- Running the CLI for the seed scope in a project with `.claude/` only installs the seed skill to `.claude/skills/` and injects the seed rule into `CLAUDE.md`.
- Same for `.cursor/` only (`.cursor/skills/` + `AGENTS.md`).
- Re-running is idempotent — rule blocks are replaced not duplicated, skill folder is overwritten, surrounding hand-written rule content is untouched.

**Implementation Note**: After completing this phase and all automated verification passes, pause for manual confirmation before proceeding.

---

## Phase 3: Distribution Wiring & End-to-End Verification

### Overview

Make the CLI cleanly invokable via `npx` from the published registry repo and verify the whole system across all detection cases and the reinstall path. Finalize usage docs.

### Changes Required:

#### 1. npx / bin distribution wiring

**File**: `package.json`, `.npmignore` or `files` field

**Intent**: Ensure the package is runnable via `npx <cli>` — either published to npm or invoked via `npx github:<owner>/<repo>`. Confirm the `bin` entry resolves and the registry constant points at the correct GitHub `owner/repo`.

**Contract**: `bin`, `files` (include CLI source + needed runtime files), and the GitHub source constant are consistent. Document in README whether install is `npx <published-name>` or `npx github:<owner>/<repo>`.

#### 2. End-to-end verification harness

**File**: a scratch verification procedure (documented in README or a `scripts/verify` note; no test framework required)

**Intent**: Verify the four detection cases and idempotency against the real registry on `main`.

**Contract**: Procedure covers: (a) `.claude` only, (b) `.cursor` only, (c) both, (d) neither (expect guided error); plus a second run proving idempotent rule replacement and skill overwrite.

#### 3. Usage docs finalization

**File**: `README.md`

**Intent**: Finalize the install/usage section with the exact `npx` invocation, multi-scope example, the detection/behavior matrix, and the reinstall-to-update note.

**Contract**: README's install section matches the shipped `bin` name and source; lists `coding-workflows` as the available scope; states the read-only/reinstall-overwrites update model and the neither-folder error behavior.

### Success Criteria:

#### Automated Verification:

- `npx`-style invocation resolves the bin and runs (e.g. `node <entry> --help` or `npm pack` + local `npx`).
- A scripted run against the seed scope into a temp `.claude` fixture produces the expected files (skill folder present, `CLAUDE.md` contains the keyed block).

#### Manual Verification:

- All four detection cases behave as specified in a real scratch project.
- Second run is idempotent (no duplicate blocks, project content preserved).
- README install instructions, followed literally on a clean machine, succeed.

**Implementation Note**: Final phase — after verification, confirm with the human that the end-to-end flow works on a real project before considering v1 done.

---

## Testing Strategy

### Unit Tests:

- Rule-injection function: replace-existing-block, append-new-block, create-file-when-absent, and "content outside markers is byte-for-byte preserved."
- Arg parser: zero scopes errors; multiple scopes parse to a list.
- Detection: maps `.claude`/`.cursor` presence to the right target descriptors; neither → error.

### Integration Tests:

- Fetch-and-install the seed scope into a temp fixture with each detection configuration; assert resulting file tree and `CLAUDE.md`/`AGENTS.md` contents.

### Manual Testing Steps:

1. In a temp project with only `.claude/`, run the CLI for `coding-workflows`; confirm skill in `.claude/skills/` and block in `CLAUDE.md`.
2. Repeat with only `.cursor/`; confirm `.cursor/skills/` and `AGENTS.md`.
3. Repeat with both present; confirm both.
4. In a temp project with neither, confirm a guided non-zero error and no folders created.
5. Add a hand-written rule above/below the managed block, re-run, and confirm only the block changed.

## Performance Considerations

Negligible — each invocation fetches one small tarball per scope and copies a handful of files. `giget`'s offline cache (`preferOffline`) is not needed for v1 but is available if cold-fetch latency becomes annoying.

## Migration Notes

None — greenfield. Do **not** migrate the repo's existing `.claude/` (10xDevs lesson) content into the registry; it is course scaffolding, not registry seed content.

## References

- Frame brief: `context/changes/registry-setup/frame.md`
- Requirements: `requirements.md`
- giget programmatic API + subdir clone: `/unjs/giget` (downloadTemplate, `gh:owner/repo/subdir#ref`, `force`)
- Cursor skill/rule paths: cursor.com/docs/skills (`.cursor/skills/`), cursor.com/docs/rules (`AGENTS.md`)
- Claude Code skill/rule paths: code.claude.com/docs/en/skills, root `CLAUDE.md`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Registry Structure & Conventions + Seed Content

#### Automated

- [x] 1.1 Registry layout exists: `coding-workflows/skills/<id>/SKILL.md` and `coding-workflows/rules/<id>.md` present
- [x] 1.2 Seed `SKILL.md` has valid YAML frontmatter with `name` and `description`
- [x] 1.3 README contains install command and marker-format documentation

#### Manual

- [x] 1.4 Seed skill content is genuinely useful and general-purpose
- [x] 1.5 Seed rule reads correctly when embedded in a larger rules file
- [x] 1.6 README is understandable to a cold reader on GitHub

### Phase 2: The npx Copy-CLI

#### Automated

- [x] 2.1 `npm install` succeeds and resolves `giget`
- [x] 2.2 CLI with no args exits non-zero with usage text
- [x] 2.3 Rule-injection unit test passes (replace / append / preserve-surrounding)
- [x] 2.4 `--dry-run` against a fixture writes nothing
- [x] 2.5 Lint/type check passes (if TypeScript chosen)

#### Manual

- [x] 2.6 `.claude`-only install writes seed skill to `.claude/skills/` and injects rule into `CLAUDE.md`
- [x] 2.7 `.cursor`-only install writes to `.cursor/skills/` and `AGENTS.md`
- [x] 2.8 Re-run is idempotent: rule block replaced not duplicated, surrounding content untouched

### Phase 3: Distribution Wiring & End-to-End Verification

#### Automated

- [ ] 3.1 `npx`-style invocation resolves the bin and runs
- [ ] 3.2 Scripted run into a temp `.claude` fixture produces expected files

#### Manual

- [ ] 3.3 All four detection cases behave as specified in a real scratch project
- [ ] 3.4 Second run is idempotent
- [ ] 3.5 README install instructions succeed when followed literally
