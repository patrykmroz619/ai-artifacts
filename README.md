# AI Artifacts Registry

A shared registry of reusable AI artifacts — skills and coding rules — for use across projects with **Claude Code** and **Cursor IDE**.

## Install

From inside any project that has a `.claude/` and/or `.cursor/` folder, run:

```bash
npx github:patrykmroz619/AI-artifacts <scope>
```

Example — install everything in the `coding-workflows` scope:

```bash
npx github:patrykmroz619/AI-artifacts coding-workflows
```

Install multiple scopes at once:

```bash
npx github:patrykmroz619/AI-artifacts coding-workflows learning
```

Preview what will be written without making changes:

```bash
npx github:patrykmroz619/AI-artifacts coding-workflows --dry-run
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

| Type | ID | Description |
|------|----|-------------|
| skill | `commit-message` | Write Conventional Commits messages for staged changes |
| rules | `RULES.md` | Comments, scope, change size, security, dependency guidelines |

## Repository layout

```
<scope>/                     # e.g. coding-workflows/
  RULES.md                   # single rules file; injected as one block into CLAUDE.md / AGENTS.md
  skills/
    <skill-id>/
      SKILL.md               # shared skill, valid in Claude Code and Cursor
cli/                         # npx CLI source
```

## Contributing

To add an artifact:

1. Place it in the correct scope folder following the layout above.
2. **Skills**: create `<scope>/skills/<skill-id>/SKILL.md` with YAML frontmatter:
   ```yaml
   ---
   name: <skill-id>
   description: <one-line description>
   ---
   ```
   The `SKILL.md` format is shared between Claude Code and Cursor — no transpilation needed.
3. **Rules**: create `<scope>/RULES.md` as plain markdown. The CLI injects the entire file content as one managed block into `CLAUDE.md` / `AGENTS.md` — no surrounding markers in the source file. Write content that reads correctly when embedded inside a larger rules file.
4. Update the "Available scopes" table in this README.

## Update model

There is no lockfile and no version pinning — the CLI always fetches the latest `main`. To update installed artifacts, re-run the same install command; rule blocks are replaced in place and skill folders are overwritten.

## Detection cases

| `.claude/` | `.cursor/` | Result |
|-----------|-----------|--------|
| ✓ | — | Skills → `.claude/skills/`, rules → `CLAUDE.md` |
| — | ✓ | Skills → `.cursor/skills/`, rules → `AGENTS.md` |
| ✓ | ✓ | Both targets |
| — | — | Error: no AI tool folder found — create `.claude/` or `.cursor/` first |

## Verification

To verify the four detection cases in a scratch project:

```bash
# Case A — .claude only
mkdir /tmp/test-a && cd /tmp/test-a && mkdir .claude
npx github:patrykmroz619/AI-artifacts coding-workflows
# expect: .claude/skills/commit-message/SKILL.md and CLAUDE.md with managed block

# Case B — .cursor only
mkdir /tmp/test-b && cd /tmp/test-b && mkdir .cursor
npx github:patrykmroz619/AI-artifacts coding-workflows
# expect: .cursor/skills/commit-message/SKILL.md and AGENTS.md with managed block

# Case C — both
mkdir /tmp/test-c && cd /tmp/test-c && mkdir .claude .cursor
npx github:patrykmroz619/AI-artifacts coding-workflows
# expect: both targets written

# Case D — neither
mkdir /tmp/test-d && cd /tmp/test-d
npx github:patrykmroz619/AI-artifacts coding-workflows
# expect: non-zero exit with guidance to create .claude/ or .cursor/

# Idempotency — re-run in test-a; existing content above the managed block is unchanged
cd /tmp/test-a
npx github:patrykmroz619/AI-artifacts coding-workflows
# expect: one block (not two), any hand-written content preserved
```
