---
name: workflow-status
description: Use when resuming work after time away and needing a snapshot of where a dev-workflow task stands and what to do next — "what was I doing", "where did I leave off", "what's the status of this task". Resolves the active task, reads task-plan.md and its work-items, checks git state, and reports each subtask's phase plus the one recommended next command. Read-only — never edits task artifacts, code, or git state.
---

# /workflow-status — Where things stand, and what's next

Give a fast, accurate snapshot of an in-progress task: which subtasks (or the whole task) are at
which phase, whether the artifacts on disk actually back up what `task-plan.md` claims, whether the
working tree or branch is out of sync with that, and — bottom line — **the one command to run next**.
This is the re-entry point after stepping away from a task for hours, days, or weeks.

This is a **standalone, read-only** skill. It never writes to `task-plan.md`, never edits source, and
never advances subtask status — a stale or inconsistent status is reported as a flag, not silently
fixed. If something needs correcting, that's a decision for the user or the skill that owns that file.

**Reads:** `specs/workflow-config.md`, `specs/tasks/{task}/task-info.md`, `task-plan.md`, each
referenced work-item's `implementation-plan.md` / `review.md`, and git state (branch, status, log).
**Produces:** a chat report only — no files.

## Process

### Step 1: Resolve the task

Same resolution order as the rest of the workflow: **explicit argument** wins; otherwise **infer from
the current git branch** against the `Branch` line recorded in each task's `task-info.md`.

- If `specs/` doesn't exist, say so and point to `/init-workflow`.
- If `specs/tasks/` has no entries, say so and point to `/start-task`.
- If the branch doesn't match any task and none was given, list the task folders under
  `specs/tasks/` (with each one's title from `task-info.md`) and ask which one to report on.

### Step 2: Read the task's artifacts

1. Read `task-info.md` for the title, tracker id, and recorded branch.
2. Read `task-plan.md` in full: Definition of Done, subtask headings with their phase tags and
   `(work-item: slug)` annotations, or the no-subtasks note.
3. For every work-item referenced, check what actually exists on disk:
   - `planned` or later ⇒ expect `work-items/{slug}/implementation-plan.md` (or the task-root
     `implementation-plan.md` on the no-subtasks path) to exist.
   - `reviewed` or later ⇒ expect a matching `review.md` to exist too.
   - Note any mismatch (status claims a phase but the file is missing, or a file exists for a phase
     the status hasn't reached) as a **drift flag** — don't fix it, just report it.
4. For a work-item with a `review.md`, note whether it has open `Status: open` Blocker/Major findings
   — relevant context for whether `/finalize` will warn.

### Step 3: Check git state

1. Current branch vs. the task's recorded `Branch` — flag if they differ.
2. `git status` — uncommitted changes present? New/modified files not yet reflected in any
   `implementation-plan.md` or `review.md` are worth surfacing (possible unfinished or unrecorded work).
3. `git log` on the current branch since it diverged from the default branch — a quick skim to sanity
   check that commits exist for subtasks marked `committed`, and that nothing is marked `committed`
   without a corresponding commit.

Keep this step light — it's a sanity pass, not a full audit. The goal is to catch "the files say X but
the repo says Y", not to re-review the diff.

### Step 4: Determine the next step

The workflow phase order is `pending → planned → implemented → reviewed → committed`, produced in turn
by `/plan-implementation → /implement → /review-implementation → /finalize`. For the no-subtasks path,
infer the equivalent phase from which artifacts exist at the task root (no `implementation-plan.md` =
`pending`; plan but no `review.md` = `implemented`; etc.).

- **Multiple subtasks at different phases** → the next command targets the **earliest-phase**
  outstanding subtask (matches the scope-resolution order every other skill already uses), named
  explicitly by slug.
- **All subtasks `committed`** (or the no-subtasks path fully done) → say the task is complete; if a PR
  was never opened, suggest `/finalize` can still prepare one.
- **Drift flagged in Step 2** → mention it before the recommendation; if it makes the "next step" itself
  ambiguous (e.g. status says `reviewed` but no `review.md` exists), say so explicitly instead of
  guessing.

### Step 5: Report

Print a compact status block, then the recommendation as a plain message.

```text
Task:    {title}  ({tracker-id, if any})
Branch:  {current}  (recorded: {task-info branch})
Working tree: {clean | N uncommitted changes}

Subtasks
  1. subtask-a   committed   (work-item: data-layer)
  2. subtask-b   reviewed    (work-item: api)          — 1 open Major finding
  3. subtask-c   pending

Flags: {none | list of drift/mismatch notes from Step 2-3}
```

Close with the recommendation:

> **Next step:** run `/finalize subtask-b` — it's reviewed with no open Blockers.

If nothing is in progress yet (task exists, no subtasks touched), point to `/plan-task` or
`/plan-implementation` as appropriate instead.

## Notes

- **Read-only, always.** This skill diagnoses; it never repairs `task-plan.md`, never edits source, and
  never runs the plan's automated checks. If drift is found, the fix belongs to whichever skill owns
  that artifact (e.g. re-run `/plan-implementation` if a plan file is genuinely missing).
- **One recommendation, not a menu.** Resolve ambiguity yourself using the same earliest-phase-first
  rule the rest of the workflow uses; only ask the user when the task itself is ambiguous (Step 1).
- **Cheap by design.** This is meant to be run often, right after opening the project — keep git
  inspection light (status + a log skim), not a full diff review.
