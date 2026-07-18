---
name: finalize
description: Use after /review-implementation, when a reviewed work-item is ready to commit. Resolves the scope, stages the increment's changes, suggests a commit message following the project's conventions, commits, and advances the covered subtasks to "committed" in task-plan.md. On the increment that completes the task, also adds the changelog entry (folded into the same commit) and prepares a PR. Reads workflow-config.md for git, changelog, and tracker conventions. The final step of the dev-workflow.
---

# /finalize — Commit the increment and wrap up

Commit the work just reviewed for a resolved **work-item**, advance its subtasks to `committed`, and — only on the increment that completes the task — fold in the changelog entry and prepare a PR. This is the config-driven, self-detecting final step of the dev-workflow: it reads `workflow-config.md` for git conventions, changelog practice, and tracker integration, and degrades gracefully when something isn't available.

**Reads:** `specs/workflow-config.md` (git conventions, changelog, tracker), `specs/tasks/{task}/task-plan.md` (subtask status + DoD), the work-item's `review.md` (open findings), task artifacts, and the git working tree.
**Produces:** a git commit; status updates in `task-plan.md`; on task completion, a changelog entry (in the same commit) and a prepared/created PR.

## The work-item model

A **work-item** is the unit `/plan-implementation` planned, `/implement` built, and `/review-implementation` reviewed: one subtask, several subtasks, or the whole task, with one `implementation-plan.md` and one `review.md`. `/finalize` commits that work-item as one increment and advances all the subtasks it covers `reviewed → committed`. Status lives only in `task-plan.md`.

**Finalize contract:** resolve the scope, confirm it's cleanly reviewed (warn if not), commit only the resolved increment following the project's git conventions, then advance status. On the task-completing increment, fold in the changelog and prepare the PR. Never push or open a PR without explicit confirmation; never commit changes outside the resolved scope without asking.

## Process

### Step 1: Resolve task and scope, read config

1. **Resolve the task:** explicit task argument > inference from the current git branch > ask the user. Confirm `specs/tasks/{task}/task-plan.md` exists — if not, stop and point to `/plan-task`.
2. **Resolve the scope → work-item:**
   - **Explicit argument** wins: subtask name(s) → map to their work-item; or `--task` for the whole-task increment.
   - **No argument** → the next subtask that's `reviewed` but not yet `committed` in `task-plan.md`.
   - **No-subtasks path** → the whole task.
   - **Ask the user** if the scope is still ambiguous.
3. **Read `specs/workflow-config.md`** and keep it in mind for the rest of the run: **git conventions** (branch naming, commit style) shape the commit message; the **changelog** section (present or absent) decides Step 5; the **task management** section decides the optional tracker update in Step 8.

### Step 2: Commit gate — warn, let the user override

Before staging anything, confirm the scope is cleanly reviewed:

- If the covered subtask is **not yet `reviewed`** (still `pending`/`planned`/`implemented`), surface that — the workflow order is implement → review → triage → finalize.
- Read the work-item's `review.md` (if present) and check for **open Blocker findings** (`Severity: Blocker`, `Status: open`). A Blocker the user consciously closed as `accepted` or `dismissed` in `/triage-findings` is not a gate — only `open` ones are.

If either check is off, **warn and ask** (`AskUserQuestion`) whether to commit anyway or cancel — don't hard-block, but don't proceed silently either. Point at `/triage-findings` as the way to resolve open findings properly, but the decision is theirs. If the scope is clean (`reviewed`, no open Blockers), continue without prompting.

### Step 3: Determine the increment

1. Inspect the working tree: `git status` and `git diff` for staged/unstaged changes.
2. Map the work-item to its expected changed files using the plan's **Target Structure** and the changes recorded in `review.md` / `## Implementation Notes`.
3. **If the working tree has changes beyond the resolved scope**, ask (`AskUserQuestion`): commit **only the scope-related files**, or **everything**. Don't sweep unrelated changes into the increment by default.

### Step 4: Detect task completion

This increment **completes the task** when, after it, no subtasks remain outstanding — i.e. every other subtask is already `committed` and none are `pending`/`planned`/`implemented`/`reviewed` — or this is the whole-task / no-subtasks path. Determine this now; it gates Steps 5 and 8.

### Step 5: Changelog (only when completing the task)

Only if **both**: this is the task-completing increment **and** the project practices a changelog (a `## Changelog` section exists in `workflow-config.md`):

1. Add an entry in the configured file and format (e.g. Keep a Changelog, dated entries, changesets), describing the task's user-facing change — drawn from `task-info.md` / the task's Definition of Done.
2. **Stage it so it lands in this same commit.** The changelog entry is part of the completing commit, not a separate one.

If the config has no changelog section, skip this step entirely — its absence is the signal not to prompt.

### Step 6: Commit

1. **Suggest a commit message** following the **commit style** in `workflow-config.md` (e.g. Conventional Commits), informed by the subtask(s) and what changed. Reference the tracker id from `task-info.md` if the convention calls for it.
2. Offer (`AskUserQuestion`): **proceed as-is** · **edit the message** · **skip committing**.
3. On proceed/edit: stage the resolved files (scope-only or everything, per Step 3; plus the changelog from Step 5) and commit with the chosen message. On skip: stop here and report — don't advance status for an uncommitted increment.

### Step 7: Update task-plan.md

Advance each covered subtask `reviewed → committed` in `task-plan.md`, preserving its work-item annotation:

```
### 2. `migrate-user-table` — committed (work-item: `data-layer`)
### 3. `backfill-script` — committed (work-item: `data-layer`)
```

For the no-subtasks / whole-task path there is no per-subtask status to advance — the commit is the record. Touch only the status on the covered headings.

### Step 8: On task completion — wrap up

Only when Step 4 determined this completes the task:

1. **Tracker update (optional, per config).** If a task-management integration is configured and available (per `workflow-config.md`), offer to move the ticket to its done/in-review state through the recorded mechanism (MCP/CLI such as `gh`/REST). If it's configured but unavailable, say so and skip — don't fabricate a transition.
2. **Prepare the PR.** Generate a suggested **PR title and body** (summarize the task from `task-info.md`, the subtasks delivered, and notable decisions) and print the exact `gh pr create` command.
   - **If `gh` is available and authenticated** (check, e.g. `gh auth status`), offer (`AskUserQuestion`) to **push the branch and open the PR** for the user. Only push/create on explicit confirmation.
   - **If `gh` is missing or unauthenticated**, fall back to printing the title/body and command for the user to run by hand, and say why.

Never push or open a PR without the user's explicit go-ahead.

### Step 9: Summarize and hand off

Print a tight status block:

```text
Commit:  <short sha> <subject>
task-plan.md   subtasks → committed: a, b
Changelog: <added | n/a>     Task complete: <yes | no>
```

If subtasks remain, resolve the exact next command by finding the **earliest-phase** outstanding
subtask in `task-plan.md` (the same earliest-phase-first lookup `/workflow-status` uses) and
naming it explicitly by slug — `/plan-implementation {slug}` if it's still `pending`, or
`/implement {slug}` if it's already `planned` — then copy it to the clipboard
(best-effort: `Set-Clipboard`/`pbcopy`/`xclip`).

Then close, as a **plain message** (not an `AskUserQuestion`), and stop — don't chain
automatically. Append "(copied to clipboard)" only if the copy succeeded:

- **If subtasks remain** (task not complete): > **Next step:** run `/plan-implementation subtask-c` (or `/implement subtask-c` if it's already planned) to start the next increment. (copied to clipboard)
- **If the task is complete:** state that the task is done and, if a PR was prepared/opened, point to it. Nothing left to chain.

## Notes

- **Config-driven and graceful.** Read `workflow-config.md` for git, changelog, and tracker conventions. No changelog section → no changelog step. Tracker or `gh` unavailable → fall back to manual and say so; never fabricate a transition or a remote action.
- **Scope discipline.** Commit only the resolved increment. When the tree holds unrelated changes, ask before sweeping them in — don't bundle silently.
- **Changelog rides the completing commit.** When practiced, the entry is added on the task-completing increment and folded into that same commit, not committed separately.
- **No re-verification here.** This skill trusts `/review-implementation`; it does not re-run the plan's automated checks. A change made after review is the user's responsibility — that's why the commit gate warns rather than guaranteeing green.
- **Confirmation before outward actions.** Committing is local and expected; pushing and opening a PR are outward-facing and require explicit confirmation every time.
- **Status lives in task-plan.md.** This skill advances covered subtasks `reviewed → committed` — the terminal state. There is no separate ledger.
- **No auto-chain.** Summarize, point to the next increment or declare the task done, and stop. Copying the resolved command to the clipboard is a convenience, not an invocation — never run the next skill yourself.
