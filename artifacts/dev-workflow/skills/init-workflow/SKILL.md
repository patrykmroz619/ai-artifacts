---
name: init-workflow
description: Initialize the markdown-artifact dev-workflow in this project — scaffold the specs/ root (workflow-config.md, tasks/) and interview the user to capture task-management, git, changelog, and coding-standards conventions. Use this whenever the user runs /init-workflow, or asks to "set up the dev workflow", "initialize specs", "bootstrap the workflow", "configure the task workflow", or wants a place for task planning/decision/review artifacts to live — even if they don't say "specs" explicitly. This is the one-time entry point that every other dev-workflow skill (/start-task, /plan-task, /plan-implementation, /implement, /review-implementation, /finalize) depends on.
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
├── workflow-config.md # filled from the interview below — task mgmt, git, changelog, coding standards
└── tasks/
    └── .gitkeep # keeps the (initially empty) tasks/ dir tracked in git
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

**`specs/tasks/`** — create the directory, and add an empty `.gitkeep` inside it so the otherwise-empty
dir is tracked in git. /start-task populates it later (one folder per task); the per-task layout is
documented there and in the workflow design, so no README is needed here.

**`specs/workflow-config.md`** — filled in Step 2. If it already exists, don't recreate it; instead
read it and check each section (task management, git conventions, changelog, coding standards) for
completeness. Run the interview **only for the sections that are missing or incomplete**, and ask the
user before changing anything they've already filled in. If it's fully populated, show it and ask
whether to keep it as-is or revisit anything.

### Step 2: Interview to fill `workflow-config.md`

The goal is to record *how* this project's workflow integrates with the outside world, so later
skills can auto-fetch task data, propose branch names, and prompt for changelog entries — and
degrade gracefully to manual input when an integration isn't available.

**Prefer the `AskUserQuestion` tool to put questions to the user** — present the choices (system,
access mechanism, changelog yes/no, etc.) as selectable options rather than asking in free-form prose.
It keeps the interview fast and unambiguous, and the user can always pick "Other" to supply something
not listed (which is how they name a tracker you didn't offer). Fall back to plain prose only for
genuinely open-ended details that don't fit options well — pasted credentials, a project/board key, a
custom branch pattern.

Ask in **small batches** rather than one giant form — group related questions into a single
`AskUserQuestion` call, let earlier answers inform later ones, and keep it conversational. Cover four
areas:

**1. Task management.** Which system, if any. **Ask the user first — never infer the tracker from
what tooling happens to be installed.** Do *not* scan for available MCP servers, CLIs (`gh`, `linear`,
`jira`, etc.), or env vars and then assume the project uses that tracker. The presence of a tool says
nothing about which tracker this project actually uses; only the user knows that. So lead with the
question, not a detection sweep.

Offer Jira, Linear, and GitHub Issues as common examples, but make clear these are only examples —
**the user can name any other tracker** (e.g. Azure DevOps, Asana, Trello, Shortcut, a self-hosted
tool) or choose "none". Only **after** the user has named the tracker (or "none") do you look at
tooling — and then only for *that* tracker: help them wire it up by asking how the agent should access
it — an MCP server, a CLI such as `gh`, a REST API, or manual entry — and walk them through whatever
configuration that mechanism needs (auth, base URL, project/board key, required env vars or tokens).
For a system you don't have a built-in integration for, work with the user to find a usable access
path; if none exists, fall back to manual and record exactly what the user will paste in by hand.

> **Verify availability before recording it.** Once the user has chosen a tracker and an access
> mechanism, confirm that mechanism actually works before recording it — a configured-but-unreachable
> integration is worse than honest "manual", because downstream skills will keep trying it. (This
> check is for the tracker the user picked; it is not a license to go discover trackers by scanning.)
> Check first:
> - **CLI (e.g. `gh`)** — confirm it's installed and authenticated, e.g. `gh auth status`.
> - **MCP server** — check whether the corresponding MCP tools are actually available in this
>   session.
> - **REST API / other** — confirm the credentials and endpoint actually resolve before trusting them.
>
> If the chosen mechanism isn't available, tell the user what's missing and ask them to either
> configure it now or fall back to manual. Record whatever is *actually* usable, and capture the
> access details (endpoint, project key, auth method) in the config's **Notes** so downstream skills
> can reach the tracker.

**2. Git conventions.** Branch naming pattern and commit style. If the repo already has rules files
(e.g. `CLAUDE.md`, `AGENTS.md`, `.cursor/rules`) that specify these, read them and propose those as
defaults rather than asking cold.

**3. Changelog.** **First detect, then ask.** Scan the repo for an existing changelog before
prompting — look for common names at the root and a level or two down (e.g. `CHANGELOG.md`,
`CHANGELOG`, `HISTORY.md`, `CHANGES.md`, `NEWS.md`, a `changelog/` or `changes/` directory, or
changeset tooling like `.changeset/`). Let the finding shape the question:
> - **If a changelog file is found** — don't ask whether one exists. Tell the user what you found,
>   peek at its format (e.g. Keep a Changelog, plain dated entries, changesets), and confirm it's the
>   one the workflow should append to. Record its location and format.
> - **If none is found** — ask whether the project maintains a changelog (perhaps elsewhere) or wants
>   to start one. Only capture location/format if they say yes.
>
> Whether a changelog section ends up in the config is what tells /finalize whether and where to add
> an entry.

**4. Coding standards.** Scan the repo's rules/instruction files — e.g. `CLAUDE.md`, `AGENTS.md`,
`.cursor/rules/` (`.mdc` files), `.cursorrules`, `.github/copilot-instructions.md`, `.windsurfrules`
— for anything that reads like a coding standard (language idioms, naming, formatting, testing, error
handling, file layout). If you find any, **reference the source files rather than copying their
content** — those files stay authoritative; the config's `## Coding standards` section just points
the workflow at them. Fill it with one bullet per file (path + a one-line note on what it covers). If
nothing relevant was found, leave the section out of the written config entirely.

Don't ask the user to restate or duplicate what the referenced files already say — referencing them
is enough. This isn't a place for a separate list of extra conventions: if the project wants more
standards enforced, they belong in a rules file, not duplicated into workflow config.

If `workflow-config.md` already has a `## Coding standards` section, leave the user's content alone —
at most append references to rules files not already mentioned there, and tell the user.

Then write `specs/workflow-config.md` from the bundled template at `assets/workflow-config.md`
(resolve relative to this skill's directory), substituting the captured answers for the
angle-bracketed placeholders. The template has no changelog section: **add a `## Changelog` section
only when the user maintains one**, recording its location/format. If they don't, leave it out
entirely — its absence is what tells /finalize not to prompt for entries.

### Step 3: Summarize and point the way

Print a short status block showing what was created vs. already present:

```
specs/workflow-config.md    [created | completed | present]
specs/tasks/                [created | present]
```

Where `completed` means the artifact already existed and you filled in missing pieces. If you
referenced rules files in `workflow-config.md`'s Coding standards section, call that out so the user
knows to review them.

Then close with two pointers, and stop — don't chain into another skill:

- **Review `workflow-config.md`'s Coding standards section.** It already points at your existing
  rules files; you only need to touch it if the references need adjusting.
- **Next step:** run `/start-task` when you're ready to begin work. It reads `workflow-config.md`
  to fetch task details and propose a branch. Copy it to the clipboard first
  (best-effort: `Set-Clipboard`/`pbcopy`/`xclip`) — tell the user "(copied to clipboard)" if it succeeds.

## Notes

- **Idempotent and gap-filling.** Re-running on a fully set-up project is safe: existing content is
  preserved, missing pieces (a blank config section, an absent file) are filled in, and content the
  user already wrote is only changed if they opt to. A partial setup gets completed, not reset.
- **Commit `specs/`.** It's living documentation; encourage the user to commit it so the workflow
  state is shared.
- **Honest configuration beats optimistic configuration.** Only record an integration as available
  after verifying it. Downstream skills trust this file.
