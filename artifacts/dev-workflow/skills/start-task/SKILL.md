---
name: start-task
description: Start a new task in the dev-workflow — create its specs/tasks/{task}/ workspace with a brief task-info.md source-of-truth and, optionally, a git branch. Use whenever the user runs /start-task, wants to start/begin/pick up a task, work on a ticket or issue, or is about to begin a fresh piece of work and needs a home for its planning artifacts — even if they don't say "start-task". Runs after /init-workflow, before /plan-task; reads specs/workflow-config.md to fetch task details from the configured tracker and propose a branch name.
---

# /start-task — Start a task

Open a workspace for a new task: a `specs/tasks/{task-name}/` folder with `task-info.md` capturing
what the task is, and (optionally) a git branch to do the work on. This is the handoff point from
project setup (`/init-workflow`) to actual work (`/plan-task` and beyond).

`task-info.md` is the task's **source of truth** — a brief synthesis of what will be done, drawn from
your task tracker and from what you tell the agent. It stays lean on purpose: detailed planning is
`/plan-task`'s job, not this skill's.

## What it produces

```
specs/tasks/{task-name}/
└── task-info.md # brief source-of-truth for the task
```

…plus, when you opt in, a git branch for the task. Branches map to the **task**, not to subtasks.

## Process

### Step 1: Check preconditions

This skill builds on the workspace `/init-workflow` creates. Confirm `specs/workflow-config.md`
exists. If `specs/` is missing entirely, stop and point the user to `/init-workflow` first — without
it there's no config to read and no `tasks/` root to write into. (If `specs/tasks/` is missing but
the rest is present, just create it; don't send the user back to init for that.)

Read `specs/workflow-config.md` now and keep it in mind for the rest of the run: the **task
management** section tells you whether and how to fetch task details, and the **git conventions**
section gives you the branch-naming pattern.

### Step 2: Identify the task

You need two things: a short human title and (if a tracker is configured) the task identifier.

- **If a task management system is configured** (per the config), ask the user for the task
  identifier — the ticket key, issue number, or URL. Then **fetch the details** through the recorded
  access mechanism (MCP server, a CLI such as `gh`, or REST). Pull the title, description, and any
  acceptance criteria so you don't make the user retype what the tracker already knows.
  - If the integration is configured but turns out to be unavailable (auth expired, MCP tool absent,
    network down), say so and fall back to asking the user for the details by hand — don't silently
    invent them.
- **If no tracker is configured, or the user is starting ad-hoc work**, ask what they want to work on
  in their own words. A sentence or two is enough.
- **If the user's opening message already describes the task**, use it — don't ask redundant
  questions. Only ask for what's genuinely missing.

The point of this step is to land on a **clear goal** — an unambiguous statement of what will be
built or changed. If the initial input or the fetched ticket is vague, thin, or missing the actual
objective ("fix the thing", an empty ticket body, a one-word title), don't paper over it: ask the
user to describe what they want to do or to clarify the goal, and loop until you can state it
plainly. A sharp goal here is what makes `/plan-task` useful later; a fuzzy one propagates.

Prefer `AskUserQuestion` for the structured choices (e.g. "fetch from the tracker or enter details
manually?"); use plain prose for open-ended input like pasting a ticket key or describing the work.

### Step 3: Derive the task name

Turn the title into a short, filesystem-friendly slug for the folder name — lowercase, hyphenated,
no spaces or special characters (e.g. "Add OAuth login" → `add-oauth-login`). The slug alone is
enough; no need to fold the ticket id into the folder name (the id lives inside `task-info.md`).
Propose the slug and let the user adjust.

**Before writing, check whether `specs/tasks/{task-name}/` already exists.** If it does, this is
likely a resumed task: read the existing `task-info.md`, show it, and ask whether to continue with it
(fill any gaps) or pick a different name — don't clobber a workspace the user already started.

### Step 4: Write task-info.md

Write `specs/tasks/{task-name}/task-info.md` from the bundled template at `assets/task-info.md`
(resolve relative to this skill's directory). Substitute the angle-bracketed placeholders with what
you gathered:

- **title**, **ID / link**, and **Source** from Step 2.
- **Summary** — synthesize what the task is and what will be done, combining the tracker description
  and the user's input. Aim for brevity, but **don't drop details to hit a length** — if the sources
  are rich, capture everything that matters (constraints, specific behaviors, edge cases mentioned).
  The artifact stays short when the inputs are short, and grows only as far as the inputs demand.
- **Acceptance hints** — any "done when" cues or acceptance criteria from the tracker or the user.
  Preserve all of them when several are given. If there are none, remove the section rather than
  leaving an empty placeholder.

Leave the **Branch** line for Step 5 to fill in (or set it to "none" if the user skips branching).

### Step 5: Propose a branch

A branch isn't mandatory, but it's the common case. Because the right base depends on where the user
currently is in git, **detect the state first, then ask** rather than assuming:

1. Inspect the repo: current branch, whether the working tree is clean or dirty, the default branch
   (e.g. `main`/`master`), and whether a remote is configured. A few quick `git` reads cover this.
2. Propose a branch name following the **branch naming** pattern in `workflow-config.md` (fall back to
   any pattern in the repo's rules files, or a sensible default like `feat/{slug}` if none is set).
3. Use `AskUserQuestion` to let the user decide:
   - **Base** — branch off the up-to-date default branch (fetch + fast-forward it first), off the
     current HEAD as-is, or skip creating a branch and work where they are.
   - Confirm or **edit the proposed name**.
4. Act on the choice. If they chose the updated default but the working tree is dirty, warn that the
   changes need to be stashed or committed first, and let them decide — don't move their work around
   without consent. If fetch/pull fails (offline, no remote), say so and offer to branch from the
   local default instead.

Whatever happens, record the result on the **Branch** line in `task-info.md` (the branch name, or
"none" if they skipped it).

### Step 6: Summarize and point the way

Print a short status block:

```
specs/tasks/{task-name}/task-info.md   [created | resumed]
branch                                 <name | none>
```

Then close with the next step and stop — don't chain into another skill:

- **Next step:** run `/plan-task` to break this task into subtasks (or decide it needs none) and set
  the overall definition of done. Copy it to the clipboard first
  (best-effort: `Set-Clipboard`/`pbcopy`/`xclip`) — tell the user "(copied to clipboard)" if it succeeds.

## Notes

- **task-info.md is a brief, not a spec.** Capture what the task *is* — title, identity, summary,
  acceptance hints — faithfully and completely, but resist front-loading *implementation* detail
  (how to build it). That altitude belongs to `/plan-task` and `/plan-implementation`. Short inputs
  yield a short artifact; detailed inputs are preserved in full.
- **Honor the configured integration.** Fetch from the tracker when it's actually available, and fall
  back to manual input transparently when it isn't — never fabricate ticket details.
- **Don't clobber existing work.** A re-run on an existing task name resumes that workspace rather
  than overwriting it.
- **The branch belongs to the task.** Downstream skills infer the active task from the current
  branch, so a clear, conventional branch name pays off later.
