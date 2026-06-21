---
name: init-workflow
description: Initialize the markdown-artifact dev-workflow in this project — scaffold the specs/ root (coding-standards.md placeholder, workflow-config.md, tasks/) and interview the user to capture task-management, git, and changelog conventions. Use this whenever the user runs /init-workflow, or asks to "set up the dev workflow", "initialize specs", "bootstrap the workflow", "configure the task workflow", or wants a place for task planning/decision/review artifacts to live — even if they don't say "specs" explicitly. This is the one-time entry point that every other dev-workflow skill (/start-task, /plan-task, /plan-implementation, /implement, /review, /finalize) depends on.
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

# /init-workflow — Initialize the dev-workflow

Set up `specs/` — the committed, single source of truth for every dev-workflow artifact — and
capture project-level configuration that the downstream skills read to decide how to integrate with
your task tracker, git, and changelog.

This runs **once per project**, but is safe to re-run. It is idempotent in spirit: it never clobbers
content you've already written. When an artifact already exists, it doesn't blindly skip it — it
**reads it, checks whether the expected information is present, and fills any gaps** (collaborating
with you when a gap needs your input). So a re-run on a half-configured project completes it rather
than leaving holes.

## What it produces

```
specs/
  coding-standards.md   # placeholder — you fill this in manually
  workflow-config.md    # filled from the interview below
  tasks/
    .gitkeep            # keeps the (initially empty) tasks/ dir tracked in git
```

`specs/` is meant to be **committed** — it's living documentation that travels with the repo, so
teammates and future agent sessions share the same source of truth.

## Process

### Step 1: Scaffold the directory structure (create or complete)

For each artifact: if it's missing, create it from the template below. If it already exists, **read
it and reconcile** — confirm the expected sections/fields are present, and fill in anything missing
rather than overwriting what's there. Note the outcome (`created`, `completed`, or `present`) for the
final summary. This matters because the user may have partially filled an artifact, and a re-run
should finish the job, not erase it.

**`specs/coding-standards.md`** — if absent, copy it verbatim from the bundled template at
`assets/coding-standards.md` (resolve relative to this skill's directory). **Before writing it, look
for existing standards:** scan the repo's rules/instruction files — e.g. `CLAUDE.md`, `AGENTS.md`,
`.cursor/rules/` (`.mdc` files), `.cursorrules`, `.github/copilot-instructions.md`, `.windsurfrules`
— for anything that reads like a coding standard (language idioms, naming, formatting, testing, error
handling, file layout). If you find any, **don't copy the content in — reference the source files**
so this artifact points the user to where the standards already live, leaving them to decide what to
pull in or restate here. Fill the template's "References" section with one pointer per file (path + a
one-line note on what it covers); if nothing relevant was found, delete that section before writing.

If `coding-standards.md` already exists, leave the user's content alone — at most append references
to rules files not already mentioned there, and tell the user.

**`specs/tasks/`** — create the directory, and add an empty `.gitkeep` inside it so the otherwise-empty
dir is tracked in git. /start-task populates it later (one folder per task); the per-task layout is
documented there and in the workflow design, so no README is needed here.

**`specs/workflow-config.md`** — filled in Step 2. If it already exists, don't recreate it; instead
read it and check each section (task management, git conventions, changelog) for completeness. Run
the interview **only for the sections that are missing or incomplete**, and ask the user before
changing anything they've already filled in. If it's fully populated, show it and ask whether to keep
it as-is or revisit anything.

### Step 2: Interview to fill `workflow-config.md`

The goal is to record *how* this project's workflow integrates with the outside world, so later
skills can auto-fetch task data, propose branch names, and prompt for changelog entries — and
degrade gracefully to manual input when an integration isn't available.

Ask in **small batches** rather than one giant form — keep it conversational, and let earlier
answers inform later questions. Cover three areas:

**1. Task management.** Which system, if any: Jira, Linear, GitHub Issues, or none. Then how the
agent should access it: an MCP server, a CLI such as `gh`, or manual entry.

> **Verify availability before recording it.** A configured-but-unreachable integration is worse
> than honest "manual", because downstream skills will keep trying it. Check first:
> - **CLI (e.g. `gh`)** — confirm it's installed and authenticated, e.g. `gh auth status`.
> - **MCP server (Jira/Linear)** — check whether the corresponding MCP tools are actually available
>   in this session.
>
> If the chosen mechanism isn't available, tell the user what's missing and ask them to either
> configure one of the supported options now or fall back to manual. Record whatever is *actually*
> usable.

**2. Git conventions.** Branch naming pattern and commit style. If the repo already has rules files
(e.g. `CLAUDE.md`, `AGENTS.md`, `.cursor/rules`) that specify these, read them and propose those as
defaults rather than asking cold.

**3. Changelog.** Whether a changelog is maintained. Only if it is, capture its location and format
(e.g. `CHANGELOG.md`, Keep a Changelog) — this tells /finalize whether and where to add an entry.

Then write `specs/workflow-config.md` from the bundled template at `assets/workflow-config.md`
(resolve relative to this skill's directory), substituting the captured answers for the
angle-bracketed placeholders. The template has no changelog section: **add a `## Changelog` section
only when the user maintains one**, recording its location/format. If they don't, leave it out
entirely — its absence is what tells /finalize not to prompt for entries.

### Step 3: Summarize and point the way

Print a short status block showing what was created vs. already present:

```
specs/coding-standards.md   [created | completed | present]
specs/workflow-config.md    [created | completed | present]
specs/tasks/                [created | present]
```

Where `completed` means the artifact already existed and you filled in missing pieces. If you
referenced rules files in `coding-standards.md`, call that out so the user knows to review them.

Then close with two pointers, and stop — don't chain into another skill:

- **Fill in `specs/coding-standards.md`.** It's a placeholder; the planning, implementation, and
  review skills lean on it, so it's worth a few minutes now.
- **Next step:** run `/start-task` when you're ready to begin work. It reads `workflow-config.md` to
  fetch task details and propose a branch.

## Notes

- **Idempotent and gap-filling.** Re-running on a fully set-up project is safe: existing content is
  preserved, missing pieces (a blank config section, an absent file) are filled in, and content the
  user already wrote is only changed if they opt to. A partial setup gets completed, not reset.
- **Commit `specs/`.** It's living documentation; encourage the user to commit it so the workflow
  state is shared.
- **Honest configuration beats optimistic configuration.** Only record an integration as available
  after verifying it. Downstream skills trust this file.
