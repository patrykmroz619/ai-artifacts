---
name: workflow-status
description: Use when resuming work after time away and needing a snapshot of where a dev-workflow task stands and what to do next — "what was I doing", "where did I leave off", "what's the status of this task". Reads task-plan.md and work-items or a shortcut's task.md, checks git state, and recommends the next pipeline command or resuming small-task/auto-small-task. Read-only — never edits task artifacts, code, or git state.
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
For shortcut tasks, reads `specs/tasks/{task}/task.md` instead of pipeline artifacts.
**Produces:** a chat report only — no files.

For pipeline tasks, read [workflow integrity](../plan-task/references/workflow-integrity.md)
and report its phase, evidence, finding, and QA gates without modifying artifacts.

## Process

### Step 1: Resolve the task

Same resolution order as the rest of the workflow: **explicit argument** wins; otherwise **infer from
the current git branch** against the `Branch` line recorded in each task's `task-info.md`
or shortcut `task.md`.

- If `specs/` doesn't exist, say so and point to `/init-workflow`.
- If `specs/tasks/` has no entries, say so and point to `/start-task`.
- If the branch doesn't match any task and none was given, list the task folders under
  `specs/tasks/` (with each one's title from `task-info.md` or `task.md`) and ask which one to report on.

### Step 2: Read the task's artifacts

**Choose the record format first.** If `task.md` exists, use the shortcut path below;
do not expect pipeline artifacts or flag their absence as drift. If both shortcut
and full-pipeline records exist, use explicit ownership/handoff information if
available; otherwise flag ambiguous ownership rather than guessing or converting.
Tasks without `task.md` follow the existing pipeline path:

1. Read `task-info.md` for the title, tracker id, and recorded branch.
2. Read `task-plan.md` in full: Definition of Done, subtask headings with their phase tags and
   `(work-item: slug)` annotations, or the no-subtasks note.
3. For every work-item referenced, check what actually exists on disk:
   - `planned` or later ⇒ expect `work-items/{slug}/implementation-plan.md` (or the task-root
     `implementation-plan.md` on the no-subtasks path) to exist.
   - `reviewed` or later ⇒ expect a matching `review.md` to exist too.
   - Note any mismatch (status claims a phase but the file is missing, or a file exists for a phase
     the status hasn't reached) as a **drift flag** — don't fix it, just report it.
4. Apply the shared status-aware finding table to the complete review ledger,
   including deferred findings and invalid skipped Blockers. Report stale source
   fingerprints, required automated/manual/QA checks without current passing
   evidence, pending retests, and prepared finalization records needing recovery.

**Shortcut path:** read `task.md` in full for title, tracker, Mode, Branch, goal and
acceptance criteria, plan, progress, approvals, implementation notes, self-review,
actual check results, outstanding manual checks, blockers, commit, and completion
policy. Report missing or inconsistent information as drift. Autonomous approvals
marked not applicable are expected, not missing human approvals. Do not infer
completion just because a plan exists. Cross-check `committed` against git history
and flag claimed passing checks without recorded results. A recorded hand-off to
the full workflow takes precedence over resuming the shortcut.

### Step 3: Check git state

1. Current branch vs. the task's recorded `Branch` in its selected record — flag if they differ.
2. `git status` — uncommitted changes present? New/modified files not yet reflected in any
   `implementation-plan.md` or `review.md` are worth surfacing (possible unfinished or unrecorded work).
   For shortcuts, compare against `task.md`'s scope and starting-state record; distinguish
   preserved unrelated changes from unfinished task changes.
3. `git log` on the current branch since it diverged from the default branch — a quick skim to sanity
   check that commits exist for subtasks marked `committed`, and that nothing is marked `committed`
   without a corresponding commit.
   For shortcuts, cross-check the recorded commit subject/branch and completion progress.

Keep this step light — it's a sanity pass, not a full audit. The goal is to catch "the files say X but
the repo says Y", not to re-review the diff.

### Step 4: Determine the next step

**Shortcut tasks:** report the progress and next action from `task.md`. For unfinished
tasks, recommend `/small-task {task}` or `/auto-small-task {task}` according to its
recorded Mode, naming the pending approval, failed check, blocker prerequisite, or
finalization step it will resume. Never route these records to per-work-item skills.
If Mode is missing or ambiguous, flag that and recommend the interactive
`/small-task {task}` rather than assuming unattended authorization. If `handed off`,
recommend the recorded full-workflow command instead. If committed, report local
completion and any remaining manual or remote actions; do not suggest reimplementing
or committing again. Unfinished remote completion may resume the same shortcut,
which checks for existing commits and PRs before acting.

**Pipeline tasks:** use the phase routing below unchanged.

The workflow phase order is `pending → planned → implemented → reviewed → committed`,
produced by `/plan-implementation → /implement → /review-implementation → /finalize`.
For no-subtasks read `**Phase:**` in `task-plan.md`; never infer implementation
from a plan or acceptance from a review. A legacy missing phase is drift: report
the strongest supported evidence and recommend reconciliation by the owning stage.
A plan alone supports at most `planned`; this read-only skill never writes a phase.

- **Multiple subtasks at different phases** → the next command targets the **earliest-phase**
  outstanding subtask (matches the scope-resolution order every other skill already uses), named
  explicitly by slug.
- **A `reviewed` subtask whose `review.md` still has `Status: open` findings** → the next command is
  `/triage-findings`, not `/finalize`. `reviewed` alone doesn't mean the findings were dealt with.
- **Deferred/invalidly skipped Blockers** → recommend explicit triage/risk resolution;
  they still gate. Missing/stale verification or review coverage needs evidence
  refresh; required QA gaps or pending retests need `/run-qa`, not `/finalize`.
- **A prepared finalization matching an existing code commit** → recommend
  `/finalize` to recover the ledger, not another implementation/commit cycle.
- **All subtasks `committed`** (or the no-subtasks path fully done) → say the task is complete; if a PR
  was never opened, suggest `/finalize` can still prepare one.
- **Drift flagged in Step 2** → mention it before the recommendation; if it makes the "next step" itself
  ambiguous (e.g. status says `reviewed` but no `review.md` exists), say so explicitly instead of
  guessing.

### Step 5: Report

Print a compact status block, then the recommendation as a plain message.

For shortcuts, replace the Subtasks block with Mode, Progress, Approvals (or
autonomous/not applicable), Checks, Blockers, Commit, and Remaining actions from
`task.md`. Keep branch/working-tree flags and the one resolved recommendation.

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

The recommended command names the task explicitly, same as every other pipeline hand-off — this
is a re-entry point, so the next skill can't be assumed to infer the task from the branch. Copy it
to the clipboard (best-effort: `Set-Clipboard`/`pbcopy`/`xclip`), then close with the
recommendation. Put the bolded **(copied to clipboard)** right after the command, only if the copy
succeeded:

> **Next step:** run `/triage-findings add-oauth-login subtask-b` **(copied to clipboard)** — it's reviewed, but its `review.md` still has 1 open Major finding to decide.

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
- **No auto-chain.** Copying the recommended command to the clipboard is a convenience, not an invocation — never run it yourself.
